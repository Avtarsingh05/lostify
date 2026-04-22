
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Navigation, Search, Filter, MapPin, Loader2, RefreshCw, X, Globe, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"
import Image from "next/image"
import { isBefore, subDays } from "date-fns"

const LPU_LAT = "31.2555";
const LPU_LNG = "75.7051";

// FAST O(1) COORDINATE LOOKUP FOR CAMPUS HOTSPOTS
const LPU_LOCATION_MAP: Record<string, { x: number, y: number }> = {
  "block 34": { x: 48, y: 35 },
  "block 33": { x: 52, y: 38 },
  "uni mall": { x: 65, y: 50 },
  "unipolis": { x: 35, y: 65 },
  "main gate": { x: 15, y: 45 },
  "canteen": { x: 55, y: 42 },
  "library": { x: 42, y: 32 },
  "bh-1": { x: 20, y: 20 },
  "bh-2": { x: 22, y: 20 },
  "bh-3": { x: 24, y: 20 },
  "gh-1": { x: 80, y: 20 },
  "gh-2": { x: 82, y: 20 },
}

function getCoordinates(locationDesc: string = "") {
  const normalized = locationDesc.toLowerCase();
  for (const [key, coords] of Object.entries(LPU_LOCATION_MAP)) {
    if (normalized.includes(key)) return coords;
  }
  // Deterministic hash for unknown locations to prevent pin jitter
  const hash = locationDesc.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { x: 30 + (hash % 40), y: 30 + ((hash * 7) % 40) };
}

export default function MapScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "items"));
  }, [db]);

  const { data: rawItems, isLoading: isItemsLoading } = useCollection(itemsQuery);

  // HIGH PERFORMANCE FILTERING (CLIENT SIDE)
  const filteredItems = useMemo(() => {
    if (!rawItems) return []
    const thirtyDaysAgo = subDays(new Date(), 30)
    const search = searchQuery.toLowerCase().trim()

    return rawItems.filter(item => {
      const isVisible = item.status === "In Custody" || item.type === "lost" || item.status === "Active"
      if (!isVisible) return false
      
      const reportDate = item.reportedAt ? new Date(item.reportedAt) : new Date()
      if (isBefore(reportDate, thirtyDaysAgo)) return false
      
      if (!search) return true
      return item.name?.toLowerCase().includes(search) || item.locationDescription?.toLowerCase().includes(search)
    })
  }, [rawItems, searchQuery])

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex">
      {/* WEB SIDEBAR (lg:flex) */}
      <aside className="hidden lg:flex w-96 bg-card border-r flex-col z-50 shadow-2xl relative">
        <div className="p-8 gradient-header text-white space-y-6">
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-6 w-6" /></button>
              <h1 className="text-3xl font-headline font-bold">Campus Radar</h1>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input 
                placeholder="Search live matches..." 
                className="w-full h-12 bg-white/10 border-none rounded-xl pl-10 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
           <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nearby Verified Items</p>
              <Badge variant="outline" className="text-[8px]">{filteredItems.length} Active</Badge>
           </div>
           
           {filteredItems.map(item => (
             <button 
               key={item.id} 
               onClick={() => setSelectedItem(item)}
               className={`w-full text-left p-4 rounded-3xl transition-all border-2 ${selectedItem?.id === item.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-transparent hover:bg-muted/50'}`}
             >
                <div className="flex gap-4">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate"><MapPin className="h-3 w-3" /> {item.locationDescription}</p>
                      <Badge className={`text-[8px] h-4 mt-2 ${item.type === 'lost' ? 'bg-accent' : 'bg-secondary'}`}>{item.type.toUpperCase()}</Badge>
                   </div>
                </div>
             </button>
           ))}
        </div>

        <div className="p-8 border-t bg-muted/20">
           <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-[10px] font-bold text-muted-foreground leading-tight">All markers represent security-verified locations within university grounds.</p>
           </div>
        </div>
      </aside>

      {/* MAP AREA */}
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 right-0 p-4 z-40 lg:hidden pointer-events-none">
           <div className="flex items-center gap-2 pointer-events-auto">
             <button onClick={() => router.back()} className="bg-background/90 backdrop-blur-xl p-3 rounded-2xl shadow-xl"><ArrowLeft className="h-5 w-5" /></button>
             <div className="flex-1 bg-background/90 backdrop-blur-xl shadow-xl rounded-2xl flex items-center px-4 h-12 border border-white/10">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <input 
                  placeholder="Search live..." 
                  className="bg-transparent border-none outline-none w-full text-xs font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </div>
        </div>

        {/* SAT-MAP WITH OPTIMIZED LOADING */}
        <div className="absolute inset-0 z-0">
          <iframe
            src={`https://maps.google.com/maps?q=${LPU_LAT},${LPU_LNG}&ll=${LPU_LAT},${LPU_LNG}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy"
            onLoad={() => setIsMapReady(true)}
            className="grayscale-[5%] contrast-[1.1] brightness-[0.9]"
          ></iframe>
        </div>

        {/* RENDER PINS ONLY WHEN MAP READY */}
        {isMapReady && filteredItems.map((item) => {
          const { x, y } = getCoordinates(item.locationDescription);
          const isSelected = selectedItem?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`absolute transition-all duration-300 ${isSelected ? 'scale-125 z-30' : 'z-20'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-background shadow-2xl flex items-center justify-center p-0.5 border-[3px] ${item.type === 'lost' ? 'border-accent' : 'border-secondary'} ${isSelected ? 'ring-4 ring-white/30' : ''}`}>
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              </div>
            </button>
          );
        })}

        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 z-40 lg:hidden ${selectedItem ? 'translate-y-[-100px]' : 'translate-y-full'}`}>
           <Card className="max-w-md mx-auto rounded-[32px] shadow-2xl p-5 bg-background/95 backdrop-blur-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-xl">
                    {selectedItem && <Image src={selectedItem.imageUrl} alt="Item" fill className="object-cover" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-headline font-bold truncate">{selectedItem?.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {selectedItem?.locationDescription}</p>
                    <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 p-2 opacity-30"><X className="h-4 w-4" /></button>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
