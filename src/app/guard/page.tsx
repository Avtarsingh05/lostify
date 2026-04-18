
"use client"

import { useState, useMemo } from "react"
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
  History,
  QrCode,
  Package,
  Briefcase,
  Info,
  Tag,
  ChevronRight,
  LayoutGrid,
  Key
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
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  useDoc
} from "@/firebase"
import { collection, query, doc, orderBy, limit, where, getDocs } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [search, setSearch] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [isProcessingToken, setIsProcessingToken] = useState(false)

  const [verifyingItem, setVerifyingItem] = useState<any | null>(null)
  const [resolvingItem, setResolvingItem] = useState<any | null>(null)
  const [processingLuggage, setProcessingLuggage] = useState<any | null>(null)
  
  const [storageLocation, setStorageLocation] = useState("")
  const [regNumber, setRegNumber] = useState("")
  const [rackInput, setRackInput] = useState("")
  const [slotInput, setSlotInput] = useState("")

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const adminEmails = ["worker@gmail.com", "forigloohelp@gmail.com", "avtarsingh9528972330@gmail.com"];
    return adminEmails.includes(user.email?.toLowerCase() || "") || userData?.role === "ADMIN" || userData?.role === "GUARD";
  }, [user, userData]);

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "items"), orderBy("reportedAt", "desc"), limit(30))
  }, [db, isAuthorized])

  const clockItemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "clockRoomItems"), orderBy("createdAt", "desc"), limit(30))
  }, [db, isAuthorized])

  const { data: allItems, isLoading } = useCollection(itemsQuery)
  const { data: clockItems, isLoading: isClockLoading } = useCollection(clockItemsQuery)

  const pendingFound = useMemo(() => allItems?.filter(i => i.type === 'found' && i.status === 'Pending Verification') || [], [allItems])
  const inOfficeFound = useMemo(() => allItems?.filter(i => i.type === 'found' && i.status === 'In Custody') || [], [allItems])
  const activeLost = useMemo(() => allItems?.filter(i => i.type === 'lost' && i.status === 'Active') || [], [allItems])

  const handleProcessToken = async () => {
    if (!tokenInput || tokenInput.length < 4 || !db) return
    setIsProcessingToken(true)

    try {
      // 1. Check for Check-in Tokens (pending -> stored)
      const qCheckIn = query(collection(db, "clockRoomItems"), where("checkInCode", "==", tokenInput), where("status", "==", "pending_storage"), limit(1))
      const snapIn = await getDocs(qCheckIn)
      if (!snapIn.empty) {
        setProcessingLuggage({ ...snapIn.docs[0].data(), id: snapIn.docs[0].id })
        setTokenInput("")
        return
      }

      // 2. Check for Check-out Tokens (stored -> collected)
      const qCheckOut = query(collection(db, "clockRoomItems"), where("checkOutCode", "==", tokenInput), where("status", "==", "stored"), limit(1))
      const snapOut = await getDocs(qCheckOut)
      if (!snapOut.empty) {
        const item = { ...snapOut.docs[0].data(), id: snapOut.docs[0].id }
        // Directly resolve collection
        updateDocumentNonBlocking(doc(db, "clockRoomItems", item.id), {
          status: "collected",
          collectedAt: new Date().toISOString(),
          releasedBy: user?.displayName || user?.email?.split('@')[0] || "Guard"
        })
        toast({ title: "Collection Verified", description: "Luggage released to student." })
        setTokenInput("")
        return
      }

      toast({ variant: "destructive", title: "Invalid Token", description: "No active storage request matches this code." })
    } finally {
      setIsProcessingToken(false)
    }
  }

  const handleConfirmStorage = () => {
    if (!db || !processingLuggage || !rackInput || !slotInput) return
    updateDocumentNonBlocking(doc(db, "clockRoomItems", processingLuggage.id), {
      status: "stored",
      rackNumber: rackInput,
      slotNumber: slotInput,
      storedAt: new Date().toISOString(),
      storedBy: user?.displayName || user?.email?.split('@')[0] || "Guard"
    })
    toast({ title: "Luggage Secured", description: `Item moved to Rack ${rackInput}` })
    setProcessingLuggage(null)
    setRackInput("")
    setSlotInput("")
  }

  const filterItems = (list: any[]) => {
    return list.filter(item => 
      (item.name || item.itemType || item.registrationNumber)?.toLowerCase().includes(search.toLowerCase()) ||
      item.locationDescription?.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-headline font-bold">Guard Station</h1>
          </div>
          <div className="bg-white/20 p-2 lg:p-4 rounded-xl">
            <ShieldCheck className="h-5 w-5 lg:h-8 lg:w-8" />
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6">
        {/* TOKEN PROCESSING PANEL */}
        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/90 backdrop-blur-sm">
          <CardContent className="p-6 lg:p-10 flex flex-col md:flex-row items-center gap-6">
             <div className="bg-primary/10 p-4 rounded-2xl hidden md:block">
               <Key className="h-8 w-8 text-primary" />
             </div>
             <div className="flex-1 space-y-1">
               <h2 className="text-lg font-headline font-bold">Process Digital Token</h2>
               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Verify Check-in or Check-out</p>
             </div>
             <div className="w-full md:w-auto flex gap-2">
                <Input 
                  placeholder="Enter 4-digit code" 
                  value={tokenInput} 
                  onChange={(e) => setTokenInput(e.target.value)}
                  maxLength={4}
                  className="h-14 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] w-full md:w-48 bg-muted/30"
                />
                <Button onClick={handleProcessToken} disabled={isProcessingToken || tokenInput.length < 4} className="h-14 w-14 rounded-2xl gradient-header shrink-0">
                  {isProcessingToken ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                </Button>
             </div>
          </CardContent>
        </Card>

        <div className="relative group max-w-2xl mx-auto lg:max-w-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search item or reg..." className="pl-10 h-14 rounded-2xl shadow-lg bg-white/80" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Tabs defaultValue="clock" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border">
            <TabsTrigger value="clock" className="rounded-xl font-bold text-[8px] lg:text-xs gap-1">
              <Briefcase className="h-3 w-3" /> Clock
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[8px] lg:text-xs gap-1">
              <Clock className="h-3 w-3" /> Reports
            </TabsTrigger>
            <TabsTrigger value="office" className="rounded-xl font-bold text-[8px] lg:text-xs gap-1">
              <Archive className="h-3 w-3" /> Office
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[8px] lg:text-xs gap-1">
              <AlertCircle className="h-3 w-3" /> Lost
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-4">
            {isClockLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div> : filterItems(clockItems || []).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filterItems(clockItems || []).map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[28px] overflow-hidden bg-card/90 backdrop-blur-sm">
                    <div className="flex h-32">
                      <div className="w-32 relative overflow-hidden shrink-0 bg-muted">
                        <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
                        <div className="absolute top-2 left-2">
                           <Badge className={item.status === 'stored' ? 'bg-primary' : item.status === 'collected' ? 'bg-secondary' : 'bg-accent'}>
                             {item.status.replace('_', ' ').toUpperCase()}
                           </Badge>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                           <h3 className="font-headline font-bold text-sm truncate">{item.itemType}</h3>
                           <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">Reg: {item.registrationNumber}</p>
                           <p className="text-[9px] font-bold text-primary flex items-center gap-1 mt-1">
                             <Building className="h-3 w-3" /> {item.rackNumber === 'Awaiting Assignment' ? "Awaiting Handshake" : `Rack ${item.rackNumber}, Slot ${item.slotNumber}`}
                           </p>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[8px] font-bold uppercase opacity-50">{format(new Date(item.createdAt), 'MMM dd')}</span>
                           <Button variant="ghost" size="sm" className="h-6 text-[8px] font-bold uppercase">Details</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={Briefcase} message="No luggage activity." />}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterItems(pendingFound).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {filterItems(pendingFound).map((item) => (
                  <Card key={item.id} className="p-4 rounded-3xl bg-card">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl relative overflow-hidden"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-sm truncate">{item.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{item.locationDescription}</p>
                        <Button size="sm" onClick={() => setVerifyingItem(item)} className="h-8 rounded-xl text-[10px] font-bold mt-2">Log to Office</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={CheckCircle2} message="No reports pending." />}
          </TabsContent>

          <TabsContent value="office" className="space-y-4">
             {filterItems(inOfficeFound).map((item) => (
                <Card key={item.id} className="p-4 rounded-3xl bg-card flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl relative overflow-hidden"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                     <div>
                       <h3 className="font-bold text-sm">{item.name}</h3>
                       <p className="text-[9px] text-primary font-bold">{item.storageOffice}</p>
                     </div>
                   </div>
                   <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-8 rounded-xl text-[10px]">Mark Claimed</Button>
                </Card>
             ))}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
             {filterItems(activeLost).map((item) => (
                <Card key={item.id} className="p-4 rounded-3xl bg-card flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-xl relative overflow-hidden"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                     <h3 className="font-bold text-sm">{item.name}</h3>
                   </div>
                   <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-8 rounded-xl text-[10px]">Mark Returned</Button>
                </Card>
             ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* RACK ASSIGNMENT MODAL (Check-in Stage) */}
      <Dialog open={!!processingLuggage} onOpenChange={() => setProcessingLuggage(null)}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> Confirm Storage
            </DialogTitle>
            <DialogDescription className="text-sm">
              Verify the student's physical luggage and assign a rack slot.
            </DialogDescription>
          </DialogHeader>
          {processingLuggage && (
             <div className="space-y-6 py-4">
               <div className="bg-muted/30 p-4 rounded-2xl flex items-center gap-4">
                 <div className="w-16 h-16 rounded-xl relative overflow-hidden shrink-0 shadow-md">
                   <Image src={processingLuggage.imageUrl} alt="Bag" fill className="object-cover" />
                 </div>
                 <div>
                   <p className="text-sm font-bold">{processingLuggage.itemType} ({processingLuggage.color})</p>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Reg: {processingLuggage.registrationNumber}</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unique Marks</Label>
                   <p className="text-xs font-medium px-1">{processingLuggage.brandMarkings}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rack Number</Label>
                     <Input value={rackInput} onChange={(e) => setRackInput(e.target.value)} placeholder="e.g. 05" className="rounded-xl h-12" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Slot ID</Label>
                     <Input value={slotInput} onChange={(e) => setSlotInput(e.target.value)} placeholder="e.g. B-12" className="rounded-xl h-12" />
                   </div>
                 </div>
               </div>
             </div>
          )}
          <DialogFooter>
            <Button onClick={handleConfirmStorage} disabled={!rackInput || !slotInput} className="w-full h-14 rounded-xl gradient-header font-bold text-sm">
              Finalize Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standard Verification Modal */}
      <Dialog open={!!verifyingItem} onOpenChange={() => setVerifyingItem(null)}>
        <DialogContent className="max-w-[420px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Log Storage</DialogTitle>
            <DialogDescription className="text-sm">Where is this item being physically kept?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g. Block 34, Office 102" className="rounded-xl h-12" />
          </div>
          <DialogFooter><Button onClick={() => {
            updateDocumentNonBlocking(doc(db, "items", verifyingItem.id), { status: "In Custody", storageOffice: storageLocation, verifiedBy: user?.email })
            setVerifyingItem(null)
          }} disabled={!storageLocation} className="w-full h-12 rounded-xl gradient-header">Save Location</Button></DialogFooter>
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
