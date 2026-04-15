
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Globe, MapPin, Check, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const boysHostels = Array.from({ length: 10 }, (_, i) => ({
  id: `bh-${i + 1}`,
  name: `BH-${i + 1} Apartment`,
  area: "Boys Residential Wing"
}))

const girlsHostels = Array.from({ length: 10 }, (_, i) => ({
  id: `gh-${i + 1}`,
  name: `GH-${i + 1} Apartment`,
  area: "Girls Residential Wing"
}))

const campuses = [...boysHostels, ...girlsHostels]

export default function RegionSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const [selected, setSelected] = useState("bh-1")

  const handleSelect = (id: string, name: string) => {
    setSelected(id)
    toast({
      title: "Region Updated",
      description: `Your primary search region is now set to ${name}.`,
    })
    setTimeout(() => router.back(), 500)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Region</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Select Residential Area
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {campuses.map((campus) => (
                  <div 
                    key={campus.id}
                    onClick={() => handleSelect(campus.id, campus.name)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                      selected === campus.id 
                        ? 'bg-primary/10 border-2 border-primary/20' 
                        : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selected === campus.id ? 'bg-primary text-white' : 'bg-white text-muted-foreground shadow-sm'}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{campus.name}</p>
                        <p className="text-[10px] text-muted-foreground">{campus.area}</p>
                      </div>
                    </div>
                    {selected === campus.id ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <p className="mt-6 text-[10px] text-muted-foreground text-center px-8 leading-relaxed">
          Selecting a specific residential area narrows your item search results and localizes your reports for faster recovery within your living quarters.
        </p>
      </main>
    </div>
  )
}
