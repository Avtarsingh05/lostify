
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Loader2,
  Package,
  Info,
  ChevronRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function GalleryPage() {
  const router = useRouter()
  const db = useFirestore()
  const [search, setSearch] = useState("")

  // Fetch all items
  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "items"), orderBy("reportedAt", "desc"))
  }, [db])

  const { data: allItems, isLoading } = useCollection(itemsQuery)

  // Filter items for gallery
  const galleryItems = useMemo(() => {
    if (!allItems) return []
    return allItems.filter(item => {
      const isVisible = item.status === "In Custody" || item.status === "Active"
      if (!isVisible) return false
      
      const searchStr = search.toLowerCase()
      return (
        item.name?.toLowerCase().includes(searchStr) ||
        item.category?.toLowerCase().includes(searchStr) ||
        item.locationDescription?.toLowerCase().includes(searchStr)
      )
    })
  }, [allItems, search])

  const inCustodyItems = galleryItems.filter(i => i.status === "In Custody")
  const activeLostItems = galleryItems.filter(i => i.status === "Active")

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-headline font-bold">Campus Gallery</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <p className="max-w-md mx-auto text-[10px] font-bold uppercase tracking-[0.15em] opacity-80 px-1">
          Browse verified found items held by security
        </p>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search item name or block..." 
            className="pl-12 h-14 rounded-2xl shadow-xl border-none bg-white/95 dark:bg-card/90 backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="found" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border">
            <TabsTrigger value="found" className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
              <ShieldCheck className="h-3 w-3" /> Found (In Office)
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
              <Clock className="h-3 w-3" /> Still Missing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="found" className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : inCustodyItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {inCustodyItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:scale-[1.01] transition-transform">
                    <div className="flex p-4 gap-4">
                      <div className="w-24 h-24 rounded-[20px] overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image 
                          src={item.imageUrl || "https://picsum.photos/seed/item/200/200"} 
                          alt={item.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-headline font-bold text-sm truncate pr-2">{item.name}</h3>
                            <Badge className="bg-secondary text-[8px] h-4 font-bold">FOUND</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.locationDescription}
                          </p>
                        </div>
                        
                        <div className="bg-secondary/5 rounded-xl p-2 mt-2 border border-secondary/10">
                          <p className="text-[8px] font-bold text-secondary uppercase tracking-wider">Claim At:</p>
                          <p className="text-[10px] font-bold truncate">{item.storageInfo || "Main Security Post"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message="No verified items in custody." />
            )}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            {activeLostItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {activeLostItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group">
                    <div className="flex p-4 gap-4">
                      <div className="w-24 h-24 rounded-[20px] overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image 
                          src={item.imageUrl || "https://picsum.photos/seed/lost/200/200"} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline font-bold text-sm truncate pr-2">{item.name}</h3>
                          <Badge className="bg-accent text-[8px] h-4 font-bold">LOST</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Last seen: {item.locationDescription}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-2 italic">
                          "{item.description}"
                        </p>
                        <div className="flex justify-end mt-2">
                           <span className="text-[8px] font-bold uppercase opacity-50">
                             Reported {formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}
                           </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message="No active lost reports." />
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[28px] flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary">How to claim?</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Found your item? Visit the specific Security Post mentioned in the item details. You must bring your Student ID and be prepared to unlock or describe the item in detail to the officer.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted/50">
      <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  )
}
