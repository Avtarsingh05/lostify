
"use client"

import { useState, useEffect, useMemo } from "react"
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
  Truck,
  ChevronRight,
  TrendingUp,
  Tag,
  Trophy,
  Sparkles,
  Star
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useDoc,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
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
  const [isPointsCheckoutOpen, setIsPointsCheckoutOpen] = useState(false)
  
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

  // Filtering items by payment type
  const gearItems = useMemo(() => items?.filter(i => !i.paymentType || i.paymentType === 'INR') || [], [items])
  const pointsItems = useMemo(() => items?.filter(i => i.paymentType === 'POINTS') || [], [items])

  const handleOpenCheckout = (item: any) => {
    if (!user) {
      router.push("/")
      return
    }
    setSelectedItem(item)
    if (item.paymentType === 'POINTS') {
      setIsPointsCheckoutOpen(true)
    } else {
      setIsCheckoutOpen(true)
    }
  }

  const handlePointPurchase = async () => {
    if (!selectedItem || !user || !db || !userData) return
    
    const userPoints = userData.points || 0
    if (userPoints < selectedItem.price) {
      toast({
        variant: "destructive",
        title: "Insufficient Points",
        description: `You need ${selectedItem.price - userPoints} more points for this item.`,
      })
      return
    }

    setIsProcessing(selectedItem.id)
    setIsPointsCheckoutOpen(false)

    try {
      const orderId = `reward_${Date.now()}_${user.uid.substring(0, 5)}`;
      const userRef = doc(db, "users", user.uid)
      
      // 1. Deduct points
      updateDocumentNonBlocking(userRef, {
        points: increment(-selectedItem.price),
        updatedAt: new Date().toISOString()
      })

      // 2. Create order
      const ordersRef = collection(db, "orders")
      addDocumentNonBlocking(ordersRef, {
        id: orderId,
        userId: user.uid,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemImageUrl: selectedItem.imageUrl,
        amount: selectedItem.price,
        currency: "POINTS",
        paymentStatus: "COMPLETED",
        deliveryEmail,
        deliveryPhone,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Reward Redeemed!",
        description: `${selectedItem.name} has been added to your collection.`,
      })
      
      router.push("/orders")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Redemption Error",
        description: "Could not process point redemption.",
      })
    } finally {
      setIsProcessing(null)
      setSelectedItem(null)
    }
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
      <div className="gradient-header pt-12 pb-24 px-4 lg:px-10 rounded-b-[48px] lg:rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 lg:gap-8">
            <button onClick={() => router.back()} className="bg-white/20 p-2 lg:p-4 rounded-full hover:bg-white/30 transition-all">
              <ArrowLeft className="h-5 w-5 lg:h-8 lg:w-8" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-6xl font-headline font-bold">Campus Marketplace</h1>
              <p className="text-[10px] lg:text-xl text-white/70 mt-1 uppercase tracking-widest font-medium">Premium Gear & Point Rewards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 lg:px-8 lg:py-4 rounded-2xl lg:rounded-[32px] border border-white/10 w-fit">
            <div className="bg-accent p-2 rounded-xl">
               <Trophy className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
            </div>
            <div className="text-right">
               <p className="text-[8px] lg:text-xs font-bold uppercase tracking-widest opacity-60">Reward Ledger</p>
               <p className="text-sm lg:text-2xl font-black">{userData?.points || 0} PTS</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-8 lg:space-y-16">
        <Tabs defaultValue="premium" className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 lg:mb-12">
            <TabsList className="bg-card/80 backdrop-blur-md rounded-2xl lg:rounded-3xl p-1 shadow-xl h-12 lg:h-20 border border-white/20 w-full lg:w-auto">
              <TabsTrigger value="premium" className="flex-1 lg:flex-none rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-lg px-4 lg:px-8 h-10 lg:h-16 data-[state=active]:bg-primary data-[state=active]:text-white">
                <ShoppingBag className="h-4 w-4 lg:h-6 lg:w-6 mr-2" /> Premium Gear
              </TabsTrigger>
              <TabsTrigger value="points" className="flex-1 lg:flex-none rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-lg px-4 lg:px-8 h-10 lg:h-16 data-[state=active]:bg-accent data-[state=active]:text-white">
                <Sparkles className="h-4 w-4 lg:h-6 lg:w-6 mr-2" /> Reward Store
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-secondary/10 rounded-2xl border border-secondary/20">
               <ShieldCheck className="h-5 w-5 text-secondary" />
               <span className="text-sm font-bold text-secondary uppercase tracking-tight">University Verified Merchant</span>
            </div>
          </div>

          <TabsContent value="premium" className="m-0">
             {isLoading ? <LoadingGrid /> : gearItems.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
                  {gearItems.map(item => <ShopItemCard key={item.id} item={item} onBuy={handleOpenCheckout} processing={isProcessing === item.id} />)}
               </div>
             ) : <EmptyState message="No premium items listed." />}
          </TabsContent>

          <TabsContent value="points" className="m-0">
             {isLoading ? <LoadingGrid /> : pointsItems.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
                  {pointsItems.map(item => <ShopItemCard key={item.id} item={item} onBuy={handleOpenCheckout} processing={isProcessing === item.id} isPoints />)}
               </div>
             ) : <EmptyState message="No rewards available currently." />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cash Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" /> Order Delivery
            </DialogTitle>
            <DialogDescription className="text-sm">Provide your official campus contact details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registry Email</Label>
              <div className="relative"><Input value={deliveryEmail} onChange={(e) => setDeliveryEmail(e.target.value)} className="rounded-xl h-12 pl-10 text-xs" /><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
              <div className="relative"><Input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} className="rounded-xl h-12 pl-10 text-xs" /><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20">
              <div className="flex justify-between items-center text-xs"><span className="font-medium text-muted-foreground">Gear Item:</span><span className="font-bold truncate max-w-[200px]">{selectedItem?.name}</span></div>
              <div className="flex justify-between items-center text-sm mt-2"><span className="font-bold">Total Due:</span><span className="font-black text-primary">₹{selectedItem?.price}</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleConfirmPurchase} className="w-full h-14 rounded-xl gradient-header font-bold text-sm shadow-xl">Pay Securely via Cashfree</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Checkout */}
      <Dialog open={isPointsCheckoutOpen} onOpenChange={setIsPointsCheckoutOpen}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" /> Reward Redemption
            </DialogTitle>
            <DialogDescription className="text-sm">Confirm point exchange for this reward.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-accent/5 p-5 rounded-[24px] border border-accent/20 flex flex-col items-center text-center gap-3">
               <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-md">
                 {selectedItem && <Image src={selectedItem.imageUrl} alt="Reward" fill className="object-cover" />}
               </div>
               <div>
                 <h4 className="font-bold text-lg">{selectedItem?.name}</h4>
                 <div className="flex items-center gap-2 justify-center mt-1">
                    <Badge className="bg-accent text-white border-none font-black">{selectedItem?.price} PTS</Badge>
                 </div>
               </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl space-y-2">
               <div className="flex justify-between items-center text-xs"><span className="font-medium">Current Balance:</span><span className="font-bold">{userData?.points || 0} PTS</span></div>
               <div className="flex justify-between items-center text-xs pt-2 border-t border-black/5"><span className="font-medium">Remaining After:</span><span className="font-bold text-secondary">{(userData?.points || 0) - (selectedItem?.price || 0)} PTS</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handlePointPurchase} className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm shadow-xl">Redeem Reward Now</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShopItemCard({ item, onBuy, processing, isPoints }: { item: any, onBuy: any, processing: boolean, isPoints?: boolean }) {
  return (
    <Card className="border-none shadow-xl rounded-[32px] lg:rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:translate-y-[-8px] transition-all duration-500">
       <div className="aspect-[4/3] lg:aspect-[4/5] relative overflow-hidden">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute top-4 left-4 lg:top-6 lg:left-6">
             <Badge className={`${isPoints ? 'bg-accent' : 'bg-black/60'} backdrop-blur-md border-none text-[10px] lg:text-xs font-black h-7 lg:h-9 px-3 lg:px-5 shadow-2xl`}>
               {isPoints ? `${item.price} PTS` : `₹${item.price}`}
             </Badge>
          </div>
          {isPoints && (
            <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
               <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-accent/20">
                  <Star className="h-3 w-3 lg:h-4 lg:w-4 text-accent fill-accent" />
               </div>
            </div>
          )}
       </div>
       <div className="p-5 lg:p-8 space-y-3 lg:space-y-4">
          <div className="min-h-[50px] lg:min-h-[70px]">
             <h3 className="text-sm lg:text-xl font-headline font-bold truncate leading-tight">{item.name}</h3>
             <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 lg:mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>
          <div className="pt-3 lg:pt-4 border-t border-dashed flex gap-2 lg:gap-3">
             <Button 
               onClick={() => onBuy(item)} 
               className={`flex-1 rounded-xl lg:rounded-2xl h-10 lg:h-14 font-bold text-[10px] lg:text-sm shadow-xl ${isPoints ? 'bg-accent hover:bg-accent/90' : 'gradient-header'}`} 
               disabled={processing}
             >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : isPoints ? <Zap className="h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                {isPoints ? 'Redeem' : 'Acquire'}
             </Button>
             <button className="h-10 w-10 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <ShoppingBasket className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
             </button>
          </div>
       </div>
    </Card>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="rounded-[40px] h-[400px] bg-muted/20 animate-pulse border-none shadow-none" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 lg:py-48 text-center opacity-30">
      <ShoppingBag className="h-16 w-16 lg:h-24 lg:w-24 mb-4" />
      <p className="text-base lg:text-2xl font-bold font-headline uppercase tracking-widest">{message}</p>
      <p className="text-[10px] lg:text-sm mt-2">Inventory is refreshed weekly.</p>
    </div>
  )
}
