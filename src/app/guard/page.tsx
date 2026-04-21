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
  X,
  Zap,
  ShieldAlert
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
    return query(collection(db, "items"), limit(100))
  }, [db, isAuthorized])

  const clockItemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "clockRoomItems"), limit(100))
  }, [db, isAuthorized])

  const { data: rawItems, isLoading: isItemsLoading } = useCollection(itemsQuery)
  const { data: rawClockItems, isLoading: isClockLoading } = useCollection(clockItemsQuery)

  const allItems = useMemo(() => {
    if (!rawItems) return []
    return [...rawItems].sort((a, b) => {
      const dateA = a.reportedAt ? new Date(a.reportedAt).getTime() : 0
      const dateB = b.reportedAt ? new Date(b.reportedAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawItems])

  const clockItems = useMemo(() => {
    if (!rawClockItems) return []
    return [...rawClockItems].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [rawClockItems])

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
        const itemDoc = snapOut.docs[0];
        updateDocumentNonBlocking(doc(db, "clockRoomItems", itemDoc.id), {
          status: "collected",
          collectedAt: new Date().toISOString(),
          releasedBy: user?.displayName || user?.email?.split('@')[0] || "Guard"
        });
        toast({ title: "Verification Success", description: "Item marked as Collected." })
        setTokenInput("")
        return
      }

      toast({ variant: "destructive", title: "Access Denied", description: "No matching token found." })
    } catch (e) {
      console.error("Token Process Error:", e)
      toast({ variant: "destructive", title: "System Error", description: "Could not verify PIN." })
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
      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-xl font-headline font-bold">Guard Station</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
        </div>
      </div>

      {/* WEB HEADER */}
      <div className="hidden lg:flex gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Campus Security Portal</h1>
                <p className="text-xl text-white/70 mt-2">Unified station for verifying handovers, storage assignments, and audit trails</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="bg-white/20 p-6 rounded-[32px] backdrop-blur-md border border-white/10 flex items-center gap-4">
                 <ShieldCheck className="h-10 w-10" />
                 <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">Auth Level</p>
                    <p className="text-xl font-bold">{userData?.role || 'GUARD'}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Verification Widget - Sidebar on Web */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl">
              <CardContent className="p-6 lg:p-10 flex flex-col items-center gap-6">
                 <div className="flex w-full items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="bg-primary/10 p-3 rounded-2xl"><Key className="h-5 w-5 text-primary" /></div>
                     <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Digital Handshake</h2>
                   </div>
                   <button onClick={() => setIsScannerOpen(true)} className="bg-secondary/10 p-3 rounded-2xl text-secondary hover:bg-secondary/20 transition-all"><Camera className="h-5 w-5" /></button>
                 </div>
                 <div className="w-full flex flex-col gap-4">
                    <div className="relative">
                      <Input placeholder="ENTER 4-DIGIT PIN" value={tokenInput} onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))} maxLength={4} className="h-20 rounded-[24px] text-center text-5xl font-mono font-black tracking-[0.4em] bg-muted/30 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" />
                      <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    </div>
                    <Button onClick={handleProcessToken} disabled={isProcessingToken || tokenInput.length < 4} className="h-16 rounded-[24px] gradient-header font-bold text-lg shadow-xl shadow-primary/20">
                      {isProcessingToken ? <Loader2 className="animate-spin h-6 w-6" /> : "Authorize Handover"}
                    </Button>
                 </div>
              </CardContent>
            </Card>

            {/* Quick Stats for Web */}
            <div className="hidden lg:grid grid-cols-2 gap-6">
               <Card className="rounded-[32px] border-none shadow-lg p-8 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Storage</p>
                  <p className="text-4xl font-headline font-bold text-primary">{clockItems.filter(i => i.status === 'stored').length}</p>
               </Card>
               <Card className="rounded-[32px] border-none shadow-lg p-8 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Verification</p>
                  <p className="text-4xl font-headline font-bold text-accent">{pendingFound.length}</p>
               </Card>
            </div>
          </div>

          {/* Main Tables/List - Content Area on Web */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search students, IDs, items or locations..." className="pl-12 h-14 rounded-[24px] shadow-xl bg-white border-none text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <Tabs defaultValue="clock" className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-[24px] p-1 bg-card shadow-xl h-14 lg:h-16 mb-6 border overflow-hidden">
                <TabsTrigger value="clock" className="rounded-xl font-bold text-[8px] sm:text-xs gap-2">
                  <Briefcase className="h-4 w-4" /> <span className="hidden sm:inline">Clock Room</span><span className="sm:hidden">Clock</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-xl font-bold text-[8px] sm:text-xs gap-2">
                  <Clock className="h-4 w-4" /> <span className="hidden sm:inline">Found Reports</span><span className="sm:hidden">Reports</span>
                </TabsTrigger>
                <TabsTrigger value="office" className="rounded-xl font-bold text-[8px] sm:text-xs gap-2">
                  <Archive className="h-4 w-4" /> <span className="hidden sm:inline">In Office</span><span className="sm:hidden">Office</span>
                </TabsTrigger>
                <TabsTrigger value="lost" className="rounded-xl font-bold text-[8px] sm:text-xs gap-2">
                  <AlertCircle className="h-4 w-4" /> <span className="hidden sm:inline">Lost Alerts</span><span className="sm:hidden">Lost</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clock" className="space-y-4 m-0">
                {isClockLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : filterItems(clockItems || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterItems(clockItems || []).map((item) => (
                      <Card key={item.id} className="border-none shadow-md rounded-[32px] overflow-hidden bg-card group hover:shadow-xl transition-all">
                        <div className="flex h-32">
                          <div className="w-32 relative overflow-hidden shrink-0 bg-muted">
                            <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-2 left-2">
                               <Badge className={`text-[8px] px-2 h-5 border-none shadow-lg ${item.status === 'stored' ? 'bg-primary' : item.status === 'collected' ? 'bg-secondary' : 'bg-accent'}`}>
                                 {item.status.replace('_', ' ').toUpperCase()}
                               </Badge>
                            </div>
                          </div>
                          <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                            <div>
                               <h3 className="font-headline font-bold text-sm truncate leading-tight">{item.itemType}</h3>
                               <p className="text-[10px] font-medium text-muted-foreground truncate">{item.studentName}</p>
                               <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[8px] border-primary/20 text-primary bg-primary/5 px-2">
                                    <Building className="h-2.5 w-2.5 mr-1" /> {item.rackNumber === 'Staging' ? 'STAGING' : `RACK ${item.rackNumber}`}
                                  </Badge>
                               </div>
                            </div>
                            <button onClick={() => setViewingClockItem(item)} className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70">
                               View Full Audit <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : <EmptyState icon={Briefcase} message="Storage facility is idle." />}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 m-0">
                {filterItems(pendingFound).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterItems(pendingFound).map((item) => (
                      <Card key={item.id} className="p-4 rounded-[32px] bg-card border-none shadow-md">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-2xl relative overflow-hidden shadow-sm shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-headline font-bold text-sm truncate leading-tight">{item.name}</h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 italic">{item.locationDescription}</p>
                            <Button size="sm" onClick={() => setVerifyingItem(item)} className="h-9 rounded-xl text-[10px] font-bold mt-4 gradient-header w-full shadow-lg">Process Handover</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : <EmptyState icon={CheckCircle2} message="Report queue is clear." />}
              </TabsContent>

              <TabsContent value="office" className="space-y-3 m-0">
                 {filterItems(inOfficeFound).map((item) => (
                    <Card key={item.id} className="p-4 rounded-[28px] bg-card border-none shadow-sm flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4 min-w-0">
                         <div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm border border-black/5">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                         </div>
                         <div className="min-w-0">
                           <h3 className="font-bold text-sm truncate leading-tight">{item.name}</h3>
                           <p className="text-[9px] text-primary font-bold uppercase tracking-wider mt-1">{item.storageOffice}</p>
                         </div>
                       </div>
                       <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-10 px-6 rounded-2xl text-[10px] font-bold border-primary/20 text-primary shadow-sm">Release to Owner</Button>
                    </Card>
                 ))}
                 {inOfficeFound.length === 0 && <EmptyState icon={Archive} message="No items in physical custody." />}
              </TabsContent>

              <TabsContent value="lost" className="space-y-3 m-0">
                 {filterItems(activeLost).map((item) => (
                    <Card key={item.id} className="p-4 rounded-[28px] bg-card border-none shadow-sm flex items-center justify-between gap-4">
                       <div className="flex items-center gap-4 min-w-0">
                         <div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                         </div>
                         <h3 className="font-bold text-sm truncate leading-tight">{item.name}</h3>
                       </div>
                       <Button size="sm" variant="outline" onClick={() => setResolvingItem(item)} className="h-10 px-6 rounded-2xl text-[10px] font-bold">Mark as Returned</Button>
                    </Card>
                 ))}
                 {activeLost.length === 0 && <EmptyState icon={ShieldAlert} message="No active lost reports." />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Modals from original file are same logic, just with refined UI for Web compatibility */}
      {/* Visual Scan Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-[90%] sm:max-w-[400px] rounded-[32px] p-6 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg"><Camera className="h-5 w-5 text-primary" /> Visual Scan</DialogTitle><DialogDescription className="text-xs">Frame the student's digital token QR.</DialogDescription></DialogHeader>
          <div className="aspect-square bg-black rounded-2xl overflow-hidden mt-4 relative border-4 border-muted/20" id="qr-reader"></div>
          <DialogFooter className="mt-4"><Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full rounded-2xl h-12 font-bold text-xs uppercase tracking-widest">Abort Scan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock Room Item Details Dialog */}
      <Dialog open={!!viewingClockItem} onOpenChange={() => setViewingClockItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[440px] rounded-[32px] sm:rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>Audit Record</DialogTitle><DialogDescription>Verification details.</DialogDescription></DialogHeader>
          {viewingClockItem && (
            <div className="flex flex-col">
              <div className="aspect-[16/10] relative overflow-hidden"><Image src={viewingClockItem.imageUrl} alt="Luggage" fill className="object-cover" /><div className="absolute top-3 right-3"><Badge className={`backdrop-blur-md border-none font-bold uppercase text-[8px] h-5 px-2 ${viewingClockItem.status === 'stored' ? 'bg-primary/80' : viewingClockItem.status === 'collected' ? 'bg-secondary/80' : 'bg-accent/80'}`}>{viewingClockItem.status.replace('_', ' ')}</Badge></div></div>
              <ScrollArea className="max-h-[50vh]">
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 min-w-0"><h2 className="text-xl font-headline font-bold truncate leading-tight pr-2">{viewingClockItem.itemType}</h2><div className="space-y-1 pt-1"><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><User className="h-3 w-3 text-primary" /> {viewingClockItem.studentName}</p><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><CreditCard className="h-3 w-3 text-primary" /> ID: {viewingClockItem.registrationNumber}</p><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Phone className="h-3 w-3 text-primary" /> {viewingClockItem.phoneNumber}</p></div></div>
                    <div className="w-5 h-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: viewingClockItem.color }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-2xl space-y-1"><p className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter">Location</p><div className="text-[10px] font-bold flex items-center gap-1.5 truncate"><Building className="h-3 w-3 text-primary" /> {viewingClockItem.rackNumber === 'Staging' ? 'Uni Mall' : `Rack ${viewingClockItem.rackNumber}`}</div></div>
                    <div className="p-3 bg-muted/30 rounded-2xl space-y-1"><p className="text-[7px] font-black text-muted-foreground uppercase tracking-tighter">Handled By</p><div className="text-[10px] font-bold flex items-center gap-1.5 truncate"><ShieldCheck className="h-3 w-3 text-primary" /> {viewingClockItem.storedBy || "Assigned"}</div></div>
                  </div>
                  <div className="space-y-3"><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Audit Timeline</p><div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed text-[10px]"><div className="flex justify-between items-center"><span className="text-muted-foreground">Log Created</span><span className="font-bold">{format(new Date(viewingClockItem.createdAt), 'MMM dd, HH:mm')}</span></div>{viewingClockItem.storedAt && (<div className="flex justify-between items-center border-t pt-2"><span className="text-primary font-bold">Check-in</span><span className="font-bold">{format(new Date(viewingClockItem.storedAt), 'MMM dd, HH:mm')}</span></div>)}{viewingClockItem.collectedAt && (<div className="flex justify-between items-center border-t pt-2"><span className="text-secondary font-bold">Check-out</span><span className="font-bold">{format(new Date(viewingClockItem.collectedAt), 'MMM dd, HH:mm')}</span></div>)}</div></div>
                  <div className="space-y-4"><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Security Answers</p><div className="space-y-4 bg-muted/20 p-4 rounded-[24px] border border-dashed"><div className="space-y-1"><Label className="text-[8px] font-bold uppercase text-primary tracking-wider">Unique Marks</Label><p className="text-xs font-medium leading-relaxed italic opacity-80">"{viewingClockItem.brandMarkings}"</p></div><div className="space-y-1 border-t pt-3 border-black/5"><Label className="text-[8px] font-bold uppercase text-primary tracking-wider">Contents</Label><p className="text-xs font-medium leading-relaxed italic opacity-80">"{viewingClockItem.contentsVerification}"</p></div></div></div>
                </div>
              </ScrollArea>
              <div className="p-6 sm:p-8 pt-0"><Button onClick={() => setViewingClockItem(null)} variant="outline" className="w-full h-12 rounded-2xl font-bold border-2 text-[10px] uppercase tracking-widest">Dismiss Record</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rack Assignment Dialog */}
      <Dialog open={!!processingLuggage} onOpenChange={() => setProcessingLuggage(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-headline font-bold text-lg sm:text-xl flex items-center gap-2"><Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Assign Storage</DialogTitle><DialogDescription className="text-[10px] sm:text-sm">Confirm physical bag match and assign a rack.</DialogDescription></DialogHeader>
          {processingLuggage && (
             <div className="space-y-5 py-4">
               <div className="bg-muted/30 p-3 sm:p-4 rounded-2xl flex items-center gap-3"><div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm border border-black/5"><Image src={processingLuggage.imageUrl} alt="Bag" fill className="object-cover" /></div><div className="min-w-0"><p className="text-xs font-bold truncate leading-tight">{processingLuggage.itemType} ({processingLuggage.color})</p><p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight truncate mt-1">{processingLuggage.studentName}</p></div></div>
               <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rack #</Label><Input value={rackInput} onChange={(e) => setRackInput(e.target.value)} placeholder="01" className="rounded-xl h-11 text-sm bg-muted/20 border-none shadow-none text-center font-bold" /></div><div className="space-y-1.5"><Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Slot ID</Label><Input value={slotInput} onChange={(e) => setSlotInput(e.target.value)} placeholder="A-05" className="rounded-xl h-11 text-sm bg-muted/20 border-none shadow-none text-center font-bold" /></div></div></div>
             </div>
          )}
          <DialogFooter><Button onClick={handleConfirmStorage} disabled={!rackInput || !slotInput} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest shadow-xl">Complete Staging</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={!!resolvingItem} onOpenChange={() => setResolvingItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-headline font-bold text-lg sm:text-xl flex items-center gap-2"><CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" /> Handover Match</DialogTitle><DialogDescription className="text-xs">Confirm item has been returned to owner.</DialogDescription></DialogHeader>
          {resolvingItem && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/30 p-3 sm:p-4 rounded-2xl flex items-center gap-3"><div className="w-14 h-14 rounded-xl relative overflow-hidden shrink-0 shadow-sm"><Image src={resolvingItem.imageUrl} alt="Item" fill className="object-cover" /></div><div className="min-w-0"><p className="text-xs font-bold truncate leading-tight">{resolvingItem.name}</p><p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest truncate mt-1">{resolvingItem.category}</p></div></div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic px-1">By resolving, you confirm this record is officially closed and the item is no longer in security custody.</p>
            </div>
          )}
          <DialogFooter><Button onClick={() => { updateDocumentNonBlocking(doc(db, "items", resolvingItem.id), { status: "Resolved", resolvedBy: user?.displayName || user?.email || "Staff", resolvedAt: new Date().toISOString() }); setResolvingItem(null); toast({ title: "Audit Updated", description: "Item successfully resolved." }) }} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest">Mark Resolved</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standard Log Storage Dialog */}
      <Dialog open={!!verifyingItem} onOpenChange={() => setVerifyingItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-headline font-bold text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Log to Office</DialogTitle><DialogDescription className="text-xs">Physical storage coordinates.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4"><Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="e.g. Block 34 (Security)" className="rounded-xl h-12 bg-muted/20 border-none shadow-none text-xs" /></div>
          <DialogFooter><Button onClick={() => { updateDocumentNonBlocking(doc(db, "items", verifyingItem.id), { status: "In Custody", storageOffice: storageLocation, verifiedBy: user?.email }); setVerifyingItem(null) }} disabled={!storageLocation} className="w-full h-14 rounded-2xl gradient-header font-bold text-xs uppercase tracking-widest">Secure Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="text-center py-24 bg-muted/10 rounded-[48px] border-4 border-dashed border-muted-foreground/10 px-6">
      <Icon className="h-16 w-16 mx-auto text-muted-foreground/10 mb-4" />
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">{message}</p>
    </div>
  )
}