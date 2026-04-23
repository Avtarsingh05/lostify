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
  ChevronRight,
  Filter,
  Image as ImageIcon
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      {/* MOBILE VIEW (lg:hidden) */}
      <div className="lg:hidden">
        <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[48px] shadow-2xl text-white">
          <div className="max-w-md mx-auto flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-90">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-headline font-bold">Campus Gallery</h1>
                <p className="text-[10px] text-white/70 font-medium tracking-wide uppercase mt-1">Verified Inventory</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-md mx-auto px-6 -mt-10 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              className="pl-11 h-12 rounded-2xl shadow-xl border-none bg-white/95"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Tabs defaultValue="found" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border">
              <TabsTrigger value="found" className="rounded-xl font-bold text-[10px] uppercase gap-2">
                Found
              </TabsTrigger>
              <TabsTrigger value="lost" className="rounded-xl font-bold text-[10px] uppercase gap-2">
                Lost
              </TabsTrigger>
            </TabsList>

            <TabsContent value="found" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-20 opacity-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : inCustodyItems.length > 0 ? (
                inCustodyItems.map((item) => <MobileItemCard key={item.id} item={item} type="found" />)
              ) : (
                <EmptyState message="No verified items." />
              )}
            </TabsContent>

            <TabsContent value="lost" className="space-y-4">
              {activeLostItems.length > 0 ? (
                activeLostItems.map((item) => <MobileItemCard key={item.id} item={item} type="lost" />)
              ) : (
                <EmptyState message="No active lost reports." />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* WEB VIEW (hidden on small, flex on lg) */}
      <div className="hidden lg:flex flex-col">
        <div className="gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Campus Inventory Portal</h1>
                <p className="text-xl text-white/70 mt-2">Verified lost and found repository for LPU Campus</p>
              </div>
            </div>
            <div className="bg-white/20 p-8 rounded-[40px] shadow-2xl border border-white/10">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-10 -mt-24 space-y-16 w-full">
          <div className="flex gap-4">
             <div className="relative flex-1 group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <Input 
                 placeholder="Search verified items by name, block, or category..." 
                 className="pl-16 h-20 rounded-3xl shadow-2xl border-none bg-white/95 dark:bg-card/90 backdrop-blur-xl text-xl"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <Button variant="outline" className="h-20 w-20 rounded-3xl bg-white shadow-2xl border-none">
                <Filter className="h-6 w-6 text-primary" />
             </Button>
          </div>

          <Tabs defaultValue="found" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-3xl p-1 bg-card shadow-xl h-20 mb-16 border max-w-3xl mx-auto">
              <TabsTrigger value="found" className="rounded-2xl font-bold text-lg gap-3">
                <ShieldCheck className="h-6 w-6" /> Found Items In Custody
              </TabsTrigger>
              <TabsTrigger value="lost" className="rounded-2xl font-bold text-lg gap-3">
                <Clock className="h-6 w-6" /> Active Lost Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="found">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                  <Loader2 className="h-12 w-12 animate-spin" />
                </div>
              ) : inCustodyItems.length > 0 ? (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-10">
                  {inCustodyItems.map((item) => <WebItemCard key={item.id} item={item} type="found" />)}
                </div>
              ) : (
                <EmptyState message="No verified items currently in security custody." />
              )}
            </TabsContent>

            <TabsContent value="lost">
              {activeLostItems.length > 0 ? (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-10">
                  {activeLostItems.map((item) => <WebItemCard key={item.id} item={item} type="lost" />)}
                </div>
              ) : (
                <EmptyState message="There are currently no active lost reports." />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

function MobileItemCard({ item, type }: { item: any, type: 'found' | 'lost' }) {
  return (
    <Card className="border-none shadow-md rounded-[24px] overflow-hidden bg-card/80 backdrop-blur-sm group active:scale-[0.98] transition-all">
      <div className="flex h-28">
        <div className="w-28 relative overflow-hidden shrink-0">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-headline font-bold text-xs truncate">{item.name}</h3>
            <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-primary" /> {item.locationDescription}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <Badge className={`text-[7px] h-4 px-1.5 ${type === 'found' ? 'bg-secondary' : 'bg-accent'}`}>{type.toUpperCase()}</Badge>
            <span className="text-[7px] font-bold opacity-40">{formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function WebItemCard({ item, type }: { item: any, type: 'found' | 'lost' }) {
  return (
    <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm group hover:scale-[1.03] transition-all hover:shadow-primary/10">
      <div className="flex flex-col">
        <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-6 left-6">
             <Badge className={`${type === 'found' ? 'bg-secondary' : 'bg-accent'} text-white font-bold h-8 px-4 shadow-xl border-none text-xs`}>
               {type === 'found' ? 'SECURE STORAGE' : 'ACTIVE SEARCH'}
             </Badge>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <div>
            <h3 className="font-headline font-bold text-2xl truncate leading-tight">{item.name}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium truncate">{item.locationDescription}</span>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">
              {type === 'found' ? 'Stored At:' : 'Last Seen Time:'}
            </p>
            <p className="text-base font-bold truncate mt-1">
              {type === 'found' ? (item.storageOffice || "Main Security Gate") : formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex justify-between items-center pt-2">
             <span className="text-xs font-bold uppercase opacity-40">Verified Audit Log</span>
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5 text-primary" />
             </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 lg:py-32 bg-muted/20 rounded-[40px] lg:rounded-[64px] border-4 border-dashed border-muted/50 px-6">
      <ImageIcon className="h-12 w-12 lg:h-16 lg:w-16 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-sm lg:text-2xl font-bold text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  )
}
