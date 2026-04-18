
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
  Key,
  Smartphone,
  Calendar,
  CreditCard,
  User,
  Phone,
  Camera,
  X
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
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase"
import { collection, query, doc, orderBy, limit, where, getDocs } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Html5QrcodeScanner } from "html5-qrcode"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [search, setSearch] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [isProcessingToken, setIsProcessingToken] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const [verifyingItem, setVerifyingItem] = useState<any | null>(null)
  const [resolvingItem, setResolvingItem] = useState<any | null>(null)
  const [processingLuggage, setProcessingLuggage] = useState<any | null>(null)
  const [viewingClockItem, setViewingClockItem] = useState<any | null>(null)
  
  const [storageLocation, setStorageLocation] = useState("")
  const [rackInput, setRackInput] = useState("")
  const [slotInput, setSlotInput] = useState("")

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

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

  useEffect(() => {
    if (isScannerOpen) {
      setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 200 }, false);
        scannerRef.current.render((decodedText) => {
          const code = decodedText.length > 4 ? decodedText.substring(0, 4) : decodedText;
          setTokenInput(code);
          setIsScannerOpen(false);
          scannerRef.current?.clear();
          toast({ title: "Token Captured", description: "Verifying record..." });
        }, (error) => {});
      }, 100);
    } else {
      scannerRef.current?.clear();
    }
    return () => scannerRef.current?.clear();
  }, [isScannerOpen, toast]);

  const handleProcessToken = async () => {
    const codeToProcess = tokenInput;
    if (!codeToProcess || codeToProcess.length < 4 || !db) return
    setIsProcessingToken(true)

    try {
      const qCheckIn = query(collection(db, "clockRoomItems"), where("checkInCode", "==", codeToProcess), where("status", "==", "pending_storage"), limit(1))
      const snapIn = await getDocs(qCheckIn)
      if (!snapIn.empty) {
        setProcessingLuggage({ ...snapIn.docs[0].data(), id: snapIn.docs[0].id })
        setTokenInput("")
        return
      }

      const qCheckOut = query(collection(db, "clockRoomItems"), where("checkOutCode", "==", codeToProcess), where("status", "==", "stored"), limit(1))
      const snapOut = await getDocs(qCheckOut)
      if (!snapOut.empty) {
        const item = { ...snapOut.docs[0].data(), id: snapOut.docs[0].id }
        deleteDocumentNonBlocking(doc(db, "clockRoomItems", item.id))
        toast({ title: "Verification Success", description: "Record deleted. Handover complete." })
        setTokenInput("")
        return
      }

      toast({ variant: "destructive", title: "Access Denied", description: "No matching token found." })
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
    toast({ title: "Rack Assigned", description: `Item moved to Rack ${rackInput}` })
    setProcessingLuggage(null)
    setRackInput("")
    setSlotInput("")
  }

  const filterItems = (list: any[]) => {
    const s = search.toLowerCase();
    return list.filter(item => 
      item.name?.toLowerCase().includes(s) ||
      item.itemType?.toLowerCase().includes(s) ||
      item.registrationNumber?.toLowerCase().includes(s) ||
      item.reporterRegNo?.toLowerCase().includes(s) ||
      item.claimerRegNo?.toLowerCase().includes(s) ||
      item.studentName?.toLowerCase().includes(s) ||
      item.locationDescription?.toLowerCase().includes(s)
    )
  }

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-headline font-bold">Guard Station</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6">
        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-sm mx-auto">
          <CardContent className="p-4 sm:p-5 flex flex-col items-center gap-4">
             <div className="flex w-full items-center justify-between px-1">
               <div className="flex items-center gap-2">
                 <div className="bg-primary/10 p-2 rounded-xl">
                   <Key className="h-4 w-4 text-primary" />
                 </div>
                 <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Token Verification</h2>
               </div>
               <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-secondary/10 p-2 rounded-xl text-secondary active:scale-95 transition-all"
               >
                 <Camera className="h-4 w-4" />
               </button>
             </div>
             
             <div className="w-full flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    placeholder="PIN" 
                    value={tokenInput} 
                    onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    className="h-12 rounded-xl text-center text-xl font-headline font-black tracking-[0.4em] bg-muted/40 border-none shadow-none focus-visible:ring-1 focus-visible:bg-white transition-all"
                  />
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 pointer-events-none" />
                </div>
                <button 
                  onClick={handleProcessToken} 
                  disabled={isProcessingToken || tokenInput.length < 4} 
                  className="h-12 w-12 rounded-xl gradient-header shadow-lg shadow-primary/20 active:scale-90 transition-all shrink-0 flex items-center justify-center text-white disabled:opacity-50"
                >
                  {isProcessingToken ? <Loader2 className="animate-spin h-4 w-4" /> : <ChevronRight className="h-5 w-5" />}
                </button>
             </div>
          </CardContent>
        </Card>

        <div className="relative group mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-9 h-12 rounded-2xl shadow-lg bg-white/80 dark:bg-card/80 border-none text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Tabs defaultValue="clock" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border overflow-hidden">
            <TabsTrigger value="clock" className="rounded-xl font-bold text-[8px] sm:text-[10px] gap-1 px-1">
              <Briefcase className="h-3 w-3" /> Clock
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[8px] sm:text-[10px] gap-1 px-1">
              <Clock className="h-3 w-3" /> Reports
            </TabsTrigger>
            <TabsTrigger value="office" className="rounded-xl font-bold text-[8px] sm:text-[10px] gap-1 px-1">
              <Archive className="h-3 w-3" /> Office
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[8px] sm:text-[10px] gap-1 px-1">
              <AlertCircle className="h-3 w-3" /> Lost
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-4">
            {isClockLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div> : filterItems(clockItems || []).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filterItems(clockItems || []).map((item) => (
                  <Card key={item.id} className="border-none shadow-md rounded-[24px] overflow-hidden bg-card/90 backdrop-blur-sm">
                    <div className="flex h-28">
                      <div className="w-24 relative overflow-hidden shrink-0 bg-muted">
                        <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
                        <div className="absolute top-1.5 left-1.5">
                           <Badge className={`text-[7px] px-1 h-3 border-none ${item.status === 'stored' ? 'bg-primary' : 'bg-accent'}`}>
                             {item.status.split('_')[0].toUpperCase()}
                           </Badge>
                        </div>
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                           <h3 className="font-headline font-bold text-[11px] sm:text-xs truncate">{item.itemType}</h3>
                           <p className="text-[9px] font-medium text-muted-foreground truncate">{item.studentName}</p>
                           <p className="text-[9px] font-bold text-primary flex items-center gap-1 mt-1 truncate">
                             <Building className="h-2.5 w-2.5" /> Rack {item.rackNumber}
                           </p>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[7px] font-bold opacity-50 uppercase">{format(new Date(item.createdAt), 'MMM dd')}</span>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewingClockItem(item)}
                            className="h-6 text-[8px] font-bold uppercase tracking-widest hover:bg-primary/5"
                           >
                            Details
                           </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={Briefcase} message="Storage idle." />}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterItems(pendingFound).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filterItems(pendingFound).map((item) => (
                  <Card key={item.id} className="p-3 rounded-[24px] bg-card border-none shadow-md">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl relative overflow-hidden shadow-sm">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="font-headline font-bold text-xs truncate leading-tight">{item.name}</h3>
                        <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5 italic">{item.locationDescription}</p>
                        <Button size="sm" onClick={() => setVerifyingItem(item)} className="h-8 rounded-xl text-[9px] font-bold mt-3 gradient-header w-full shadow-lg">Verify Handover</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <EmptyState icon={CheckCircle2} message="Queue empty." />}
          </TabsContent>

          <TabsContent value="office" className="space-y-3">
             {filterItems(inOfficeFound).map((item) => (
                <Card key={item.id} className="p-3 rounded-2xl bg-card border-none shadow-sm flex items-center justify-between gap-3">
                   <div className="flex items-center gap-3 min-w-0">
                     <div className="w-12 h-12 rounded-xl relative overflow-hidden shrink-0 shadow-sm border border-black/5">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                     </div>
                     <div className="min-w-0">
                       <h3 className="font-bold text-xs truncate leading-tight">{item.name}</h3>
                       <p className="text-[8px] text-primary font-bold uppercase tracking-wider mt-0.5">{item.storageOffice}</p>
                     </div>
                   </div>
                   <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-8 px-3 rounded-xl text-[9px] font-bold border-primary/20 text-primary shrink-0">Release</Button>
                </Card>
             ))}
          </TabsContent>

          <TabsContent value="lost" className="space-y-3">
             {filterItems(activeLost).map((item) => (
                <Card key={item.id} className="p-3 rounded-2xl bg-card border-none shadow-sm flex items-center justify-between gap-3">
                   <div className="flex items-center gap-3 min-w-0">
                     <div className="w-12 h-12 rounded-xl relative overflow-hidden shrink-0 shadow-sm">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                     </div>
                     <h3 className="font-bold text-xs truncate leading-tight">{item.name}</h3>
                   </div>
                   <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-8 px-3 rounded-xl text-[9px] font-bold shrink-0">Mark Back</Button>
                </Card>
             ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* QR SCANNER MODAL */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-[90%] sm:max-w-[400px] rounded-[32px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-primary" /> Visual Scan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Frame the student's digital token QR.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-square bg-black rounded-2xl overflow-hidden mt-4 relative border-4 border-muted/20" id="qr-reader">
             {/* Scanner overlay visuals could go here */}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full rounded-2xl h-12 font-bold text-xs uppercase tracking-widest">Abort Scan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLOCK ITEM FULL DETAILS MODAL */}
      <Dialog open={!!viewingClockItem} onOpenChange={() => setViewingClockItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[440px] rounded-[32px] sm:rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
             <DialogTitle>Audit Record</DialogTitle>
             <DialogDescription>Verification details.</DialogDescription>
          </DialogHeader>
          {viewingClockItem && (
            <div className="flex flex-col">
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image src={viewingClockItem.imageUrl} alt="Luggage" fill className="object-cover" />
                <div className="absolute top-3 right-3">
                   <Badge className="bg-black/60 backdrop-blur-md border-none font-bold uppercase text-[8px] h-5 px-2">
                     {viewingClockItem.status.replace('_', ' ')}
                   </Badge>
                </div>
              </div>
              <ScrollArea className="max-h-[50vh]">
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 min-w-0">
                       <h2 className="text-xl font-headline font-bold truncate leading-tight pr-2">{viewingClockItem.itemType}</h2>
                       <div className="space-y-1 pt-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <User className="h-3 w-3 text-primary" /> {viewingClockItem.studentName}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <CreditCard className="h-3 w-3 text-primary" /> ID: {viewingClockItem.registrationNumber}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Phone className="h-3 w-3 text-primary" /> {viewingClockItem.phoneNumber}
                          </p>
                       </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: viewingClockItem.color }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-2xl space-y-1">
                      <p className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter">Location</p>
                      <div className="text-[10px] font-bold flex items-center gap-1.5 truncate">
                         <Building className="h-3 w-3 text-primary" />
                         {viewingClockItem.rackNumber === 'Staging' ? 'Uni Mall' : `Rack ${viewingClockItem.rackNumber}`}
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-2xl space-y-1">
                      <p className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter">Date</p>
                      <div className="text-[10px] font-bold flex items-center gap-1.5">
                         <Calendar className="h-3 w-3 text-primary" />
                         {format(new Date(viewingClockItem.createdAt), 'MMM dd')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Security Answers</p>
                    <div className="space-y-4 bg-muted/20 p-4 rounded-[24px] border border-dashed">
                       <div className="space-y-1">
                          <Label className="text-[8px] font-bold uppercase text-primary tracking-wider">Unique Marks</Label>
                          <p className="text-xs font-medium leading-relaxed italic opacity-80">"{viewingClockItem.brandMarkings}"</p>
                       </div>
                       <div className="space-y-1 border-t pt-3 border-black/5">
                          <Label className="text-[8px] font-bold uppercase text-primary tracking-wider">Contents</Label>
                          <p className="text-xs font-medium leading-relaxed italic opacity-80">"{viewingClockItem.contentsVerification}"</p>
                       </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-6 sm:p-8 pt-0">
                <Button onClick={() => setViewingClockItem(null)} variant="outline" className="w-full h-12 rounded-2xl font-bold border-2 text-[10px] uppercase tracking-widest">Dismiss Record</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RACK ASSIGNMENT MODAL */}
      <Dialog open={!!processingLuggage} onOpenChange={() => setProcessingLuggage(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-lg sm:text-xl flex items-center gap-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Assign Storage
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-sm">
              Confirm physical bag match and assign a rack.
            </DialogDescription>
          </DialogHeader>
          {processingLuggage && (
             <div className="space-y-5 py-4">
               <div className="bg-muted/30 p-3 sm:p-4 rounded-2xl flex items-center gap-3">
                 <div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm border border-black/5">
                   <Image src={processingLuggage.imageUrl} alt="Bag" fill className="object-cover" />
                 </div>
                 <div className="min-w-0">
                   <p className="text-xs font-bold truncate leading-tight">{processingLuggage.itemType} ({processingLuggage.color})</p>
                   <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight truncate mt-1">{processingLuggage.studentName}</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rack #</Label>
                     <Input value={rackInput} onChange={(e) => setRackInput(e.target.value)} placeholder="01" className="rounded-xl h-11 text-sm bg-muted/20 border-none shadow-none text-center font-bold" />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Slot ID</Label>
                     <Input value={slotInput} onChange={(e) => setSlotInput(e.target.value)} placeholder="A-05" className="rounded-xl h-11 text-sm bg-muted/20 border-none shadow-none text-center font-bold" />
                   </div>
                 </div>
               </div>
             </div>
          )}
          <DialogFooter>
            <Button onClick={handleConfirmStorage} disabled={!rackInput || !slotInput} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest shadow-xl">
              Complete Staging
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESOLUTION MODAL */}
      <Dialog open={!!resolvingItem} onOpenChange={() => setResolvingItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-lg sm:text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" /> Handover Match
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm item has been returned to owner.
            </DialogDescription>
          </DialogHeader>
          {resolvingItem && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/30 p-3 sm:p-4 rounded-2xl flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm">
                  <Image src={resolvingItem.imageUrl} alt="Item" fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">{resolvingItem.name}</p>
                  <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest truncate mt-1">{resolvingItem.category}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic px-1">
                By resolving, you confirm this record is officially closed and the item is no longer in security custody.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              updateDocumentNonBlocking(doc(db, "items", resolvingItem.id), { 
                status: "Resolved", 
                resolvedBy: user?.displayName || user?.email || "Staff",
                resolvedAt: new Date().toISOString() 
              })
              setResolvingItem(null)
              toast({ title: "Audit Updated", description: "Item successfully resolved." })
            }} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest">Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standard Log Storage Modal */}
      <Dialog open={!!verifyingItem} onOpenChange={() => setVerifyingItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Log to Office
            </DialogTitle>
            <DialogDescription className="text-xs">Physical storage coordinates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g. Block 34 (Security)" className="rounded-xl h-12 bg-muted/20 border-none shadow-none text-xs" />
          </div>
          <DialogFooter>
            <Button onClick={() => {
              updateDocumentNonBlocking(doc(db, "items", verifyingItem.id), { status: "In Custody", storageOffice: storageLocation, verifiedBy: user?.email })
              setVerifyingItem(null)
            }} disabled={!storageLocation} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest">Secure Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="text-center py-16 bg-muted/10 rounded-[32px] border-2 border-dashed border-muted-foreground/30 px-6">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{message}</p>
    </div>
  )
}
