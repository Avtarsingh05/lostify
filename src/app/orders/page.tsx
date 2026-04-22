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
  ChevronRight,
  ShieldCheck,
  Receipt
} from "lucide-react"
import { CardContent, Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { formatDistanceToNow, format } from "date-fns"
import Image from "next/image"

export default function OrderHistory() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
  }, [user, isUserLoading, router])

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "orders"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: rawOrders, isLoading } = useCollection(ordersQuery)

  const orders = useMemo(() => {
    if (!rawOrders) return []
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawOrders])

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* MOBILE VIEW (lg:hidden) */}
      <div className="lg:hidden">
        <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[48px] shadow-xl text-white">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
              <h1 className="text-xl font-headline font-bold">Orders</h1>
            </div>
            <ShoppingBag className="h-6 w-6 opacity-40" />
          </div>
        </div>
        <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
           {isLoading ? <div className="py-20 text-center opacity-30"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div> : orders.length > 0 ? (
             orders.map(order => <MobileOrderCard key={order.id} order={order} />)
           ) : <EmptyState />}
        </main>
      </div>

      {/* WEB VIEW (lg:flex) */}
      <div className="hidden lg:flex flex-col">
        <div className="gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Transaction Ledger</h1>
                <p className="text-xl text-white/70 mt-2">Verified secure campus shop acquisitions and receipts</p>
              </div>
            </div>
            <Receipt className="h-20 w-20 text-white/20" />
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-10 -mt-24 space-y-8 w-full">
           {isLoading ? (
             <div className="py-32 flex justify-center opacity-20"><Loader2 className="h-12 w-12 animate-spin" /></div>
           ) : orders.length > 0 ? (
             <div className="space-y-6">
                {orders.map(order => <WebOrderCard key={order.id} order={order} />)}
             </div>
           ) : <EmptyState />}
           
           <div className="bg-secondary/5 border border-secondary/10 p-10 rounded-[40px] flex items-center gap-8">
              <div className="bg-secondary/10 p-5 rounded-3xl"><ShieldCheck className="h-10 w-10 text-secondary" /></div>
              <div>
                 <h4 className="text-xl font-bold text-secondary">Verified Collection Policy</h4>
                 <p className="text-muted-foreground leading-relaxed">Shop acquisitions are finalized instantly. Present the digital receipt in your history to the designated campus recovery hub for physical handover.</p>
              </div>
           </div>
        </main>
      </div>
    </div>
  )
}

function MobileOrderCard({ order }: { order: any }) {
  // Use fallback if itemImageUrl is missing or empty string to prevent Next.js console errors
  const displayImage = order.itemImageUrl && order.itemImageUrl !== "" 
    ? order.itemImageUrl 
    : "https://picsum.photos/seed/order/200/200";

  return (
    <ThreeDCard className="p-0 overflow-hidden shadow-lg bg-card/80 backdrop-blur-sm">
      <div className="p-4 flex gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden relative shrink-0">
          <Image src={displayImage} alt="Item" fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-sm truncate pr-2">{order.itemName}</h3>
             <span className="text-primary font-bold text-sm">₹{order.amount}</span>
          </div>
          <p className="text-[9px] text-muted-foreground font-mono uppercase">#{order.id.slice(-8)}</p>
          <div className="flex justify-between items-end mt-1">
             <Badge className="text-[7px] h-4 bg-secondary">PAID</Badge>
             <span className="text-[7px] font-bold opacity-40">{order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Recently'}</span>
          </div>
        </div>
      </div>
    </ThreeDCard>
  )
}

function WebOrderCard({ order }: { order: any }) {
  // Use fallback if itemImageUrl is missing or empty string to prevent Next.js console errors
  const displayImage = order.itemImageUrl && order.itemImageUrl !== "" 
    ? order.itemImageUrl 
    : "https://picsum.photos/seed/order/400/300";

  return (
    <ThreeDCard className="p-0 overflow-hidden border-none shadow-2xl bg-card/80 backdrop-blur-xl group">
      <div className="flex items-stretch h-48">
        <div className="w-48 relative overflow-hidden shrink-0">
          <Image src={displayImage} alt="Item" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
        <div className="flex-1 p-10 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-2xl font-headline font-bold truncate leading-tight pr-6">{order.itemName}</h3>
              <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Transaction ID: {order.id.toUpperCase()}</p>
            </div>
            <p className="text-3xl font-headline font-black text-primary">₹{order.amount}</p>
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-dashed">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Payment Status</span>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                     <span className="text-sm font-bold text-secondary">Verified Secure</span>
                  </div>
               </div>
               <div className="flex flex-col border-l pl-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Acquired On</span>
                  <span className="text-sm font-bold mt-1">{order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}</span>
               </div>
            </div>
            <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-2 hover:bg-primary hover:text-white transition-all">Download Receipt</Button>
          </div>
        </div>
      </div>
    </ThreeDCard>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24 bg-muted/20 rounded-[40px] border-4 border-dashed border-muted-foreground/20 flex flex-col items-center">
      <Package className="h-16 w-16 text-muted-foreground/20 mb-4" />
      <p className="text-xl font-headline font-bold text-muted-foreground uppercase tracking-widest">No Purchases Logged</p>
    </div>
  )
}
