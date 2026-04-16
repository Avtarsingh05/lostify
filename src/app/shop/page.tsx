
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  Loader2, 
  ShieldCheck,
  ShoppingBasket,
  Zap
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function ShopScreen() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const shopItemsQuery = useMemoFirebase(() => 
    query(collection(db, "shopItems"), orderBy("createdAt", "desc")), [db])
  const { data: items, isLoading } = useCollection(shopItemsQuery)

  const handleBuyNow = async (item: any) => {
    if (!user) {
      router.push("/")
      return
    }

    setIsProcessing(item.id)
    
    try {
      // Initialize Cashfree from the global window object (loaded via script tag in layout)
      const Cashfree = (window as any).Cashfree;
      if (!Cashfree) {
        throw new Error("Cashfree SDK not loaded. Please check your connection.");
      }
      
      const cashfree = Cashfree({ mode: "sandbox" });

      // 1. Create Order in Firestore
      const ordersRef = collection(db, "orders")
      const orderData = {
        userId: user.uid,
        itemId: item.id,
        amount: item.price,
        currency: "INR",
        paymentStatus: "PENDING",
        createdAt: new Date().toISOString()
      }
      
      await addDocumentNonBlocking(ordersRef, orderData)

      toast({
        title: "Order Initialized",
        description: `Processing order for ${item.name} via Cashfree...`,
      })

      // Simulate a small delay for payment gateway interaction
      setTimeout(() => {
        toast({
          title: "Payment Gateway Demo",
          description: "This would normally open the Cashfree SDK overlay using a session ID.",
        })
        setIsProcessing(null)
      }, 2000)

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message,
      })
      setIsProcessing(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-header pt-10 pb-16 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-headline font-bold">Campus Shop</h1>
          </div>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest px-1">
            Premium items & Ad Spaces
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-3 border border-primary/10 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-secondary h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Verified Listings</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] h-5">INR Supported</Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="border-none shadow-xl rounded-[28px] overflow-hidden bg-card/50 backdrop-blur-sm group">
                <div className="flex h-40">
                  <div className="w-1/3 relative h-full overflow-hidden">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-2 left-2">
                       <Badge className="bg-black/40 backdrop-blur-md border-none text-[8px] h-4">₹{item.price}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-headline font-bold leading-tight line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => handleBuyNow(item)}
                        className="flex-1 rounded-xl h-10 gradient-header text-[10px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                        disabled={isProcessing === item.id}
                      >
                        {isProcessing === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-3 w-3 mr-2" />
                        )}
                        Buy with Cashfree
                      </Button>
                      <button className="bg-muted p-2.5 rounded-xl hover:bg-muted/80 transition-colors">
                        <ShoppingBasket className="h-4 w-4 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <ShoppingBag className="h-12 w-12 mb-4" />
            <p className="text-sm font-bold font-headline">Shop is currently empty</p>
            <p className="text-[10px] mt-1">Check back later for new arrivals.</p>
          </div>
        )}

        <div className="bg-muted/50 rounded-2xl p-4 border border-dashed border-muted-foreground/20 text-center">
           <Zap className="h-5 w-5 mx-auto text-accent mb-2" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">List your ad here</p>
           <p className="text-[9px] text-muted-foreground mt-1">Contact forigloohelp@gmail.com for business listings.</p>
        </div>
      </main>
    </div>
  )
}
