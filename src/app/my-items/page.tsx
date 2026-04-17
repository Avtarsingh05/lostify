
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Clock, CheckCircle2, History, Loader2, Search, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import Image from "next/image"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { formatDistanceToNow, isBefore, subDays } from "date-fns"
import { useMemo } from "react"

export default function MyItems() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "items"),
      where("ownerId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawItems, isLoading } = useCollection(itemsQuery)

  const items = useMemo(() => {
    if (!rawItems) return []
    return [...rawItems].sort((a, b) => {
      const dateA = a.reportedAt ? new Date(a.reportedAt).getTime() : 0
      const dateB = b.reportedAt ? new Date(b.reportedAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawItems])

  const thirtyDaysAgo = subDays(new Date(), 30)

  const lostItems = items.filter(i => i.type === 'lost')
  const foundItems = items.filter(i => i.type === 'found')
  const claimedItems = items.filter(i => i.status === 'Returned' || i.status === 'Claimed' || i.status === 'Resolved' || i.status === 'In Custody')

  const ItemCard = ({ item }: { item: any }) => {
    const reportDate = item.reportedAt ? new Date(item.reportedAt) : new Date()
    const isExpired = isBefore(reportDate, thirtyDaysAgo) && (item.status !== 'Resolved' && item.status !== 'Returned')
    
    return (
      <ThreeDCard className={`p-0 overflow-hidden mb-3 border-none shadow-lg bg-card/80 backdrop-blur-sm ${isExpired ? 'opacity-70 grayscale-[0.3]' : ''}`}>
        <div className="flex h-28">
          <div className="w-28 h-full relative shrink-0">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            <div className="absolute top-1 left-1 flex flex-col gap-1">
               <Badge className={`text-[8px] h-4 px-1 border-none shadow-sm ${item.type === 'lost' ? 'bg-accent' : 'bg-secondary'}`}>
                  {item.type}
               </Badge>
               {isExpired && <Badge className="bg-destructive text-white text-[7px] h-3 px-1 border-none">EXPIRED</Badge>}
            </div>
          </div>
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <div className="space-y-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-headline font-bold text-xs truncate leading-tight">{item.name}</h3>
                <Badge variant="outline" className={`text-[7px] font-bold h-4 px-1 ${isExpired ? 'border-destructive text-destructive' : 'border-primary/20 bg-primary/5'}`}>
                  {isExpired ? 'Expired' : item.status}
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {item.reportedAt ? formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true }) : "now"}
              </p>
            </div>
            <div className="flex justify-between items-end">
               <p className="text-[8px] text-muted-foreground truncate italic w-2/3">{item.locationDescription}</p>
               <button className="text-primary text-[9px] font-bold uppercase tracking-widest hover:opacity-70">
                  Details
               </button>
            </div>
          </div>
        </div>
      </ThreeDCard>
    )
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
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">My Items</h1>
          </div>
          <Badge className="bg-white/20 text-white border-none gap-1 font-bold">
            <Package className="h-3 w-3" /> {items.length}
          </Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10">
        <Tabs defaultValue="lost" className="w-full">
          <TabsList className="w-full bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-xl h-12 rounded-2xl p-1 mb-6 border border-white/20">
            <TabsTrigger value="lost" className="flex-1 rounded-xl text-[10px] font-headline font-bold gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-white">
              <History className="h-3 w-3" /> Lost
            </TabsTrigger>
            <TabsTrigger value="found" className="flex-1 rounded-xl text-[10px] font-headline font-bold gap-1.5 data-[state=active]:bg-secondary data-[state=active]:text-white">
              <Search className="h-3 w-3" /> Found
            </TabsTrigger>
            <TabsTrigger value="claimed" className="flex-1 rounded-xl text-[10px] font-headline font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <CheckCircle2 className="h-3 w-3" /> Status
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fetching records...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TabsContent value="lost" className="m-0">
                {lostItems.length > 0 ? lostItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/20 p-10 text-center rounded-[24px]">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">No Lost Items</p>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="found" className="m-0">
                {foundItems.length > 0 ? foundItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/20 p-10 text-center rounded-[24px]">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">No Found Items</p>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="claimed" className="m-0">
                {claimedItems.length > 0 ? claimedItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/20 p-10 text-center rounded-[24px]">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">No Claimed Items</p>
                  </Card>
                )}
              </TabsContent>
            </div>
          )}
        </Tabs>
      </main>
    </div>
  )
}
