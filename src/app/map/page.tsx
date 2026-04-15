
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Navigation, Search, Filter, MapPin, Loader2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/firebase"

const mockItems = [
  { id: 1, type: "lost", name: "Apple Watch", location: "Block 34", color: "hsl(38, 90%, 50%)", x: 45, y: 30, image: "https://picsum.photos/seed/watch/200/200" },
  { id: 2, type: "found", name: "Wallet", location: "Uni Mall", color: "hsl(147, 74%, 46%)", x: 60, y: 55, image: "https://picsum.photos/seed/wallet/200/200" },
  { id: 3, type: "lost", name: "Backpack", location: "Baldev Raj Mittal Unipolis", color: "hsl(38, 90%, 50%)", x: 30, y: 70, image: "https://picsum.photos/seed/bag/200/200" },
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
    if (!selectedItem) return
    toast({
      title: "Opening Maps",
      description: `Navigating to ${selectedItem.location}`,
    })
    window.open(`https://www.google.com/maps/search/?api=1&query=Lovely+Professional+University+${selectedItem.location}`, '_blank')
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
      {/* Live LPU Google Map Embed */}
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3410.726514732!2d75.70251327632661!3d31.25599207433543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a5f5e9c489cf3%3A0x4049a5409d53c300!2sLovely+Professional+University!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale-[20%] contrast-[1.1] opacity-90"
        ></iframe>
      </div>

      {/* Grid Overlay for Premium Feel */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.05)_100%)]" />

      {/* Mobile Top Header */}
      <div className="absolute top-0 left-0 right-0 p-3 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => router.back()} 
            className="bg-white dark:bg-card shadow-2xl p-3 rounded-2xl active:scale-95 transition-transform border border-black/5"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl flex items-center px-4 h-11 border border-black/5">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search blocks or items..." 
              className="bg-transparent border-none outline-none w-full text-[11px] font-bold"
            />
            <button className="p-1.5 hover:bg-muted rounded-lg ml-auto">
              <Filter className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Hint */}
      <div className="absolute top-16 left-0 right-0 p-3 z-10 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-center">
          <div className="bg-primary/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto border border-white/20">
            <Info className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">LPU Campus Live View</span>
          </div>
        </div>
      </div>

      {/* Simplified Mobile-Friendly Bottom Sheet */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-500 ease-out z-30 ${selectedItem ? 'translate-y-[-80px]' : 'translate-y-full'}`}>
        <Card className="max-w-md mx-auto rounded-[32px] shadow-2xl overflow-hidden border-none bg-white/95 dark:bg-card/95 backdrop-blur-xl">
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shrink-0 relative border border-muted bg-muted">
                {selectedItem && (
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant={selectedItem?.type === 'lost' ? 'destructive' : 'secondary'} className="mb-1 text-[7px] font-bold uppercase tracking-widest px-2 py-0 h-4">
                  {selectedItem?.type}
                </Badge>
                <h3 className="text-sm font-headline font-bold truncate">{selectedItem?.name}</h3>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-medium truncate">LPU - {selectedItem?.location}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <ArrowLeft className="h-4 w-4 rotate-[-90deg] text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button onClick={handleNavigate} className="rounded-2xl h-10 bg-primary font-headline font-bold text-[10px] gap-2 shadow-lg shadow-primary/20">
                <Navigation className="h-3 w-3" /> Directions
              </Button>
              <Button onClick={() => router.push('/chat')} variant="outline" className="rounded-2xl h-10 font-headline font-bold text-[10px] border-2">
                Chat
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Manual Pin Triggers (For Demo Purposes) */}
      <div className="absolute inset-0 pointer-events-none">
        {mockItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="absolute z-20 transition-all duration-300 active:scale-150 pointer-events-auto"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              <div 
                className="w-8 h-8 rounded-full bg-white dark:bg-card shadow-2xl flex items-center justify-center p-0.5 border-[2px]"
                style={{ borderColor: item.color }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div 
                className="w-1.5 h-1.5 rotate-45 -mt-0.5 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
