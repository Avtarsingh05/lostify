
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { 
  ArrowLeft, 
  Plus, 
  Briefcase, 
  Clock, 
  MapPin, 
  Loader2,
  ChevronRight,
  Archive
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function ClockRoomMain() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  // Implement Role-Based Privacy: 
  // Regular users see only their own items. Guards/Admins see everything.
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userData) return null
    
    const isAdminOrGuard = userData?.role === "ADMIN" || userData?.role === "GUARD";
    
    if (isAdminOrGuard) {
      // Staff view: All items
      return query(
        collection(db, "clockRoomItems"),
        orderBy("createdAt", "desc")
      )
    } else {
      // Student view: Only personal luggage
      return query(
        collection(db, "clockRoomItems"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      )
    }
  }, [db, user?.uid, userData])

  const { data: storedItems, isLoading: isItemsLoading, error } = useCollection(itemsQuery)

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdminOrGuard = userData?.role === "ADMIN" || userData?.role === "GUARD";

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-headline font-bold">Clock Room</h1>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-widest">
              Uni Mall Luggage Storage
            </p>
            {isAdminOrGuard && <Badge className="bg-white/20 text-white border-none text-[8px]">STAFF</Badge>}
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center px-1">
          <h2 className="text-[10px] sm:text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> {isAdminOrGuard ? "All Active Records" : "My Stored Luggage"}
          </h2>
          <Button 
            onClick={() => router.push('/clock-room/store')}
            className="w-full sm:w-auto rounded-2xl h-12 px-6 gradient-header font-bold text-xs gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Store New Item
          </Button>
        </div>

        {isItemsLoading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-destructive/10 rounded-[32px] border border-destructive/20">
            <p className="text-sm font-bold text-destructive">Database Query Error</p>
            <p className="text-[10px] text-muted-foreground mt-1">Please try refreshing or contact admin.</p>
          </div>
        ) : storedItems && storedItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {storedItems.map((item) => (
              <ThreeDCard 
                key={item.id} 
                onClick={() => router.push(`/clock-room/${item.id}`)}
                className="p-0 border-none shadow-xl bg-card/80 backdrop-blur-sm group cursor-pointer overflow-hidden rounded-[28px]"
              >
                <div className="flex h-32 sm:h-36">
                  <div className="w-28 sm:w-36 relative overflow-hidden shrink-0">
                    <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-[8px] px-1.5 h-4 border-none ${item.status === 'stored' ? 'bg-primary' : 'bg-secondary'}`}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-headline font-bold text-xs sm:text-base truncate">{item.itemType}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[9px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> Rack {item.rackNumber}
                      </p>
                      <p className="text-[8px] font-bold text-primary mt-0.5 truncate uppercase tracking-tighter">
                        {item.studentName}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-bold uppercase opacity-50">
                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : "just now"}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full border shadow-sm" style={{ backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-[32px] border-2 border-dashed border-muted/50 px-6">
            <Archive className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No active storage found</p>
          </div>
        )}
      </main>
    </div>
  )
}
