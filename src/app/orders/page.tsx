
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  Package, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

export default function OrderHistory() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  // Fetch orders without orderBy to avoid index requirements
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawOrders, isLoading } = useCollection(ordersQuery)

  // Sort in-memory for reliability
  const orders = useMemo(() => {
    if (!rawOrders) return []
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawOrders])

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || ""
    if (s.includes("SUCCESS") || s.includes("PAID") || s.includes("COMPLETED")) {
      return <Badge className="bg-secondary text-white border-none gap-1 h-5 text-[8px] uppercase tracking-tighter"><CheckCircle2 className="h-2.5 w-2.5" /> Paid</Badge>
    }
    if (s.includes("PENDING") || s.includes("MOCK") || s.includes("PROCESSING")) {
      return <Badge className="bg-accent text-white border-none gap-1 animate-pulse h-5 text-[8px] uppercase tracking-tighter"><Clock className="h-2.5 w-2.5" /> Processing</Badge>
    }
    if (s.includes("FAILED") || s.includes("CANCELLED")) {
      return <Badge variant="destructive" className="gap-1 h-5 text-[8px] uppercase tracking-tighter"><AlertCircle className="h-2.5 w-2.5" /> Failed</Badge>
    }
    return <Badge variant="outline" className="opacity-50 h-5 text-[8px] uppercase tracking-tighter">{status || "Pending"}</Badge>
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md lg:max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors active:scale-95">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-headline font-bold">Order History</h1>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-widest px-1">
            Track your campus shop transactions
          </p>
        </div>
      </div>

      <main className="max-w-md lg:max-w-4xl mx-auto px-4 -mt-10 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Fetching Ledger...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <ThreeDCard key={order.id} className="p-0 overflow-hidden border-none shadow-xl bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
              <CardContent className="p-0">
                <div className="p-4 flex gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-muted shrink-0 border border-black/5 shadow-sm">
                    <Image 
                      src={order.itemImageUrl || "https://picsum.photos/seed/shop/200/200"} 
                      alt={order.itemName || "Shop Item"} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-headline font-bold text-sm truncate leading-tight pr-2">{order.itemName || "Campus Item"}</h3>
                        <p className="text-primary font-bold text-sm shrink-0">₹{order.amount}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getStatusBadge(order.paymentStatus)}
                        <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter flex items-center gap-1">
                          <Clock className="h-2 w-2" /> {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : "just now"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5 border-dashed">
                       <div className="flex flex-col">
                          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter">Receipt Number</p>
                          <p className="text-[9px] font-mono font-bold opacity-60">#{order.id.substring(order.id.length - 8).toUpperCase()}</p>
                       </div>
                       <ChevronRight className="h-3 w-3 text-muted-foreground opacity-30" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-primary/60" />
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Transaction Secure</p>
                  </div>
                  <p className="text-[9px] font-bold text-primary/80">{order.deliveryPhone || "Verified Contact"}</p>
                </div>
              </CardContent>
            </ThreeDCard>
          ))
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted/50 flex flex-col items-center">
            <div className="bg-white/50 p-6 rounded-full mb-4 shadow-inner">
               <Package className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-bold font-headline text-muted-foreground uppercase tracking-widest">No Purchases Logged</p>
            <p className="text-[10px] text-muted-foreground mt-2 px-16 leading-relaxed italic">Your transaction history will populate here once you acquire items from the Campus Shop.</p>
            <button 
              onClick={() => router.push("/shop")}
              className="mt-8 bg-primary/10 text-primary px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              Visit Store
            </button>
          </div>
        )}

        <div className="bg-secondary/5 border border-secondary/10 p-5 rounded-[32px] flex items-start gap-4 mb-10">
          <div className="bg-secondary/10 p-2 rounded-xl">
             <CreditCard className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-secondary uppercase tracking-tight">Verified Recovery</h4>
            <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed italic">
              All shop transactions are final. For physical collection, present your Order ID at the designated Campus Hub mentioned in the item description.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
