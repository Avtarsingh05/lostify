"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Navigation, Search, Filter, Info, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const mockItems = [
  { id: 1, type: "lost", name: "Apple Watch SE", location: "Central Park Mall", color: "hsl(38, 90%, 50%)", x: 45, y: 30, image: "https://picsum.photos/seed/watch/200/200" },
  { id: 2, type: "found", name: "Leather Wallet", location: "Subway Station", color: "hsl(147, 74%, 46%)", x: 60, y: 55, image: "https://picsum.photos/seed/wallet/200/200" },
  { id: 3, type: "lost", name: "Golden Retriever (Buddy)", location: "West Side Park", color: "hsl(38, 90%, 50%)", x: 30, y: 70, image: "https://picsum.photos/seed/dog/200/200" },
]

export default function MapScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedItem, setSelectedItem] = useState<typeof mockItems[0] | null>(null)

  const handleNavigate = () => {
    toast({
      title: "Opening Navigation...",
      description: `Directing you to ${selectedItem?.location}`,
    })
    // Simulate opening external map
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${selectedItem?.location}`, '_blank')
    }, 1000)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e5e7eb]">
      {/* Mock Map Background */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply">
         <Image 
          src="https://picsum.photos/seed/map/1200/1200" 
          alt="Map Background" 
          fill 
          className="object-cover grayscale"
          data-ai-hint="city map"
         />
      </div>

      {/* Grid Overlay for feel */}
      <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] pointer-events-none">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-black/5" />
        ))}
      </div>

      {/* Top UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => router.back()} className="bg-white dark:bg-card shadow-xl p-3 rounded-2xl hover:scale-110 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1 bg-white dark:bg-card shadow-xl rounded-2xl flex items-center px-4 h-14">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <input 
              type="text" 
              placeholder="Search items by name or location" 
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
            />
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Filter className="h-5 w-5 text-primary" />
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
              className="w-10 h-10 rounded-full bg-white dark:bg-card shadow-2xl flex items-center justify-center p-1 border-2"
              style={{ borderColor: item.color }}
            >
              <div className="w-full h-full rounded-full overflow-hidden">
                <Image src={item.image} alt={item.name} width={40} height={40} />
              </div>
            </div>
            <div 
              className="absolute -bottom-1 w-3 h-3 rotate-45 border-r border-b"
              style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.1)' }}
            />
            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
              {item.name}
            </div>
          </div>
        </button>
      ))}

      {/* Bottom Sheet Detail */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 transition-transform duration-500 z-30 ${selectedItem ? 'translate-y-0' : 'translate-y-full'}`}>
        <Card className="max-w-xl mx-auto rounded-[32px] shadow-2xl overflow-hidden border-none">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                {selectedItem && <Image src={selectedItem.image} alt={selectedItem.name} width={100} height={100} className="object-cover h-full" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-2 uppercase tracking-widest text-[10px]">
                      {selectedItem?.type} Item
                    </Badge>
                    <h3 className="text-xl font-headline font-bold">{selectedItem?.name}</h3>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-muted rounded-full">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{selectedItem?.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button onClick={handleNavigate} className="rounded-2xl h-14 bg-primary font-headline font-bold flex gap-2">
                <Navigation className="h-5 w-5" /> Navigate
              </Button>
              <Button onClick={() => router.push('/chat')} variant="outline" className="rounded-2xl h-14 font-headline font-bold border-2">
                Send Message
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => router.push('/report-found')}
        className="absolute bottom-10 right-10 z-20 w-16 h-16 rounded-full gradient-success shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        <MapPin className="h-8 w-8" />
      </button>
    </div>
  )
}
