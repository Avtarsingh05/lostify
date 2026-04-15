
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Navigation, Search, Filter, Info, MapPin, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/firebase"
import Image from "next/image"

const mockItems = [
  { id: 1, type: "lost", name: "Apple Watch", location: "Central Park", color: "hsl(38, 90%, 50%)", x: 45, y: 30, image: "https://picsum.photos/seed/watch/200/200" },
  { id: 2, type: "found", name: "Wallet", location: "Subway", color: "hsl(147, 74%, 46%)", x: 60, y: 55, image: "https://picsum.photos/seed/wallet/200/200" },
  { id: 3, type: "lost", name: "Dog", location: "West Park", color: "hsl(38, 90%, 50%)", x: 30, y: 70, image: "https://picsum.photos/seed/dog/200/200" },
]

export default function MapScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const [selectedItem, setSelectedItem] = useState<typeof mockItems[0] | null>(null)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleNavigate = () => {
    toast({
      title: "Opening Navigation...",
      description: `Directing you to ${selectedItem?.location}`,
    })
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${selectedItem?.location}`, '_blank')
    }, 1000)
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e5e7eb]">
      <div className="absolute inset-0 opacity-40 mix-blend-multiply">
         <Image 
          src="https://picsum.photos/seed/map/1200/1200" 
          alt="Map Background" 
          fill 
          className="object-cover grayscale"
          data-ai-hint="city map"
         />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] pointer-events-none">
        {Array.from({ length: 225 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-black/5" />
        ))}
      </div>

      {/* Top UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => router.back()} className="bg-white dark:bg-card shadow-xl p-2.5 rounded-xl">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 bg-white dark:bg-card shadow-xl rounded-xl flex items-center px-3 h-12">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="bg-transparent border-none outline-none w-full text-xs font-medium"
            />
            <button className="p-1.5 hover:bg-muted rounded-lg">
              <Filter className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Markers */}
      {mockItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedItem(item)}
          className="absolute z-20 group transition-all duration-300 hover:scale-125"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <div className="relative flex items-center justify-center">
            <div 
              className="w-8 h-8 rounded-full bg-white dark:bg-card shadow-2xl flex items-center justify-center p-0.5 border-2"
              style={{ borderColor: item.color }}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
            </div>
            <div 
              className="absolute -bottom-0.5 w-2 h-2 rotate-45 border-r border-b"
              style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.1)' }}
            />
          </div>
        </button>
      ))}

      {/* Bottom Sheet Detail */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 z-30 ${selectedItem ? 'translate-y-[-80px]' : 'translate-y-full'}`}>
        <Card className="max-w-md mx-auto rounded-[24px] shadow-2xl overflow-hidden border-none">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0 relative">
                {selectedItem && <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-1 uppercase tracking-widest text-[8px]">
                      {selectedItem?.type}
                    </Badge>
                    <h3 className="text-lg font-headline font-bold">{selectedItem?.name}</h3>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-muted rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] truncate">{selectedItem?.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button onClick={handleNavigate} className="rounded-xl h-11 bg-primary font-headline font-bold flex gap-2 text-xs">
                <Navigation className="h-4 w-4" /> Go
              </Button>
              <Button onClick={() => router.push('/chat')} variant="outline" className="rounded-xl h-11 font-headline font-bold border-2 text-xs">
                Message
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
