"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  Loader2, 
  ShieldCheck,
  ShoppingBasket,
  Zap,
  Mail,
  Phone,
  Truck
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useDoc,
  addDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { createPaymentSession } from "@/app/actions/cashfree"

export default function ShopScreen() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  const [deliveryEmail, setDeliveryEmail] = useState("")
  const [deliveryPhone, setDeliveryPhone] = useState("")

  const shopItemsQuery = useMemoFirebase(() => 
    query(collection(db, "shopItems"), orderBy("createdAt", "desc")), [db])
  const { data: items, isLoading } = useCollection(shopItemsQuery)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userDocRef)

  useEffect(() => {
    if (user) setDeliveryEmail(user.email || "")
    if (userData?.phoneNumber) setDeliveryPhone(userData.phoneNumber)
  }, [user, userData])

  const handleOpenCheckout = (item: any) => {
    if (!user) {
      router.push("/")
      return
    }
    setSelectedItem(item)
    setIsCheckoutOpen(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem || !user || !db) return
    
    if (!deliveryEmail || !deliveryPhone) {
      toast({
        variant: "destructive",
        title: "Missing Info",
        description: "Please provide delivery contact details.",
      })
      return
    }

    setIsProcessing(selectedItem.id)
    setIsCheckoutOpen(false)
    
    try {
      const Cashfree = (window as any).Cashfree;
      if (!Cashfree) {
        throw new Error("Cashfree SDK not loaded. Check your connection.");
      }
      
      const isProd = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION';
      const cashfree = Cashfree({ mode: isProd ? "production" : "sandbox" });

      const orderId = `order_${Date.now()}_${user.uid.substring(0, 5)}`;

      const sessionResult = await createPaymentSession({
        amount: selectedItem.price,
        orderId: orderId,
        customerEmail: deliveryEmail,
        customerPhone: deliveryPhone,
        customerName: userData?.username || user.displayName || "User",
      });

      const ordersRef = collection(db, "orders")
      addDocumentNonBlocking(ordersRef, {
        id: orderId,
        userId: user.uid,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemImageUrl: selectedItem.imageUrl,
        amount: selectedItem.price,
        currency: "INR",
        paymentStatus: sessionResult.isMock ? "MOCK_PENDING" : "PENDING",
        cfOrderId: sessionResult.order_id,
        deliveryEmail,
        deliveryPhone,
        createdAt: new Date().toISOString()
      })

      if (sessionResult.isMock) {
        toast({
          title: "Demo Mode",
          description: "API keys missing in .env. Showing simulated payment process.",
        });
        setTimeout(() => {
          setIsProcessing(null);
          setSelectedItem(null);
          toast({ title: "Success", description: "Mock order placed!" });
          router.push("/orders");
        }, 2000);
        return;
      }

      const checkoutOptions = {
        paymentSessionId: sessionResult.payment_session_id,
        redirectTarget: "_modal",
      };
      
      cashfree.checkout(checkoutOptions);
      setIsProcessing(null);
      setSelectedItem(null);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message,
      })
      setIsProcessing(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-header pt-10 pb-16 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl lg:text-4xl font-headline font-bold">Campus Shop</h1>
          </div>
          <p className="text-[10px] lg:text-sm text-white/70 font-medium uppercase tracking-widest px-1">
            Premium items & Ad Spaces
          </p>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-8 space-y-4 lg:space-y-12">
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-3 lg:p-6 border border-primary/10 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-secondary h-4 w-4 lg:h-6 lg:w-6" />
            <span className="text-[10px] lg:text-sm font-bold uppercase tracking-tight">Verified Listings</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] lg:text-xs h-5 lg:h-7">INR Supported</Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
            {items.map((item) => (
              <Card key={item.id} className="border-none shadow-xl rounded-[28px] overflow-hidden bg-card/50 backdrop-blur-sm group">
                <div className="flex h-40 lg:h-48">
                  <div className="w-1/3 lg:w-40 relative h-full overflow-hidden shrink-0">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-2 left-2">
                       <Badge className="bg-black/40 backdrop-blur-md border-none text-[8px] lg:text-[10px] h-4 lg:h-5">₹{item.price}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-4 lg:p-6 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-sm lg:text-lg font-headline font-bold leading-tight line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        onClick={() => handleOpenCheckout(item)}
                        className="flex-1 rounded-xl h-10 lg:h-12 gradient-header text-[10px] lg:text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                        disabled={!!isProcessing}
                      >
                        {isProcessing === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-3 w-3 mr-2 lg:h-4 lg:w-4" />
                        )}
                        Buy Now
                      </Button>
                      <button className="bg-muted p-2.5 lg:p-4 rounded-xl hover:bg-muted/80 transition-colors">
                        <ShoppingBasket className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <ShoppingBag className="h-16 w-16 mb-4" />
            <p className="text-lg font-bold font-headline">Shop is currently empty</p>
            <p className="text-sm mt-1">Check back later for new arrivals.</p>
          </div>
        )}

        <div className="bg-muted/50 rounded-2xl p-6 lg:p-12 border border-dashed border-muted-foreground/20 text-center">
           <Zap className="h-6 w-6 lg:h-10 lg:w-10 mx-auto text-accent mb-2 lg:mb-4" />
           <p className="text-[10px] lg:text-sm font-bold uppercase tracking-widest text-muted-foreground">List your ad here</p>
           <p className="text-[9px] lg:text-xs text-muted-foreground mt-1">Contact forigloohelp@gmail.com for business listings and premium ad slots.</p>
        </div>
      </main>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" /> Delivery Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Provide contact info for your order delivery.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Email</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  value={deliveryEmail} 
                  onChange={(e) => setDeliveryEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="rounded-xl h-12 pl-10 text-xs"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
              <div className="relative">
                <Input 
                  id="phone" 
                  value={deliveryPhone} 
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="rounded-xl h-12 pl-10 text-xs"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-dashed">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-muted-foreground">Item:</span>
                <span className="font-bold truncate max-w-[200px]">{selectedItem?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold text-primary">₹{selectedItem?.price}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleConfirmPurchase}
              className="w-full h-14 rounded-xl gradient-header font-bold text-sm"
            >
              Confirm & Pay via Cashfree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
