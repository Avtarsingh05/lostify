
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
  AlertTriangle,
  ChevronRight
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
    const thirtyDaysAgo = subDays(new Date(), 30)

    return allItems.filter(item => {
      const isVisible = item.status === "In Custody" || item.status === "Active"
      if (!isVisible) return false
      
      const reportDate = item.reportedAt ? new Date(item.reportedAt) : new Date()
      if (isBefore(reportDate, thirtyDaysAgo)) return false

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
      <div className="gradient-header pt-12 pb-24 lg:pt-24 lg:pb-48 px-6 rounded-b-[48px] lg:rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-md lg:max-w-7xl mx-auto flex items-center justify-between mb-6 lg:mb-12">
          <div className="flex items-center gap-4 lg:gap-8">
            <button onClick={() => router.back()} className="bg-white/20 p-2 lg:p-4 rounded-full hover:bg-white/30 transition-all active:scale-90">
              <ArrowLeft className="h-5 w-5 lg:h-8 lg:w-8" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-6xl font-headline font-bold">Campus Gallery</h1>
              <p className="text-[10px] lg:text-xl text-white/70 font-medium tracking-wide uppercase lg:normal-case mt-1">Verified lost & found inventory</p>
            </div>
          </div>
          <div className="bg-white/20 p-3 lg:p-8 rounded-2xl lg:rounded-[40px] shadow-2xl border border-white/10 hidden sm:block">
            <Package className="h-6 w-6 lg:h-12 lg:w-12 text-white" />
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-6 -mt-10 lg:-mt-24 space-y-8 lg:space-y-16">
        <div className="relative group max-w-2xl lg:max-w-4xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 lg:h-7 lg:w-7 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search items by name, block or category..." 
            className="pl-14 h-14 lg:h-20 rounded-2xl lg:rounded-3xl shadow-2xl border-none bg-white/95 dark:bg-card/90 backdrop-blur-xl lg:text-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="found" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl lg:rounded-3xl p-1 bg-card shadow-xl h-14 lg:h-20 mb-8 lg:mb-16 border max-w-2xl lg:max-w-3xl mx-auto">
            <TabsTrigger value="found" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-lg uppercase lg:capitalize tracking-widest lg:tracking-normal gap-3">
              <ShieldCheck className="h-4 w-4 lg:h-6 lg:w-6" /> Found Items
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-lg uppercase lg:capitalize tracking-widest lg:tracking-normal gap-3">
              <Clock className="h-4 w-4 lg:h-6 lg:w-6" /> Lost Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="found" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <Loader2 className="h-12 w-12 animate-spin" />
              </div>
            ) : inCustodyItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10">
                {inCustodyItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:scale-[1.03] transition-all hover:shadow-primary/10">
                    <div className="flex flex-col">
                      <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
                        <Image 
                          src={item.imageUrl || "https://picsum.photos/seed/item/400/300"} 
                          alt={item.name} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute top-4 left-4">
                           <Badge className="bg-secondary text-white font-bold h-6 shadow-xl border-none">SECURE STORAGE</Badge>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-headline font-bold text-lg lg:text-xl truncate leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium truncate">{item.locationDescription}</span>
                          </div>
                        </div>
                        
                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Storage Post:</p>
                          <p className="text-sm font-bold truncate mt-0.5">{item.storageInfo || "Main Security Gate"}</p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                           <span className="text-[10px] font-bold uppercase opacity-40">Verified Audit</span>
                           <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message="No verified items currently in security custody." />
            )}
          </TabsContent>

          <TabsContent value="lost" className="space-y-6">
            {activeLostItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10">
                {activeLostItems.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:shadow-accent/10 transition-all">
                    <div className="flex flex-col">
                      <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
                        <Image 
                          src={item.imageUrl || "https://picsum.photos/seed/lost/400/300"} 
                          alt={item.name} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4">
                           <Badge className="bg-accent text-white font-bold h-6 shadow-xl border-none">ACTIVE SEARCH</Badge>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline font-bold text-lg truncate leading-tight flex-1">{item.name}</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-accent" /> Last: {item.locationDescription}
                        </p>
                        <p className="text-sm text-muted-foreground italic line-clamp-3 min-h-[60px] bg-muted/20 p-3 rounded-xl border border-dashed">
                          "{item.description}"
                        </p>
                        <div className="flex justify-end pt-3 border-t border-dashed mt-2">
                           <span className="text-[9px] font-bold uppercase opacity-50 flex items-center gap-1.5">
                             <Clock className="h-3 w-3" /> Reported {formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}
                           </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message="There are currently no active lost reports." />
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-primary/5 border border-primary/20 p-8 lg:p-16 rounded-[40px] lg:rounded-[64px] flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12">
             <AlertTriangle size={160} />
          </div>
          <div className="bg-primary/10 p-5 rounded-3xl shrink-0">
            <AlertTriangle className="h-8 w-8 lg:h-12 lg:w-12 text-primary" />
          </div>
          <div className="text-center lg:text-left space-y-4">
            <h4 className="text-xl lg:text-3xl font-bold text-primary">Lost Property Disposal Policy</h4>
            <p className="text-sm lg:text-lg text-muted-foreground leading-relaxed max-w-4xl font-medium">
              Items listed in this gallery are held for a maximum of 30 days in our secure repository. Unclaimed property after this window is subject to permanent archival, donation to campus initiatives, or listed in the administrative auction module. Students are advised to bring their official university ID when visiting a security post for ownership verification.
            </p>
            <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
               <Badge variant="outline" className="h-8 px-4 lg:h-10 lg:px-6 rounded-full border-primary/20 text-primary font-bold lg:text-sm">Verified Handling</Badge>
               <Badge variant="outline" className="h-8 px-4 lg:h-10 lg:px-6 rounded-full border-primary/20 text-primary font-bold lg:text-sm">Secure Audits</Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-32 bg-muted/20 rounded-[64px] border-4 border-dashed border-muted/50 max-w-4xl mx-auto flex flex-col items-center justify-center px-12">
      <div className="bg-muted p-8 rounded-full mb-6 shadow-inner">
        <Package className="h-16 w-16 text-muted-foreground/30" />
      </div>
      <p className="text-lg lg:text-2xl font-bold text-muted-foreground uppercase tracking-widest text-center">{message}</p>
    </div>
  )
}
