
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
  AlertCircle,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, orderBy } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const [search, setSearch] = useState("")

  // Fetch items pending verification
  const pendingQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "items"),
      where("status", "==", "Pending Verification"),
      orderBy("reportedAt", "desc")
    )
  }, [db])

  const { data: pendingItems, isLoading } = useCollection(pendingQuery)

  const handleApprove = (itemId: string) => {
    if (!db) return
    const itemRef = doc(db, "items", itemId)
    updateDocumentNonBlocking(itemRef, {
      status: "In Custody",
      lastUpdatedAt: new Date().toISOString()
    })
    toast({
      title: "Item Approved",
      description: "Item is now live on the campus map.",
    })
  }

  const filteredItems = pendingItems?.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.locationDescription.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background pb-24">
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
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Approval</p>
              <h3 className="text-2xl font-headline font-bold mt-1 text-accent">{pendingItems?.length || 0}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Station Status</p>
              <h3 className="text-sm font-headline font-bold mt-2 text-secondary flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Active
              </h3>
            </CardContent>
          </Card>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search pending reports..." 
            className="pl-10 h-14 rounded-2xl shadow-lg border-none bg-white dark:bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-headline font-bold flex items-center gap-2 px-2">
            <Clock className="h-4 w-4 text-primary" /> Incoming Handovers
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <CardContent className="p-0">
                  <div className="flex p-4 gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md bg-muted">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-sm truncate pr-2">{item.name}</h3>
                        <Badge variant="outline" className="text-[8px] border-none px-2 py-0 bg-accent/10 text-accent">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {item.locationDescription}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> 
                        {item.reportedAt ? formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true }) : "just now"}
                      </p>
                      
                      <div className="flex items-center justify-end mt-3 gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(item.id)}
                          className="h-7 px-4 rounded-lg text-[10px] font-bold bg-primary shadow-md"
                        >
                          Verify & Pin on Map
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-[32px] border-2 border-dashed">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">All caught up!</p>
              <p className="text-[9px] text-muted-foreground mt-1 px-10">No new found items waiting for verification.</p>
            </div>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/10 p-4 rounded-3xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary">Station Policy</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Verify student IDs and inspect item photos before approval. Once approved, the location is instantly pinned for the campus community to see.
            </p>
          </div>
        </div>

        <div className="pt-8 pb-4 text-center space-y-1 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
          <p className="text-[9px] font-medium">Powered by Igloo Enterprises</p>
        </div>
      </main>
    </div>
  )
}
