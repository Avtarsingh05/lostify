
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Clock, CheckCircle2, History, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import Image from "next/image"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"

export default function MyItems() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "items"),
      where("ownerId", "==", user.uid),
      orderBy("reportedAt", "desc")
    )
  }, [db, user])

  const { data: items, isLoading } = useCollection(itemsQuery)

  const lostItems = items?.filter(i => i.type === 'lost') || []
  const foundItems = items?.filter(i => i.type === 'found') || []
  const claimedItems = items?.filter(i => i.status === 'Returned' || i.status === 'Claimed') || []

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
          <button className="text-primary text-[10px] font-bold uppercase tracking-widest text-left">
            View Details
          </button>
        </div>
      </div>
    </ThreeDCard>
  )

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-headline font-bold">My Items</h1>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="font-bold">{items?.length || 0} Total</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10">
        <Tabs defaultValue="lost" className="w-full">
          <TabsList className="w-full bg-card shadow-xl h-14 rounded-2xl p-1 mb-8">
            <TabsTrigger value="lost" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <History className="h-4 w-4" /> Lost
            </TabsTrigger>
            <TabsTrigger value="found" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <Package className="h-4 w-4" /> Found
            </TabsTrigger>
            <TabsTrigger value="claimed" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Claimed
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="lost" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {lostItems.length > 0 ? lostItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <p className="text-center text-muted-foreground py-10">No lost items reported.</p>
                )}
              </TabsContent>
              <TabsContent value="found" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {foundItems.length > 0 ? foundItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <p className="text-center text-muted-foreground py-10">No found items reported.</p>
                )}
              </TabsContent>
              <TabsContent value="claimed" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {claimedItems.length > 0 ? claimedItems.map(item => <ItemCard key={item.id} item={item} />) : (
                  <p className="text-center text-muted-foreground py-10">No claimed items yet.</p>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  )
}
