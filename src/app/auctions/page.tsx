"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Gavel, Timer, TrendingUp, DollarSign } from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const mockAuctions = [
  { id: 1, name: "Vintage Camera (Nikon)", currentBid: "$120", timeLeft: "02:14:55", image: "https://picsum.photos/seed/camera/600/400" },
  { id: 2, name: "Signed Basketball", currentBid: "$85", timeLeft: "14:20:10", image: "https://picsum.photos/seed/ball/600/400" },
  { id: 3, name: "Diamond Ring", currentBid: "$1,450", timeLeft: "00:45:12", image: "https://picsum.photos/seed/ring/600/400" },
  { id: 4, name: "Collector's Watch", currentBid: "$320", timeLeft: "05:10:00", image: "https://picsum.photos/seed/watch2/600/400" },
]

export default function AuctionScreen() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-headline font-bold">Lostify Auctions</h1>
          </div>
          <p className="text-white/80 max-w-xl">
            Bid on unclaimed items. All proceeds go to community rewards and local charities.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockAuctions.map((item, index) => (
            <ThreeDCard 
              key={item.id} 
              className="p-0 border-none group relative overflow-visible"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow Effect for high value or low time */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[24px] opacity-20 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>
              
              <div className="relative bg-card rounded-[24px] overflow-hidden flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md border-none flex gap-1 items-center px-3 py-1">
                      <Timer className="h-3 w-3 text-accent" /> {item.timeLeft}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-headline font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 12 Active Bidders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Current Bid</p>
                      <p className="text-2xl font-headline font-bold text-primary">{item.currentBid}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="rounded-xl h-12 bg-primary font-bold shadow-lg shadow-primary/20 flex gap-2">
                      <Gavel className="h-4 w-4" /> Place Bid
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 border-2 font-bold">
                      View Item
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
