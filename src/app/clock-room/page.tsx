
"use client"

import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Plus, 
  Briefcase, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Archive
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function ClockRoomMain() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "clockRoomItems"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: storedItems, isLoading } = useCollection(itemsQuery)

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
              <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-headline font-bold">Clock Room</h1>
            </div>
            <div className="bg-white/20 p-2.5 rounded-full">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-widest px-1">
            Uni Mall Luggage Storage System
          </p>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> My Stored Items
          </h2>
          <Button 
            onClick={() => router.push('/clock-room/store')}
            className="rounded-xl h-10 px-4 gradient-header font-bold text-xs gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Store New Item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 className="h-8 w-8 animate-spin" />
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
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
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
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">No items stored in clock room.</p>
          </div>
        )}
      </main>
    </div>
  )
}
