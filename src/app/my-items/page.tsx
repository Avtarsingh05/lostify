"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Clock, CheckCircle2, History } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import Image from "next/image"

const mockData = {
  lost: [
    { id: 1, name: "RayBan Sunglasses", date: "2 days ago", status: "Searching", image: "https://picsum.photos/seed/sunglasses/200/200" },
    { id: 2, name: "Apple AirPods Pro", date: "5 days ago", status: "Potential Match", image: "https://picsum.photos/seed/airpods/200/200" },
  ],
  found: [
    { id: 3, name: "Car Keys (Toyota)", date: "1 day ago", status: "With Admin", image: "https://picsum.photos/seed/toyota/200/200" },
  ],
  claimed: [
    { id: 4, name: "HP Laptop", date: "1 week ago", status: "Returned", image: "https://picsum.photos/seed/laptop/200/200" },
  ]
}

export default function MyItems() {
  const router = useRouter()

  const ItemCard = ({ item }: { item: any }) => (
    <ThreeDCard className="p-0 overflow-hidden mb-4 border-none shadow-lg">
      <div className="flex h-32">
        <div className="w-32 h-full relative">
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-headline font-bold text-lg">{item.name}</h3>
              <Badge variant={item.status === 'Returned' ? 'secondary' : 'outline'} className={item.status === 'Potential Match' ? 'bg-accent/10 text-accent border-accent/20' : ''}>
                {item.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" /> {item.date}
            </p>
          </div>
          <button className="text-primary text-xs font-bold uppercase tracking-widest text-left">
            View Details
          </button>
        </div>
      </div>
    </ThreeDCard>
  )

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-headline font-bold">My Items</h1>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="font-bold">4 Total</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10">
        <Tabs defaultValue="lost" className="w-full">
          <TabsList className="w-full bg-card shadow-xl h-14 rounded-2xl p-1 mb-8">
            <TabsTrigger value="lost" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <History className="h-4 w-4" /> Lost
            </TabsTrigger>
            <TabsTrigger value="found" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <Package className="h-4 w-4" /> Found
            </TabsTrigger>
            <TabsTrigger value="claimed" className="flex-1 rounded-xl font-headline font-bold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Claimed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mockData.lost.map(item => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
          <TabsContent value="found" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mockData.found.map(item => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
          <TabsContent value="claimed" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mockData.claimed.map(item => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
