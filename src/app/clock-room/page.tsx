
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

  // Master Authority Identifiers
  const adminEmails = ["worker@gmail.com", "forigloohelp@gmail.com", "avtarsingh9528972330@gmail.com"];
  const adminUIDs = ["PX8zNjMWBWTFGYnaYWrtxojquD02", "9Qv4QkTuukaYhr2sggnQmQmqgHu1"];

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const isMaster = adminEmails.includes(user.email?.toLowerCase() || "") || adminUIDs.includes(user.uid);
    const hasRole = userData?.role === "ADMIN" || userData?.role === "GUARD";
    return isMaster || hasRole;
  }, [user, userData]);

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    
    // For Staff/Admins, we can show all items or filter differently.
    // For Students, we MUST filter by userId to satisfy security rules.
    if (isAuthorized) {
      return query(
        collection(db, "clockRoomItems"),
        orderBy("createdAt", "desc")
      )
    }

    return query(
      collection(db, "clockRoomItems"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid, isAuthorized])

  const { data: storedItems, isLoading: isItemsLoading, error } = useCollection(itemsQuery)

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-headline font-bold">Clock Room</h1>
            </div>
            <div className="bg-white/20 p-2.5 rounded-full">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-white/80 text-xs font-medium uppercase tracking-widest px-1">
              Uni Mall Luggage Storage System
            </p>
            {isAuthorized && <Badge className="bg-white/20 text-white border-none text-[8px]">STAFF ACCESS</Badge>}
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> {isAuthorized ? "All Stored Items" : "My Stored Items"}
          </h2>
          <Button 
            onClick={() => router.push('/clock-room/store')}
            className="rounded-xl h-10 px-4 gradient-header font-bold text-xs gap-2 shadow-lg shadow-primary/20"
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
            <p className="text-sm font-bold text-destructive">Authorization Error</p>
            <p className="text-[10px] text-muted-foreground mt-1">Wait for profile synchronization or contact admin.</p>
          </div>
        ) : storedItems && storedItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {storedItems.map((item) => (
              <ThreeDCard 
                key={item.id} 
                onClick={() => router.push(`/clock-room/${item.id}`)}
                className="p-0 border-none shadow-xl bg-card/80 backdrop-blur-sm group cursor-pointer"
              >
                <div className="flex h-32">
                  <div className="w-32 relative overflow-hidden shrink-0">
                    <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2">
                      <Badge className={item.status === 'stored' ? 'bg-primary' : 'bg-secondary'}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-sm lg:text-base truncate">{item.itemType}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> Rack {item.rackNumber}, Slot {item.slotNumber}
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] lg:text-[10px] font-bold uppercase opacity-50">
                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : "recently"}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-medium capitalize">{item.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted/50">
            <Archive className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">No items found.</p>
          </div>
        )}
      </main>
    </div>
  )
}
