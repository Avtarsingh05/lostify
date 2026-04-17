
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Package, 
  Info,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow, isBefore, subDays } from "date-fns"

export default function GalleryPage() {
  const router = useRouter()
  const db = useFirestore()
  const [search, setSearch] = useState("")

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "items"), orderBy("reportedAt", "desc"))
  }, [db])

  const { data: allItems, isLoading } = useCollection(itemsQuery)

  const galleryItems = useMemo(() => {
    if (!allItems) return []
    
    // 30 Days Expiry Threshold
    const thirtyDaysAgo = subDays(new Date(), 30)

    return allItems.filter(item => {
      // 1. Basic Status Filter
      const isVisible = item.status === "In Custody" || item.status === "Active"
      if (!isVisible) return false
      
      // 2. Expiry Filter: Only show if reported within 30 days
      const reportDate = item.reportedAt ? new Date(item.reportedAt) : new Date()
      if (isBefore(reportDate, thirtyDaysAgo)) return false

      // 3. Search Filter
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
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl lg:text-4xl font-headline font-bold">Campus Gallery</h1>
          </div>
          <div className="bg-white/20 p-2 lg:p-4 rounded-xl">
            <Package className="h-5 w-5 lg:h-8 lg:w-8" />
          </div>
        </div>
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center gap-2">
           <Badge className="bg-white/20 text-white border-none text-[8px] uppercase tracking-widest font-bold">30-Day Auto Expiry Active</Badge>
           <p className="text-[10px] lg:text-sm font-bold uppercase tracking-[0.15em] opacity-80 px-1">
            Browse verified found items held by security
          </p>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6 lg:space-y-12">
        <div className="relative group max-w-2xl mx-auto lg:max-w-none">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search item name or block..." 
            className="pl-12 h-14 rounded-2xl shadow-xl border-none bg-white/95 dark:bg-card/90 backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="found" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border max-w-2xl mx-auto lg:max-w-none">
            <TabsTrigger value="found" className="rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest gap-2">
              <ShieldCheck className="h-3 w-3 lg:h-4 lg:w-4" /> Found (In Office)
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest gap-2">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4" /> Still Missing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="found" className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : inCustodyItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                {inCustodyItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:scale-[1.01] transition-transform">
                    <div className="flex p-4 gap-4">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[20px] overflow-hidden relative shadow-md bg-muted shrink-0">
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
                            <h3 className="font-headline font-bold text-sm lg:text-base truncate pr-2">{item.name}</h3>
                            <Badge className="bg-secondary text-[8px] lg:text-[10px] h-4 lg:h-5 font-bold">FOUND</Badge>
                          </div>
                          <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.locationDescription}
                          </p>
                        </div>
                        
                        <div className="bg-secondary/5 rounded-xl p-2 mt-2 border border-secondary/10">
                          <p className="text-[8px] lg:text-[10px] font-bold text-secondary uppercase tracking-wider">Claim At:</p>
                          <p className="text-[10px] lg:text-xs font-bold truncate">{item.storageInfo || "Main Security Post"}</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                {activeLostItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group">
                    <div className="flex p-4 gap-4">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[20px] overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image 
                          src={item.imageUrl || "https://picsum.photos/seed/lost/200/200"} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline font-bold text-sm lg:text-base truncate pr-2">{item.name}</h3>
                          <Badge className="bg-accent text-[8px] lg:text-[10px] h-4 lg:h-5 font-bold">LOST</Badge>
                        </div>
                        <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Last seen: {item.locationDescription}
                        </p>
                        <p className="text-[9px] lg:text-[11px] text-muted-foreground mt-2 italic line-clamp-2">
                          "{item.description}"
                        </p>
                        <div className="flex justify-end mt-2">
                           <span className="text-[8px] lg:text-[10px] font-bold uppercase opacity-50">
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

        <div className="bg-primary/5 border border-primary/10 p-5 lg:p-10 rounded-[28px] lg:rounded-[48px] flex items-start gap-3 lg:gap-6">
          <AlertTriangle className="h-5 w-5 lg:h-8 lg:w-8 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs lg:text-xl font-bold text-primary">Expiry Notice</h4>
            <p className="text-[10px] lg:text-sm text-muted-foreground mt-1 leading-relaxed">
              Items are listed in this gallery for exactly 30 days. After 30 days, unclaimed property is transferred to the university's permanent repository or the administrative auction module. Always bring your Student ID when visiting a Security Post for verification.
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
