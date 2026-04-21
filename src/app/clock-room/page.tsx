
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { 
  ArrowLeft, 
  Plus, 
  Briefcase, 
  Clock, 
  MapPin, 
  Loader2,
  ChevronRight,
  Archive,
  History as HistoryIcon,
  ShieldCheck,
  Building
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow, format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function ClockRoomMain() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState("active")

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userData) return null
    const isAdminOrGuard = userData?.role === "ADMIN" || userData?.role === "GUARD";
    if (isAdminOrGuard) {
      return query(collection(db, "clockRoomItems"))
    } else {
      return query(collection(db, "clockRoomItems"), where("userId", "==", user.uid))
    }
  }, [db, user?.uid, userData])

  const { data: rawItems, isLoading: isItemsLoading } = useCollection(itemsQuery)

  const storedItems = useMemo(() => {
    if (!rawItems) return []
    return [...rawItems].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawItems])

  const activeItems = useMemo(() => storedItems.filter(i => i.status !== 'collected' && i.status !== 'archived'), [storedItems])
  const historyItems = useMemo(() => storedItems.filter(i => i.status === 'collected' || i.status === 'archived'), [storedItems])

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const isAdminOrGuard = userData?.role === "ADMIN" || userData?.role === "GUARD";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* MOBILE VIEW (lg:hidden) */}
      <div className="lg:hidden">
        <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
          <div className="max-w-md mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-2 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-headline font-bold">Clock Room</h1>
              </div>
              <Briefcase className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-white/80 text-[10px] uppercase tracking-widest">Uni Mall Storage Protocol</p>
          </div>
        </div>

        <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
          <Button onClick={() => router.push('/clock-room/store')} className="w-full rounded-2xl h-12 gradient-header font-bold shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Store New Item
          </Button>

          <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border">
              <TabsTrigger value="active" className="rounded-xl font-bold text-[10px] uppercase">Active</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-bold text-[10px] uppercase">History</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="m-0 space-y-4">
              {activeItems.length > 0 ? activeItems.map(item => <MobileLuggageCard key={item.id} item={item} router={router} />) : <EmptyState message="No active luggage" />}
            </TabsContent>
            <TabsContent value="history" className="m-0 space-y-4">
              {historyItems.length > 0 ? historyItems.map(item => <MobileLuggageCard key={item.id} item={item} router={router} isHistory />) : <EmptyState message="No history found" />}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* WEB VIEW (hidden on small, flex on lg) */}
      <div className="hidden lg:flex flex-col">
        <div className="gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Luggage Storage Portal</h1>
                <p className="text-xl text-white/70 mt-2">Professional digital protocol for Uni Mall clock room management</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/clock-room/store')} className="h-20 px-10 rounded-[32px] bg-white text-primary hover:bg-white/90 text-xl font-bold shadow-2xl flex gap-3">
                 <Plus className="h-8 w-8" /> Store New Bag
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-10 -mt-24 w-full">
          <div className="grid grid-cols-12 gap-10">
            {/* Sidebar Stats for Web */}
            <div className="col-span-3 space-y-8">
              <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
                <CardContent className="p-10 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Deposits</h3>
                    <p className="text-5xl font-headline font-bold text-primary">{activeItems.length}</p>
                  </div>
                  <div className="pt-6 border-t border-dashed">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lifetime Usage</h3>
                    <p className="text-3xl font-headline font-bold">{historyItems.length + activeItems.length}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-primary/5 border border-primary/10 p-10 rounded-[40px] space-y-4">
                 <ShieldCheck className="h-10 w-10 text-primary" />
                 <h4 className="text-lg font-bold">Campus Security</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   All items are stored in climate-controlled racks within the Uni Mall facility. Digital handshakes are required for every handover.
                 </p>
              </div>
            </div>

            {/* Main List for Web */}
            <div className="col-span-9 space-y-10">
              <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-card/50 backdrop-blur-md rounded-3xl p-1 shadow-xl h-20 mb-10 border border-white/20 w-fit px-2">
                  <TabsTrigger value="active" className="rounded-2xl font-bold text-lg px-8 h-16 data-[state=active]:bg-primary data-[state=active]:text-white">Active Storage</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-2xl font-bold text-lg px-8 h-16 data-[state=active]:bg-primary data-[state=active]:text-white">Audit History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="m-0">
                   {activeItems.length > 0 ? (
                     <div className="grid grid-cols-2 gap-8">
                        {activeItems.map(item => <WebLuggageCard key={item.id} item={item} router={router} />)}
                     </div>
                   ) : <EmptyState message="No active luggage records found." />}
                </TabsContent>

                <TabsContent value="history" className="m-0">
                   {historyItems.length > 0 ? (
                     <div className="grid grid-cols-2 gap-8">
                        {historyItems.map(item => <WebLuggageCard key={item.id} item={item} router={router} isHistory />)}
                     </div>
                   ) : <EmptyState message="No historical storage records found." />}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function MobileLuggageCard({ item, router, isHistory }: { item: any, router: any, isHistory?: boolean }) {
  return (
    <ThreeDCard onClick={() => router.push(`/clock-room/${item.id}`)} className="p-0 overflow-hidden mb-3 shadow-lg bg-card/80 backdrop-blur-sm">
      <div className="flex h-32">
        <div className="w-28 relative overflow-hidden shrink-0">
          <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
          <div className="absolute top-2 left-2">
            <Badge className={`text-[7px] border-none shadow-md ${item.status === 'stored' ? 'bg-primary' : 'bg-accent'}`}>{item.status.toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-headline font-bold text-sm truncate">{item.itemType}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> Rack {item.rackNumber}</p>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-bold opacity-40">{isHistory ? 'COLLECTED' : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
          </div>
        </div>
      </div>
    </ThreeDCard>
  )
}

function WebLuggageCard({ item, router, isHistory }: { item: any, router: any, isHistory?: boolean }) {
  return (
    <ThreeDCard onClick={() => router.push(`/clock-room/${item.id}`)} className="p-0 overflow-hidden border-none shadow-2xl bg-card/80 backdrop-blur-xl group cursor-pointer h-64">
      <div className="flex h-full">
        <div className="w-1/2 relative overflow-hidden">
          <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-6 left-6">
             <Badge className={`h-8 px-4 text-xs font-bold border-none shadow-2xl ${item.status === 'stored' ? 'bg-primary' : item.status === 'collected' ? 'bg-secondary' : 'bg-accent'}`}>
               {item.status.replace('_', ' ').toUpperCase()}
             </Badge>
          </div>
        </div>
        <div className="flex-1 p-10 flex flex-col justify-between min-w-0">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
               <h3 className="text-2xl font-headline font-bold truncate pr-4">{item.itemType}</h3>
               <div className="h-6 w-6 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: item.color }} />
            </div>
            
            <div className="space-y-3">
               <div className="flex items-center gap-3 text-muted-foreground">
                  <Building className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">Rack {item.rackNumber} — Slot {item.slotNumber || 'N/A'}</span>
               </div>
               <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Logged {format(new Date(item.createdAt), 'MMM dd, HH:mm')}</span>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-dashed">
             <div className="flex flex-col">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Storage Lead</p>
                <p className="text-xs font-bold">{item.storedBy || "Authorized Guard"}</p>
             </div>
             <ChevronRight className="h-6 w-6 text-primary group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </ThreeDCard>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-muted/10 rounded-[48px] border-4 border-dashed border-muted-foreground/20 px-6">
      <Archive className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
      <p className="text-lg font-bold text-muted-foreground uppercase tracking-[0.2em]">{message}</p>
    </div>
  )
}
