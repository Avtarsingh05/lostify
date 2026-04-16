
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Package, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  History,
  Filter
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc, orderBy, limit } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [search, setSearch] = useState("")

  // Fetch items - broader query to see everything
  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "items"),
      orderBy("reportedAt", "desc"),
      limit(100)
    )
  }, [db])

  const { data: allItems, isLoading } = useCollection(itemsQuery)

  // Local filtering for performance and index flexibility
  const pendingFound = useMemo(() => {
    return allItems?.filter(i => i.type === 'found' && i.status === 'Pending Verification') || []
  }, [allItems])

  const activeLost = useMemo(() => {
    return allItems?.filter(i => i.type === 'lost' && i.status === 'Active') || []
  }, [allItems])

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

  const handleResolveLost = (itemId: string) => {
    if (!db) return
    const itemRef = doc(db, "items", itemId)
    updateDocumentNonBlocking(itemRef, {
      status: "Resolved",
      lastUpdatedAt: new Date().toISOString()
    })
    toast({
      title: "Report Resolved",
      description: "Lost report has been marked as found/returned.",
    })
  }

  const filterItems = (list: any[]) => {
    return list.filter(item => 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.locationDescription?.toLowerCase().includes(search.toLowerCase())
    )
  }

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
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
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Handovers</p>
              <h3 className="text-2xl font-headline font-bold mt-1 text-secondary">{pendingFound.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Lost</p>
              <h3 className="text-2xl font-headline font-bold mt-1 text-accent">{activeLost.length}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search all reports..." 
            className="pl-10 h-14 rounded-2xl shadow-lg border-none bg-white dark:bg-card/80 backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border">
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
              <Clock className="h-3 w-3" /> Handovers
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
              <AlertTriangle className="h-3 w-3" /> Lost Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
              </div>
            ) : filterItems(pendingFound).length > 0 ? (
              filterItems(pendingFound).map((item) => (
                <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
                  <div className="flex p-4 gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                      <Image src={item.imageUrl || "https://picsum.photos/seed/item/200/200"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-sm truncate pr-2">{item.name}</h3>
                        <Badge variant="outline" className="text-[8px] border-none px-2 py-0 bg-secondary/10 text-secondary">
                          Handover
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {item.locationDescription}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {item.reportedAt ? formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true }) : "just now"}
                      </p>
                      <div className="flex items-center justify-end mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(item.id)}
                          className="h-8 px-4 rounded-xl text-[10px] font-bold bg-primary active:scale-95 transition-transform"
                        >
                          Verify & Map Pin
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState icon={CheckCircle2} message="All handovers verified!" />
            )}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            {filterItems(activeLost).length > 0 ? (
              filterItems(activeLost).map((item) => (
                <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
                  <div className="flex p-4 gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                      <Image src={item.imageUrl || "https://picsum.photos/seed/lost/200/200"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-headline font-bold text-sm truncate pr-2">{item.name}</h3>
                        <Badge variant="outline" className="text-[8px] border-none px-2 py-0 bg-accent/10 text-accent">
                          Lost Report
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {item.locationDescription}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {item.reportedAt ? formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true }) : "just now"}
                      </p>
                      <div className="flex items-center justify-end mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolveLost(item.id)}
                          className="h-8 px-4 rounded-xl text-[10px] font-bold border-accent/20 text-accent hover:bg-accent/10"
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState icon={History} message="No active lost reports." />
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-primary/5 border border-primary/10 p-5 rounded-[28px] flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary">Guard Protocol</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Verify student ID for all handovers. Lost reports should be cross-referenced with your physical inventory at the security post.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="text-center py-16 bg-muted/10 rounded-[32px] border-2 border-dashed border-muted/50">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  )
}
