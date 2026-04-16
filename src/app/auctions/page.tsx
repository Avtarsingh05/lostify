
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Gavel, Timer, TrendingUp, DollarSign } from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const mockAuctions = [
  { id: 1, name: "Nikon Camera", currentBid: "₹9,500", timeLeft: "02h 14m", image: "https://picsum.photos/seed/camera/200/200" },
  { id: 2, name: "Basketball", currentBid: "₹1,200", timeLeft: "14h 20m", image: "https://picsum.photos/seed/ball/200/200" },
  { id: 3, name: "Diamond Ring", currentBid: "₹85,000", timeLeft: "45m", image: "https://picsum.photos/seed/ring/200/200" },
  { id: 4, name: "Luxury Watch", currentBid: "₹24,000", timeLeft: "05h 10m", image: "https://picsum.photos/seed/watch2/200/200" },
  { id: 5, name: "Blue Backpack", currentBid: "₹800", timeLeft: "08h 05m", image: "https://picsum.photos/seed/bag/200/200" },
  { id: 6, name: "AirPods Pro", currentBid: "₹12,500", timeLeft: "01h 30m", image: "https://picsum.photos/seed/pods/200/200" },
]

export default function AuctionScreen() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-16 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-headline font-bold">Live Auctions</h1>
          </div>
          <p className="text-[9px] text-white/80 font-medium leading-relaxed uppercase tracking-wider">
            All prices in INR. Proceeds help campus rewards.
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-2 -mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {mockAuctions.map((item, index) => (
            <ThreeDCard 
              key={item.id} 
              className="p-0 border-none group relative overflow-hidden bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative flex flex-col">
                <div className="aspect-square relative overflow-hidden">
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <Badge className="bg-black/60 backdrop-blur-md border-none text-[7px] font-bold px-1.5 py-0 flex gap-1 items-center h-4">
                      <Timer className="h-2 w-2 text-accent" /> {item.timeLeft}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-2 space-y-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[9px] font-headline font-bold truncate leading-tight">{item.name}</h3>
                    <div className="flex justify-between items-end mt-1">
                      <div className="text-left shrink-0">
                        <p className="text-[7px] uppercase font-bold tracking-tighter text-muted-foreground">Bid</p>
                        <p className="text-[10px] font-headline font-bold text-primary leading-tight">{item.currentBid}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full rounded-lg h-6 bg-primary font-bold shadow-sm text-[8px] p-0 active:scale-95 transition-transform">
                    Bid Now
                  </Button>
                </div>
              </div>
            </ThreeDCard>
          ))}
        </div>
      </main>
    </div>
  )
}
