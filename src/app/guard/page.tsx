"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Loader2,
  AlertCircle,
  Archive,
  Building,
  UserCheck,
  History
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, doc, orderBy, limit } from "firebase/firestore"
import Image from "next/image"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [search, setSearch] = useState("")

  const [verifyingItem, setVerifyingItem] = useState<any | null>(null)
  const [resolvingItem, setResolvingItem] = useState<any | null>(null)
  const [storageLocation, setStorageLocation] = useState("")
  const [regNumber, setRegNumber] = useState("")

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "items"),
      orderBy("reportedAt", "desc"),
      limit(100)
    )
  }, [db])

  const { data: allItems, isLoading } = useCollection(itemsQuery)

  const pendingFound = useMemo(() => {
    return allItems?.filter(i => i.type === 'found' && i.status === 'Pending Verification') || []
  }, [allItems])

  const inOfficeFound = useMemo(() => {
    return allItems?.filter(i => i.type === 'found' && i.status === 'In Custody') || []
  }, [allItems])

  const activeLost = useMemo(() => {
    return allItems?.filter(i => i.type === 'lost' && i.status === 'Active') || []
  }, [allItems])

  const handleApprove = () => {
    if (!db || !verifyingItem || !storageLocation) return
    const itemRef = doc(db, "items", verifyingItem.id)
    updateDocumentNonBlocking(itemRef, {
      status: "In Custody",
      storageOffice: storageLocation,
      verifiedBy: user?.email,
      lastUpdatedAt: new Date().toISOString()
    })
    toast({
      title: "Item Approved",
      description: `Logged at ${storageLocation}. Now visible in gallery.`,
    })
    setVerifyingItem(null)
    setStorageLocation("")
  }

  const handleResolve = () => {
    if (!db || !resolvingItem || !regNumber) return
    const itemRef = doc(db, "items", resolvingItem.id)
    updateDocumentNonBlocking(itemRef, {
      status: "Resolved",
      claimerRegNo: regNumber,
      resolvedBy: user?.email,
      resolvedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    })
    toast({
      title: "Item Resolved",
      description: `Claimed by student: ${regNumber}`,
    })
    setResolvingItem(null)
    setRegNumber("")
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
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl lg:text-4xl font-headline font-bold">Guard Station</h1>
          </div>
          <div className="bg-white/20 p-2 lg:p-4 rounded-xl">
            <ShieldCheck className="h-5 w-5 lg:h-8 lg:w-8" />
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-3 gap-2 lg:gap-8">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Handovers</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-secondary">{pendingFound.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">In Office</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-primary">{inOfficeFound.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Lost</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-accent">{activeLost.length}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="relative group max-w-2xl mx-auto lg:max-w-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search all reports..." 
            className="pl-10 h-14 rounded-2xl shadow-lg border-none bg-white dark:bg-card/80 backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border overflow-x-auto max-w-2xl mx-auto lg:max-w-none">
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4" /> Handovers
            </TabsTrigger>
            <TabsTrigger value="office" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <Archive className="h-3 w-3 lg:h-4 lg:w-4" /> In Office
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <AlertCircle className="h-3 w-3 lg:h-4 lg:w-4" /> Lost Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
              </div>
            ) : filterItems(pendingFound).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {filterItems(pendingFound).map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
                    <div className="flex p-4 lg:p-6 gap-4 lg:gap-8">
                      <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image src={item.imageUrl || "https://picsum.photos/seed/item/200/200"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-headline font-bold text-sm lg:text-lg truncate pr-2">{item.name}</h3>
                            <Badge variant="outline" className="text-[8px] lg:text-[10px] border-none px-2 py-0 bg-secondary/10 text-secondary">
                              Handover
                            </Badge>
                          </div>
                          <p className="text-[10px] lg:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {item.locationDescription}
                          </p>
                        </div>
                        <div className="flex items-center justify-end mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => setVerifyingItem(item)}
                            className="h-8 lg:h-10 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-bold bg-primary active:scale-95 transition-transform"
                          >
                            Verify Handover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} message="No handovers pending." />
            )}
          </TabsContent>

          <TabsContent value="office" className="space-y-4">
            {filterItems(inOfficeFound).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {filterItems(inOfficeFound).map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
                    <div className="flex p-4 lg:p-6 gap-4 lg:gap-8">
                      <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image src={item.imageUrl || "https://picsum.photos/seed/item/200/200"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-headline font-bold text-sm lg:text-lg truncate pr-2">{item.name}</h3>
                            <Badge variant="outline" className="text-[8px] lg:text-[10px] border-none px-2 py-0 bg-primary/10 text-primary">
                              In Office
                            </Badge>
                          </div>
                          <p className="text-[10px] lg:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3" /> {item.storageOffice}
                          </p>
                        </div>
                        <div className="flex items-center justify-end mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setResolvingItem(item)}
                            className="h-8 lg:h-10 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-bold border-primary/20 text-primary hover:bg-primary/10"
                          >
                            Mark Claimed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={Archive} message="No items in custody." />
            )}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            {filterItems(activeLost).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {filterItems(activeLost).map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm">
                    <div className="flex p-4 lg:p-6 gap-4 lg:gap-8">
                      <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                        <Image src={item.imageUrl || "https://picsum.photos/seed/lost/200/200"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-headline font-bold text-sm lg:text-lg truncate pr-2">{item.name}</h3>
                            <Badge variant="outline" className="text-[8px] lg:text-[10px] border-none px-2 py-0 bg-accent/10 text-accent">
                              Lost Report
                            </Badge>
                          </div>
                          <p className="text-[10px] lg:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {item.locationDescription}
                          </p>
                        </div>
                        <div className="flex items-center justify-end mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setResolvingItem(item)}
                            className="h-8 lg:h-10 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-bold border-accent/20 text-accent hover:bg-accent/10"
                          >
                            Mark Returned
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={History} message="No active lost reports." />
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-primary/5 border border-primary/10 p-5 lg:p-10 rounded-[28px] lg:rounded-[48px] flex items-start gap-3 lg:gap-8">
          <AlertCircle className="h-5 w-5 lg:h-8 lg:w-8 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs lg:text-xl font-bold text-primary">Guard Protocol</h4>
            <p className="text-[10px] lg:text-sm text-muted-foreground mt-1 leading-relaxed">
              For security, always log the student's Registration Number when handing back property. Verification of the item's storage location is critical for building a reliable real-time campus map. If an item is found in a residential block, it should be logged in the corresponding block's security office.
            </p>
          </div>
        </div>
      </main>

      <Dialog open={!!verifyingItem} onOpenChange={() => setVerifyingItem(null)}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" /> Log Storage
            </DialogTitle>
            <DialogDescription className="text-sm">
              Where is this item being physically kept?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Office / Building No.</Label>
              <Input 
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Block 34, Office 102"
                className="rounded-xl h-12 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleApprove}
              disabled={!storageLocation}
              className="w-full h-14 rounded-xl gradient-header font-bold text-sm"
            >
              Verify & Add to Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolvingItem} onOpenChange={() => setResolvingItem(null)}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-accent" /> Student Return
            </DialogTitle>
            <DialogDescription className="text-sm">
              Enter the student's registration details to close this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registration Number</Label>
              <Input 
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. 12200000"
                className="rounded-xl h-12 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleResolve}
              disabled={!regNumber}
              className="w-full h-14 rounded-xl gradient-accent font-bold text-sm"
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="text-center py-24 bg-muted/10 rounded-[32px] border-2 border-dashed border-muted/50">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-[11px] lg:text-sm font-bold text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  )
}
