
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
      title: "Opening Maps",
      description: `Navigating to ${selectedItem?.location}`,
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
    <div className="relative h-screen w-full overflow-hidden bg-muted">
      <div className="absolute inset-0 opacity-50 grayscale mix-blend-multiply">
         <Image 
          src="https://picsum.photos/seed/map/1200/1200" 
          alt="Map Background" 
          fill 
          className="object-cover"
          data-ai-hint="minimal city map"
         />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid grid-cols-[repeat(12,minmax(0,1fr))] grid-rows-[repeat(12,minmax(0,1fr))] pointer-events-none">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-black/5" />
        ))}
      </div>

      {/* Mobile Top Header */}
      <div className="absolute top-0 left-0 right-0 p-3 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center gap-2 pointer-events-auto">
          <button onClick={() => router.back()} className="bg-white dark:bg-card shadow-lg p-3 rounded-2xl active:scale-95 transition-transform">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-lg rounded-2xl flex items-center px-4 h-11 border border-white/20">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search map..." 
              className="bg-transparent border-none outline-none w-full text-xs font-bold"
            />
            <button className="p-1.5 hover:bg-muted rounded-lg ml-auto">
              <Filter className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Markers */}
      {mockItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedItem(item)}
          className="absolute z-20 transition-all duration-300 active:scale-150"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <div className="relative flex flex-col items-center">
            <div 
              className="w-10 h-10 rounded-full bg-white dark:bg-card shadow-2xl flex items-center justify-center p-0.5 border-[3px]"
              style={{ borderColor: item.color }}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
            </div>
            <div 
              className="w-2 h-2 rotate-45 -mt-1 shadow-sm"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </button>
      ))}

      {/* Mobile-Friendly Bottom Sheet */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 ease-out z-30 ${selectedItem ? 'translate-y-[-80px]' : 'translate-y-full'}`}>
        <Card className="max-w-md mx-auto rounded-[32px] shadow-2xl overflow-hidden border-none bg-white/95 dark:bg-card/95 backdrop-blur-xl">
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0 relative border border-muted">
                {selectedItem && <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-1 text-[8px] font-bold uppercase tracking-widest px-2 py-0">
                  {selectedItem?.type}
                </Badge>
                <h3 className="text-lg font-headline font-bold truncate">{selectedItem?.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-medium truncate">{selectedItem?.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Button onClick={handleNavigate} className="rounded-2xl h-12 bg-primary font-headline font-bold text-xs gap-2 shadow-lg shadow-primary/20">
                <Navigation className="h-4 w-4" /> Go Now
              </Button>
              <Button onClick={() => router.push('/chat')} variant="outline" className="rounded-2xl h-12 font-headline font-bold text-xs border-2">
                Chat
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
