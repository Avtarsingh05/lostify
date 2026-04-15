
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Gavel, Timer, TrendingUp, DollarSign } from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const mockAuctions = [
  { id: 1, name: "Nikon Vintage Camera", currentBid: "$120", timeLeft: "02:14:55", image: "https://picsum.photos/seed/camera/600/400" },
  { id: 2, name: "Signed Basketball", currentBid: "$85", timeLeft: "14:20:10", image: "https://picsum.photos/seed/ball/600/400" },
  { id: 3, name: "Diamond Ring (Found)", currentBid: "$1,450", timeLeft: "00:45:12", image: "https://picsum.photos/seed/ring/600/400" },
  { id: 4, name: "Luxury Watch", currentBid: "$320", timeLeft: "05:10:00", image: "https://picsum.photos/seed/watch2/600/400" },
]

export default function AuctionScreen() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Lostify Auctions</h1>
          </div>
          <p className="text-[10px] text-white/80 font-medium leading-relaxed uppercase tracking-wider">
            Unclaimed items funds community rewards.
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {mockAuctions.map((item, index) => (
            <ThreeDCard 
              key={item.id} 
              className="p-0 border-none group relative overflow-hidden bg-card/80 backdrop-blur-sm shadow-xl"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative flex flex-col">
                <div className="aspect-[16/10] relative overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/60 backdrop-blur-md border-none text-[8px] font-bold px-2 py-0.5 flex gap-1 items-center">
                      <Timer className="h-2.5 w-2.5 text-accent" /> {item.timeLeft}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-headline font-bold truncate pr-2">{item.name}</h3>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <TrendingUp className="h-2.5 w-2.5" /> 12 Active Bids
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground">Current</p>
                      <p className="text-lg font-headline font-bold text-primary leading-tight">{item.currentBid}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="rounded-xl h-10 bg-primary font-bold shadow-md shadow-primary/20 text-[10px] gap-1.5 active:scale-95 transition-transform">
                      <Gavel className="h-3.5 w-3.5" /> Bid Now
                    </Button>
                    <Button variant="outline" className="rounded-xl h-10 border-2 font-bold text-[10px] active:scale-95 transition-transform">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </ThreeDCard>
          ))}
        </div>
      </main>
    </div>
  )
}
