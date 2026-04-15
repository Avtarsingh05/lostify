
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

// Mapping of common LPU locations to map percentages (approximate for the satellite view)
const LPU_LOCATION_MAP: Record<string, { x: number, y: number }> = {
  "block 34": { x: 45, y: 30 },
  "block 33": { x: 48, y: 32 },
  "uni mall": { x: 60, y: 55 },
  "unipolis": { x: 30, y: 70 },
  "main gate": { x: 10, y: 50 },
  "canteen": { x: 50, y: 45 },
  "library": { x: 40, y: 35 },
  "gh-1": { x: 80, y: 40 },
  "bh-1": { x: 20, y: 80 },
  "block 38": { x: 55, y: 25 },
}

function getCoordinates(locationDesc: string = "") {
  const normalized = locationDesc.toLowerCase();
  for (const [key, coords] of Object.entries(LPU_LOCATION_MAP)) {
    if (normalized.includes(key)) return coords;
  }
  // Default random-ish spread within campus bounds if not recognized
  const hash = locationDesc.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { x: 20 + (hash % 60), y: 20 + ((hash * 7) % 60) };
}

export default function MapScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Fetch real items from Firestore
  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "items"));
  }, [db]);

  const { data: items, isLoading: isItemsLoading } = useCollection(itemsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleNavigate = () => {
    if (!selectedItem) return
    toast({
      title: "Opening Maps",
      description: `Navigating to ${selectedItem.locationDescription}`,
    })
    window.open(`https://www.google.com/maps/search/?api=1&query=Lovely+Professional+University+${selectedItem.locationDescription}`, '_blank')
  }

  const handleRecenter = () => {
    setIsMapReady(false)
    setTimeout(() => setIsMapReady(true), 300)
    toast({
      description: "Recentering on LPU Campus...",
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
    <div className="relative h-screen w-full overflow-hidden bg-[#1a1a1a]">
      {/* Instant Static Backdrop */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/lpu-satellite-static/1200/1200" 
          alt="Campus Backdrop" 
          fill
          className={`object-cover transition-opacity duration-1000 ${isMapReady ? 'opacity-40' : 'opacity-100'}`}
          data-ai-hint="satellite campus"
          priority
        />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-white opacity-50" />
                <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em] opacity-50">Calibrating Satellite...</p>
             </div>
          </div>
        )}
      </div>

      {/* Live Interactive Satellite View */}
      <div className={`absolute inset-0 z-1 transition-opacity duration-700 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
        <iframe
          src="https://maps.google.com/maps?q=Lovely+Professional+University+LPU+Campus+Phagwara&t=k&z=17&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="eager"
          onLoad={() => setIsMapReady(true)}
          className="grayscale-[10%] brightness-[105%]"
        ></iframe>
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-3 z-30 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => router.back()} 
            className="bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl p-2.5 rounded-2xl active:scale-95 transition-transform border border-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl flex items-center px-4 h-11 border border-white/20">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search LPU blocks..." 
              className="bg-transparent border-none outline-none w-full text-[10px] font-bold"
            />
            <button className="p-1.5 hover:bg-muted rounded-lg ml-auto">
              <Filter className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Utility Buttons */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
        <button 
          onClick={handleRecenter}
          className="bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl p-3 rounded-2xl active:scale-95 transition-transform border border-white/20"
        >
          <RefreshCw className={`h-5 w-5 text-primary ${!isMapReady ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Real Pins Layer */}
      <div className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-1000 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
        {items?.map((item) => {
          const { x, y } = getCoordinates(item.locationDescription);
          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="absolute transition-all duration-300 active:scale-150 pointer-events-auto"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full bg-white dark:bg-card shadow-2xl flex items-center justify-center p-0.5 border-[3px] hover:scale-110 transition-transform ${item.type === 'lost' ? 'border-accent' : 'border-secondary'}`}
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

      {/* Detail Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 ease-out z-40 ${selectedItem ? 'translate-y-[-80px]' : 'translate-y-full'}`}>
        <Card className="max-w-md mx-auto rounded-[32px] shadow-2xl overflow-hidden border-none bg-white/95 dark:bg-card/95 backdrop-blur-xl">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shrink-0 relative border border-muted bg-muted">
                {selectedItem && (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-1 text-[7px] font-bold uppercase tracking-widest px-1.5 py-0 h-4">
                  {selectedItem?.type}
                </Badge>
                <h3 className="text-sm font-headline font-bold truncate">{selectedItem?.name}</h3>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-medium truncate">Campus - {selectedItem?.locationDescription}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-muted rounded-full bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4 rotate-[-90deg] text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button onClick={handleNavigate} className="rounded-xl h-9 bg-primary font-headline font-bold text-[10px] gap-2 shadow-lg shadow-primary/20">
                <Navigation className="h-3 w-3" /> Navigate
              </Button>
              <Button onClick={() => router.push('/chat')} variant="outline" className="rounded-xl h-9 font-headline font-bold text-[10px] border-2">
                Chat Owner
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
