"use client"

import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  Package, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

export default function OrderHistory() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  // Simplified query that matches the security rules perfectly
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    // We filter by userId to ensure the security rule "resource.data.userId == request.auth.uid" is satisfied
    return query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: orders, isLoading } = useCollection(ordersQuery)

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase()
    switch (s) {
      case "SUCCESS":
      case "PAID":
        return <Badge className="bg-secondary text-white border-none gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>
      case "PENDING":
      case "MOCK_PENDING":
        return <Badge className="bg-accent text-white border-none gap-1 animate-pulse"><Clock className="h-3 w-3" /> Processing</Badge>
      case "FAILED":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">My Orders</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Loading History...</p>
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-lg rounded-[28px] overflow-hidden bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
              <CardContent className="p-0">
                <div className="p-4 flex gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden relative bg-muted shrink-0 border">
                    <Image 
                      src={order.itemImageUrl || "https://picsum.photos/seed/shop/200/200"} 
                      alt={order.itemName || "Shop Item"} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-headline font-bold text-sm truncate pr-2">{order.itemName || "Unnamed Item"}</h3>
                      <p className="text-primary font-bold text-sm">₹{order.amount}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(order.paymentStatus)}
                      <span className="text-[10px] text-muted-foreground">
                        {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : "just now"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 px-4 py-3 border-t border-dashed flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Order ID</p>
                    <p className="text-[10px] font-mono font-medium truncate max-w-[180px]">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Info</p>
                    <p className="text-[10px] font-medium">{order.deliveryPhone || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[32px] border-2 border-dashed border-muted">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-sm font-bold font-headline text-muted-foreground">No orders yet</p>
            <p className="text-[10px] text-muted-foreground mt-1 px-12">Items you purchase from the Campus Shop will appear here.</p>
            <button 
              onClick={() => router.push("/shop")}
              className="mt-6 text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
            >
              Go to Shop
            </button>
          </div>
        )}

        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[28px] flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary">Secure Payments</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              All transactions are processed securely via Cashfree. For any delivery disputes, please contact campus security with your Order ID.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}