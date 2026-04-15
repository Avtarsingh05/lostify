
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Clock, CheckCircle2, History, Loader2, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import Image from "next/image"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"

export default function MyItems() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  // Simplified query without orderBy to avoid index requirement and permission issues
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "items"),
      where("ownerId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawItems, isLoading } = useCollection(itemsQuery)

  // Sort items client-side instead of server-side
  const items = useMemo(() => {
    if (!rawItems) return []
    return [...rawItems].sort((a, b) => {
      const dateA = a.reportedAt ? new Date(a.reportedAt).getTime() : 0
      const dateB = b.reportedAt ? new Date(b.reportedAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawItems])

  const lostItems = items.filter(i => i.type === 'lost')
  const foundItems = items.filter(i => i.type === 'found')
  const claimedItems = items.filter(i => i.status === 'Returned' || i.status === 'Claimed')

  const ItemCard = ({ item }: { item: any }) => (
    <ThreeDCard className="p-0 overflow-hidden mb-4 border-none shadow-lg">
      <div className="flex h-32">
        <div className="w-32 h-full relative">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-headline font-bold text-sm truncate">{item.name}</h3>
              <Badge variant={item.status === 'Returned' ? 'secondary' : 'outline'} className="text-[8px] whitespace-nowrap">
                {item.status}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" /> {item.reportedAt ? formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true }) : "recently"}
            </p>
          </div>
          <div className="flex justify-between items-end">
             <p className="text-[9px] text-muted-foreground truncate italic pr-2">{item.locationDescription}</p>
             <button className="text-primary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                View
             </button>
          </div>
        </div>
      </div>
    </ThreeDCard>
  )

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-headline font-bold">My Reports</h1>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="font-bold text-sm">{items.length}</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10">
        <Tabs defaultValue="lost" className="w-full">
          <TabsList className="w-full bg-card/80 backdrop-blur-md shadow-xl h-14 rounded-2xl p-1 mb-8 border border-white/20">
            <TabsTrigger value="lost" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <History className="h-4 w-4" /> Lost
            </TabsTrigger>
            <TabsTrigger value="found" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <Search className="h-4 w-4" /> Found
            </TabsTrigger>
            <TabsTrigger value="claimed" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Claimed
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <TabsContent value="lost" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                {lostItems.length > 0 ? lostItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/30 p-12 text-center rounded-[32px]">
                    <p className="text-sm text-muted-foreground font-medium">No lost items reported yet.</p>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="found" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                {foundItems.length > 0 ? foundItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/30 p-12 text-center rounded-[32px]">
                    <p className="text-sm text-muted-foreground font-medium">No found items reported yet.</p>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="claimed" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                {claimedItems.length > 0 ? claimedItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <Card className="border-none bg-muted/30 p-12 text-center rounded-[32px]">
                    <p className="text-sm text-muted-foreground font-medium">No items have been claimed yet.</p>
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
