
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Navigation, Search, Filter, MapPin, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query } from "firebase/firestore"
import Image from "next/image"

// LPU Campus Landmarks Mapping (Optimized for 31.2555, 75.7051 center)
const LPU_LOCATION_MAP: Record<string, { x: number, y: number }> = {
  "block 34": { x: 48, y: 35 },
  "block 33": { x: 52, y: 38 },
  "uni mall": { x: 65, y: 50 },
  "unipolis": { x: 35, y: 65 },
  "main gate": { x: 15, y: 45 },
  "canteen": { x: 55, y: 42 },
  "library": { x: 42, y: 32 },
  "gh-1": { x: 85, y: 45 },
  "bh-1": { x: 25, y: 75 },
  "block 38": { x: 58, y: 28 },
}

// LPU Jalandhar Coordinates
const LPU_LAT = "31.2555";
const LPU_LNG = "75.7051";

function getCoordinates(locationDesc: string = "") {
  const normalized = locationDesc.toLowerCase();
  for (const [key, coords] of Object.entries(LPU_LOCATION_MAP)) {
    if (normalized.includes(key)) return coords;
  }
  // Deterministic fallback based on name to keep pins consistent
  const hash = locationDesc.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { x: 30 + (hash % 40), y: 30 + ((hash * 7) % 40) };
}

export default function MapScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch items from Firestore
  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "items"));
  }, [db]);

  const { data: rawItems, isLoading: isItemsLoading } = useCollection(itemsQuery);

  // Filter approved items only and apply search
  const items = useMemo(() => {
    if (!rawItems) return []
    return rawItems.filter(item => {
      // Only show approved items or reported lost items
      const isVisible = item.status === "In Custody" || item.type === "lost"
      if (!isVisible) return false

      if (!searchQuery.trim()) return true
      const search = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(search) ||
        item.locationDescription.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      )
    })
  }, [rawItems, searchQuery])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleNavigate = () => {
    if (!selectedItem) return
    toast({
      title: "Opening Navigation",
      description: `Heading to ${selectedItem.locationDescription}`,
    })
    window.open(`https://www.google.com/maps/search/?api=1&query=Lovely+Professional+University+${selectedItem.locationDescription}`, '_blank')
  }

  const handleRecenter = () => {
    setIsMapReady(false)
    setTimeout(() => setIsMapReady(true), 100)
    toast({
      description: "Centering on LPU Campus Grounds...",
    })
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Instant Satellite Backdrop */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/lpu-satellite/1200/1200" 
          alt="Campus Backdrop" 
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>

      {/* Interactive Map Layer - Strictly centered on LPU */}
      <div className={`absolute inset-0 z-1 transition-opacity duration-700 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
        <iframe
          src={`https://maps.google.com/maps?q=${LPU_LAT},${LPU_LNG}&ll=${LPU_LAT},${LPU_LNG}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          onLoad={() => setIsMapReady(true)}
          className="grayscale-[5%] contrast-[1.1] brightness-[0.9]"
        ></iframe>
      </div>

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 pointer-events-none">
        <div className="max-w-md lg:max-w-2xl mx-auto flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => router.back()} 
            className="bg-background/90 dark:bg-card/90 backdrop-blur-xl shadow-2xl p-3 rounded-2xl active:scale-95 transition-transform border border-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 bg-background/90 dark:bg-card/90 backdrop-blur-xl shadow-2xl rounded-2xl flex items-center px-4 h-12 border border-white/10">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search by block or item..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs font-bold"
            />
            <button className="p-1.5 bg-primary/10 rounded-lg ml-auto">
              <Filter className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Recenter Button */}
      <div className="absolute top-20 right-4 z-20 pointer-events-auto lg:right-auto lg:left-[50%] lg:translate-x-[320px]">
        <button 
          onClick={handleRecenter}
          className="bg-background/90 dark:bg-card/90 backdrop-blur-xl shadow-2xl p-3 rounded-2xl active:scale-95 transition-transform border border-white/10"
        >
          <RefreshCw className={`h-5 w-5 text-primary ${!isMapReady ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Verified Pins Layer */}
      <div className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-1000 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
        {items?.map((item) => {
          const { x, y } = getCoordinates(item.locationDescription);
          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="absolute transition-all duration-300 active:scale-125 pointer-events-auto"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative flex flex-col items-center">
                <div 
                  className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-background dark:bg-card shadow-2xl flex items-center justify-center p-0.5 border-[3px] hover:scale-110 transition-transform ${item.type === 'lost' ? 'border-accent' : 'border-secondary'}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div 
                  className={`w-2 h-2 rotate-45 -mt-1 shadow-sm ${item.type === 'lost' ? 'bg-accent' : 'bg-secondary'}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Sheet */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 ease-out z-40 ${selectedItem ? 'translate-y-[-100px]' : 'translate-y-full'}`}>
        <Card className="max-w-md lg:max-w-2xl mx-auto rounded-[32px] shadow-2xl overflow-hidden border-none bg-background/95 dark:bg-card/95 backdrop-blur-2xl">
          <div className="p-5 lg:p-8">
            <div className="flex items-center gap-4 lg:gap-8">
              <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl overflow-hidden shadow-xl shrink-0 relative border border-white/10">
                {selectedItem && (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-1 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest px-2 py-0 h-4 lg:h-5">
                  {selectedItem?.type}
                </Badge>
                <h3 className="text-base lg:text-xl font-headline font-bold truncate">{selectedItem?.name}</h3>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="text-[10px] lg:text-sm font-medium truncate">{selectedItem?.locationDescription}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-muted rounded-full bg-muted/30"
              >
                <ArrowLeft className="h-4 w-4 lg:h-6 lg:w-6 rotate-[-90deg] text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:gap-6 mt-5 lg:mt-8">
              <Button onClick={handleNavigate} className="rounded-xl h-11 lg:h-14 bg-primary font-headline font-bold text-xs lg:text-sm gap-2 shadow-lg shadow-primary/20">
                <Navigation className="h-4 w-4 lg:h-5 lg:w-5" /> Navigate
              </Button>
              <Button onClick={() => router.push('/gallery')} variant="outline" className="rounded-xl h-11 lg:h-14 font-headline font-bold text-xs lg:text-sm border-2">
                View Gallery
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none opacity-40 z-10">
        <p className="text-[9px] lg:text-xs font-bold uppercase tracking-[0.2em] text-white">Made with Love ❤️ Lostify</p>
        <p className="text-[8px] lg:text-[10px] font-medium text-white/70">Powered by Igloo Enterprises</p>
      </div>
    </div>
  )
}
