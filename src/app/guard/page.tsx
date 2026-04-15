
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Package, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const mockHandovers = [
  { 
    id: "H-101", 
    itemName: "Apple Watch Series 7", 
    studentName: "John Doe", 
    foundAt: "Canteen Area", 
    date: "2023-10-24 10:30 AM", 
    status: "Pending Claim", 
    image: "https://picsum.photos/seed/watch/200/200" 
  },
  { 
    id: "H-102", 
    itemName: "Brown Leather Wallet", 
    studentName: "Jane Smith", 
    foundAt: "Library Hall", 
    date: "2023-10-24 02:15 PM", 
    status: "In Custody", 
    image: "https://picsum.photos/seed/wallet/200/200" 
  },
  { 
    id: "H-103", 
    itemName: "Blue Backpack", 
    studentName: "Mike Ross", 
    foundAt: "Sports Ground", 
    date: "2023-10-23 04:45 PM", 
    status: "Returned", 
    image: "https://picsum.photos/seed/bag/200/200" 
  },
]

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState("")

  const handleProcessClaim = (id: string) => {
    toast({
      title: "Processing Claim",
      description: `Initiating claim verification for Item ${id}.`,
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-headline font-bold">Guard Station</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Custody</p>
              <h3 className="text-2xl font-headline font-bold mt-1">12</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Returned</p>
              <h3 className="text-2xl font-headline font-bold mt-1 text-secondary">48</h3>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search item or student ID..." 
            className="pl-10 h-14 rounded-2xl shadow-lg border-none bg-white dark:bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-muted p-2 rounded-xl">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Handover List */}
        <div className="space-y-4">
          <h2 className="text-sm font-headline font-bold flex items-center gap-2 px-2">
            <Clock className="h-4 w-4 text-primary" /> Recent Handovers
          </h2>
          
          {mockHandovers.map((item) => (
            <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="p-0">
                <div className="flex p-4 gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md">
                    <Image src={item.image} alt={item.itemName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-headline font-bold text-sm truncate pr-2">{item.itemName}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-[8px] border-none px-2 py-0 ${
                          item.status === 'Returned' ? 'bg-secondary/10 text-secondary' : 
                          item.status === 'Pending Claim' ? 'bg-accent/10 text-accent' : 
                          'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" /> Found by: {item.studentName}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {item.foundAt}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[9px] font-bold text-muted-foreground">{item.date}</p>
                      <Button 
                        size="sm" 
                        onClick={() => handleProcessClaim(item.id)}
                        variant={item.status === 'Returned' ? 'outline' : 'default'}
                        className={`h-7 px-3 rounded-lg text-[10px] font-bold ${item.status === 'Returned' ? '' : 'bg-primary shadow-md'}`}
                        disabled={item.status === 'Returned'}
                      >
                        {item.status === 'Returned' ? 'Verified' : 'Process Claim'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Info Banner */}
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-3xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary">Station Policy</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Always verify student ID and item description before handing over the item. Record the claimant's details in the log.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
