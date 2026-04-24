
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
  History as HistoryIcon,
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
  ShieldAlert,
  AlertTriangle,
  ClipboardList
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
import { format, formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function GuardDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [search, setSearch] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [isProcessingToken, setIsProcessingToken] = useState(false)
  const [activeTab, setActiveTab] = useState("office")

  // Handover Logic
  const [handoverItem, setHandoverItem] = useState<any | null>(null)
  const [isCapturingUser, setIsCapturingUser] = useState(false)
  const [capturedUserPhoto, setCapturedUserPhoto] = useState<string | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientReg, setRecipientReg] = useState("")

  const [processingLuggage, setProcessingLuggage] = useState<any | null>(null)
  const [rackInput, setRackInput] = useState("")
  const [slotInput, setSlotInput] = useState("")

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  // Data Fetching
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "items"), orderBy("reportedAt", "desc"), limit(100))
  }, [db, isAuthorized])

  const clockItemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "clockRoomItems"), orderBy("createdAt", "desc"), limit(100))
  }, [db, isAuthorized])

  const handoversQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "handoverHistory"), orderBy("timestamp", "desc"), limit(100))
  }, [db, isAuthorized])

  const theftReportsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "theftReports"), orderBy("timestamp", "desc"), limit(50))
  }, [db, isAuthorized])

  const { data: allItems, isLoading: isItemsLoading } = useCollection(itemsQuery)
  const { data: clockItems, isLoading: isClockLoading } = useCollection(clockItemsQuery)
  const { data: handoverHistory } = useCollection(handoversQuery)
  const { data: theftReports } = useCollection(theftReportsQuery)

  // Filtering
  const inOfficeFound = useMemo(() => 
    allItems?.filter(i => i.type === 'found' && i.status === 'In Custody' && 
      (i.name?.toLowerCase().includes(search.toLowerCase()) || i.reporterRegNo?.includes(search))) || []
  , [allItems, search])

  const activeLost = useMemo(() => 
    allItems?.filter(i => i.type === 'lost' && i.status === 'Active' && 
      (i.name?.toLowerCase().includes(search.toLowerCase()) || i.locationDescription?.toLowerCase().includes(search.toLowerCase()))) || []
  , [allItems, search])

  const activeClock = useMemo(() => 
    clockItems?.filter(i => i.status !== 'collected' && 
      (i.studentName?.toLowerCase().includes(search.toLowerCase()) || i.registrationNumber?.includes(search))) || []
  , [clockItems, search])

  const recentHandovers = useMemo(() => 
    handoverHistory?.filter(h => h.itemName?.toLowerCase().includes(search.toLowerCase()) || h.recipientReg?.includes(search)) || []
  , [handoverHistory, search])

  // Camera Actions
  const startUserCamera = async () => {
    setIsCapturingUser(true)
    setTimeout(async () => {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
         if (videoRef.current) videoRef.current.srcObject = stream;
       } catch (err) {
         toast({ variant: "destructive", title: "Camera Error", description: "Could not access front camera." })
       }
    }, 100)
  }

  const stopUserCamera = () => {
    if (videoRef.current?.srcObject) {
       (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
    setIsCapturingUser(false)
  }

  const captureUserPhoto = () => {
    if (videoRef.current && canvasRef.current) {
       const v = videoRef.current; const c = canvasRef.current;
       c.width = v.videoWidth; c.height = v.videoHeight;
       c.getContext('2d')?.drawImage(v, 0, 0);
       setCapturedUserPhoto(c.toDataURL('image/jpeg'));
       stopUserCamera();
    }
  }

  // Processing Logic
  const handleProcessToken = async () => {
    if (!tokenInput || tokenInput.length < 4 || !db) return
    setIsProcessingToken(true)

    try {
      // 1. Check Claims first (Lost & Found)
      const qClaim = query(collection(db, "claims"), where("claimCode", "==", tokenInput), where("status", "==", "approved"), limit(1))
      const snapClaim = await getDocs(qClaim)
      if (!snapClaim.empty) {
         const claim = snapClaim.docs[0].data();
         const itemDoc = await getDocs(query(collection(db, "items"), where("__name__", "==", claim.itemId)));
         if (!itemDoc.empty) {
            setHandoverItem({ ...itemDoc.docs[0].data(), id: claim.itemId, claimId: snapClaim.docs[0].id })
            setTokenInput("")
            return
         }
      }

      // 2. Check Clock Room Check-In
      const qCheckIn = query(collection(db, "clockRoomItems"), where("checkInCode", "==", tokenInput), where("status", "==", "pending_storage"), limit(1))
      const snapIn = await getDocs(qCheckIn)
      if (!snapIn.empty) {
        setProcessingLuggage({ ...snapIn.docs[0].data(), id: snapIn.docs[0].id })
        setTokenInput("")
        return
      }

      // 3. Check Clock Room Check-Out
      const qCheckOut = query(collection(db, "clockRoomItems"), where("checkOutCode", "==", tokenInput), where("status", "==", "stored"), limit(1))
      const snapOut = await getDocs(qCheckOut)
      if (!snapOut.empty) {
         const itemData = { ...snapOut.docs[0].data(), id: snapOut.docs[0].id };
         setHandoverItem({ ...itemData, isClock: true });
         setTokenInput("")
         return
      }

      toast({ variant: "destructive", title: "Invalid Token", description: "No matching code found in the system." })
    } finally {
      setIsProcessingToken(false)
    }
  }

  const handleFinalizeHandover = async () => {
    if (!db || !handoverItem || !capturedUserPhoto || !recipientPhone || !recipientReg) {
      toast({ variant: "destructive", title: "Missing Evidence", description: "Photo, Phone, and ID are mandatory for handover." });
      return
    }

    try {
       const auditData = {
          itemId: handoverItem.id,
          itemName: handoverItem.name || handoverItem.itemType,
          itemImageUrl: handoverItem.imageUrl,
          recipientPhone,
          recipientReg,
          userPhoto: capturedUserPhoto,
          guardId: user?.uid,
          guardName: userData?.username || user?.displayName || "Campus Guard",
          timestamp: new Date().toISOString(),
          status: "Delivered"
       }

       await addDocumentNonBlocking(collection(db, "handoverHistory"), auditData);
       
       if (handoverItem.isClock) {
         updateDocumentNonBlocking(doc(db, "clockRoomItems", handoverItem.id), { status: "collected", collectedAt: new Date().toISOString() });
       } else {
         updateDocumentNonBlocking(doc(db, "items", handoverItem.id), { status: "Delivered", deliveredAt: new Date().toISOString() });
         updateDocumentNonBlocking(doc(db, "claims", handoverItem.claimId), { status: "completed" });
       }

       toast({ title: "Handover Secured", description: "Audit trail successfully logged." });
       setHandoverItem(null); setCapturedUserPhoto(null); setRecipientPhone(""); setRecipientReg("");
    } catch (e) {
       toast({ variant: "destructive", title: "Protocol Error", description: "System could not log handover." });
    }
  }

  const handleConfirmStorage = () => {
    if (!db || !processingLuggage || !rackInput || !slotInput) return
    updateDocumentNonBlocking(doc(db, "clockRoomItems", processingLuggage.id), {
      status: "stored",
      rackNumber: rackInput,
      slotNumber: slotInput,
      storedAt: new Date().toISOString(),
      storedBy: userData?.username || user?.displayName || "Security"
    })
    toast({ title: "Storage Assigned", description: `Item moved to Rack ${rackInput}, Slot ${slotInput}` })
    setProcessingLuggage(null); setRackInput(""); setSlotInput("");
  }

  if (isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      {/* WEB HEADER */}
      <div className="hidden lg:flex gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.push('/dashboard')} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all"><ArrowLeft className="h-8 w-8" /></button>
              <div><h1 className="text-6xl font-headline font-bold">Security Operations</h1><p className="text-xl text-white/70 mt-2">Unified terminal for campus recovery and digital handover protocols</p></div>
           </div>
           <div className="bg-white/20 p-6 rounded-[32px] backdrop-blur-md border border-white/10 flex items-center gap-4">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
              <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Authentication Level</p><p className="text-xl font-bold uppercase">{userData?.role || 'GUARD'}</p></div>
           </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white flex justify-between items-center">
         <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-xl font-headline font-bold">Guard Station</h1>
         </div>
         <ShieldCheck className="h-6 w-6 text-white/40" />
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* VERIFICATION CONSOLE */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl sticky top-32">
              <CardContent className="p-6 lg:p-10 flex flex-col items-center gap-6">
                 <div className="flex w-full items-center justify-between">
                   <div className="flex items-center gap-2"><div className="bg-primary/10 p-3 rounded-2xl"><Key className="h-5 w-5 text-primary" /></div><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verify Token</h2></div>
                   <button onClick={() => toast({ title: "Scanner Coming Soon", description: "Use keypad verification for now." })} className="bg-secondary/10 p-3 rounded-2xl text-secondary hover:bg-secondary/20 transition-all"><Camera className="h-5 w-5" /></button>
                 </div>
                 <div className="w-full flex flex-col gap-4">
                    <Input 
                      placeholder="ENTER CODE" 
                      value={tokenInput} 
                      onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))} 
                      maxLength={4} 
                      className="h-20 rounded-[24px] text-center text-5xl font-mono font-black tracking-[0.4em] bg-muted/30 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
                    />
                    <Button onClick={handleProcessToken} disabled={isProcessingToken || tokenInput.length < 4} className="h-16 rounded-[24px] gradient-header font-bold text-lg shadow-xl shadow-primary/20">
                      {isProcessingToken ? <Loader2 className="animate-spin h-6 w-6" /> : "Verify Identity"}
                    </Button>
                 </div>
                 <div className="bg-primary/5 p-4 rounded-2xl w-full border border-primary/10">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-center leading-relaxed">
                      Verification requires recipient visual capture after token match
                    </p>
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* REGISTRY TERMINAL */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search registry by item, ID, or phone..." 
                className="pl-14 h-14 lg:h-16 rounded-[24px] shadow-xl bg-white dark:bg-card border-none text-sm lg:text-lg" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <Tabs defaultValue="office" className="w-full" onValueChange={setActiveTab}>
              <ScrollArea className="w-full">
                <TabsList className="flex w-fit lg:w-full rounded-[24px] lg:rounded-[32px] p-1 bg-card shadow-xl h-14 lg:h-20 mb-6 border overflow-hidden">
                  <TabsTrigger value="office" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-sm gap-2 h-full"><Archive className="h-4 w-4" /> In-Office</TabsTrigger>
                  <TabsTrigger value="clock" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-sm gap-2 h-full"><Briefcase className="h-4 w-4" /> Clock Room</TabsTrigger>
                  <TabsTrigger value="lost" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-sm gap-2 h-full"><Search className="h-4 w-4" /> Active Lost</TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-sm gap-2 h-full text-destructive"><ShieldAlert className="h-4 w-4" /> Theft Reports</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-xl lg:rounded-2xl font-bold text-[10px] lg:text-sm gap-2 h-full"><HistoryIcon className="h-4 w-4" /> Audit Log</TabsTrigger>
                </TabsList>
              </ScrollArea>

              <TabsContent value="office" className="m-0 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inOfficeFound.length > 0 ? inOfficeFound.map(item => (
                      <Card key={item.id} className="p-4 rounded-[32px] border-none shadow-md bg-white dark:bg-card/50">
                         <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0 shadow-sm"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <div>
                                  <h3 className="font-headline font-bold text-sm truncate">{item.name}</h3>
                                  <p className="text-[10px] text-primary font-bold uppercase mt-0.5">{item.storageOffice}</p>
                                  <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">By: {item.storageInfo}</p>
                               </div>
                               <Badge className="w-fit bg-secondary/10 text-secondary border-none text-[8px] h-4">IN CUSTODY</Badge>
                            </div>
                         </div>
                      </Card>
                    )) : <EmptyState icon={Archive} message="No office inventory matches." />}
                 </div>
              </TabsContent>

              <TabsContent value="clock" className="m-0 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeClock.length > 0 ? activeClock.map(item => (
                      <Card key={item.id} className="p-4 rounded-[32px] border-none shadow-md bg-white dark:bg-card/50 group">
                         <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0"><Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <div>
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-headline font-bold text-sm truncate pr-2">{item.itemType}</h3>
                                    <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: item.color }} />
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{item.studentName}</p>
                                  <p className="text-[9px] text-muted-foreground">ID: {item.registrationNumber}</p>
                               </div>
                               <div className="flex justify-between items-center">
                                  <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4">Rack {item.rackNumber}</Badge>
                                  <span className="text-[7px] font-bold opacity-40">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                               </div>
                            </div>
                         </div>
                      </Card>
                    )) : <EmptyState icon={Briefcase} message="No luggage in storage." />}
                 </div>
              </TabsContent>

              <TabsContent value="lost" className="m-0 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLost.length > 0 ? activeLost.map(item => (
                      <Card key={item.id} className="p-4 rounded-[32px] border-none shadow-md bg-white dark:bg-card/50">
                         <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <div>
                                  <h3 className="font-headline font-bold text-sm truncate">{item.name}</h3>
                                  <div className="flex items-center gap-1.5 mt-1">
                                     <MapPin className="h-3 w-3 text-accent" />
                                     <p className="text-[9px] font-medium text-muted-foreground truncate">{item.locationDescription}</p>
                                  </div>
                               </div>
                               <div className="flex justify-between items-center mt-2">
                                  <Badge className="bg-accent/10 text-accent border-none text-[8px] h-4 uppercase">Searching</Badge>
                                  <span className="text-[7px] font-bold opacity-40">{formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}</span>
                               </div>
                            </div>
                         </div>
                      </Card>
                    )) : <EmptyState icon={Search} message="No active lost reports." />}
                 </div>
              </TabsContent>

              <TabsContent value="reports" className="m-0 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {theftReports?.map(report => (
                      <Card key={report.id} className="p-4 rounded-[32px] border-none shadow-md bg-destructive/5 border border-destructive/10">
                         <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0 border border-destructive/20 shadow-sm"><Image src={report.mediaUrl} alt="Evidence" fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                               <div>
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-destructive" />
                                    <h3 className="font-headline font-bold text-sm truncate uppercase text-destructive">Theft Alert</h3>
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{report.locationName}</p>
                                  <p className="text-[9px] text-muted-foreground italic line-clamp-2 mt-1">"{report.description}"</p>
                               </div>
                               <div className="flex justify-between items-center mt-2">
                                  <Badge className="bg-destructive text-white border-none text-[8px] h-4">{report.status?.toUpperCase()}</Badge>
                                  <span className="text-[7px] font-bold opacity-40">{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                               </div>
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
              </TabsContent>

              <TabsContent value="history" className="m-0 space-y-4">
                 <div className="space-y-3">
                    {recentHandovers.length > 0 ? recentHandovers.map(h => (
                      <Card key={h.id} className="p-6 rounded-[32px] border-none shadow-lg flex items-center gap-6 bg-white dark:bg-card/80">
                         <div className="w-16 h-16 rounded-2xl relative overflow-hidden shrink-0 border shadow-sm"><Image src={h.userPhoto} alt="User" fill className="object-cover" /></div>
                         <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="col-span-1 lg:col-span-1 min-w-0">
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Released Item</p>
                               <h4 className="font-bold text-sm truncate mt-1">{h.itemName}</h4>
                            </div>
                            <div className="hidden lg:block">
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Recipient</p>
                               <p className="text-xs font-bold mt-1">ID: {h.recipientReg}</p>
                            </div>
                            <div className="hidden lg:block">
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Processed By</p>
                               <p className="text-xs font-bold mt-1">{h.guardName}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Timestamp</p>
                               <p className="text-[10px] font-medium mt-1 opacity-60">{h.timestamp ? format(new Date(h.timestamp), 'MMM dd, HH:mm') : 'N/A'}</p>
                            </div>
                         </div>
                      </Card>
                    )) : <EmptyState icon={HistoryIcon} message="No handover history found." />}
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* STORAGE ASSIGNMENT DIALOG */}
      <Dialog open={!!processingLuggage} onOpenChange={() => setProcessingLuggage(null)}>
        <DialogContent className="max-w-[420px] rounded-[40px] p-8 border-none shadow-2xl">
           <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-headline font-bold">Physical Intake</DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-widest text-primary">Assign Storage Rack & Slot</DialogDescription>
           </DialogHeader>
           {processingLuggage && (
             <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-3xl">
                   <div className="w-16 h-16 relative rounded-2xl overflow-hidden shadow-sm"><Image src={processingLuggage.imageUrl} alt="Luggage" fill className="object-cover" /></div>
                   <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{processingLuggage.itemType}</p>
                      <p className="text-[10px] text-muted-foreground">Owner: {processingLuggage.studentName}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2"><Label className="text-[10px] font-bold uppercase ml-1">Rack Number</Label><Input value={rackInput} onChange={(e) => setRackInput(e.target.value)} placeholder="e.g. A-4" className="h-12 rounded-xl bg-muted/20 border-none shadow-none font-bold" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-bold uppercase ml-1">Slot Identifier</Label><Input value={slotInput} onChange={(e) => setSlotInput(e.target.value)} placeholder="e.g. TOP-2" className="h-12 rounded-xl bg-muted/20 border-none shadow-none font-bold" /></div>
                </div>
             </div>
           )}
           <DialogFooter><Button onClick={handleConfirmStorage} disabled={!rackInput || !slotInput} className="w-full h-14 rounded-2xl gradient-header font-bold shadow-xl">Assign to Inventory</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HANDOVER DIALOG */}
      <Dialog open={!!handoverItem} onOpenChange={() => { if(!isCapturingUser) setHandoverItem(null) }}>
        <DialogContent className="max-w-[92%] sm:max-w-[480px] rounded-[40px] p-8 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="text-center">
             <DialogTitle className="text-2xl font-headline font-bold">Secure Delivery</DialogTitle>
             <DialogDescription className="text-xs uppercase font-bold tracking-widest text-secondary">Final Step: Visual & ID Proof</DialogDescription>
          </DialogHeader>
          
          {handoverItem && (
            <div className="space-y-6 py-4">
               <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-3xl">
                  <div className="w-16 h-16 relative rounded-2xl overflow-hidden shadow-sm"><Image src={handoverItem.imageUrl} alt="Item" fill className="object-cover" /></div>
                  <div className="min-w-0">
                     <p className="font-bold text-sm truncate">{handoverItem.name || handoverItem.itemType}</p>
                     <Badge className="bg-secondary/10 text-secondary border-none text-[8px] h-4 mt-1">TOKEN VERIFIED</Badge>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                     <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative border-4 border-muted">
                        {capturedUserPhoto ? (
                          <Image src={capturedUserPhoto} alt="User" fill className="object-cover" />
                        ) : isCapturingUser ? (
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-2">
                             <User className="h-10 w-10" />
                             <p className="text-[10px] font-bold uppercase">Recipient Photo Required</p>
                          </div>
                        )}
                        {capturedUserPhoto && <button onClick={() => setCapturedUserPhoto(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white"><X className="h-4 w-4" /></button>}
                     </div>
                     {!capturedUserPhoto && (
                       <Button onClick={isCapturingUser ? captureUserPhoto : startUserCamera} className="w-full rounded-2xl h-12 bg-secondary text-white font-bold text-xs gap-2 shadow-lg shadow-secondary/20">
                          <Camera className="h-4 w-4" /> {isCapturingUser ? "Snap Identity" : "Launch Evidence Cam"}
                       </Button>
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5"><Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Registration ID</Label><Input value={recipientReg} onChange={(e) => setRecipientReg(e.target.value)} placeholder="12200000" className="h-11 rounded-xl bg-muted/20 border-none text-xs font-bold" /></div>
                     <div className="space-y-1.5"><Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Phone Number</Label><Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+91..." className="h-11 rounded-xl bg-muted/20 border-none text-xs font-bold" /></div>
                  </div>
               </div>
            </div>
          )}

          <DialogFooter>
             <Button onClick={handleFinalizeHandover} disabled={!capturedUserPhoto || !recipientReg || !recipientPhone} className="w-full h-16 rounded-3xl gradient-success font-bold text-lg shadow-xl active:scale-95 transition-transform">Complete Delivery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
  return (
    <div className="text-center py-20 bg-muted/10 rounded-[48px] border-4 border-dashed border-muted-foreground/10 px-6 opacity-30">
      <Icon className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
      <p className="text-lg font-bold text-muted-foreground uppercase tracking-[0.2em]">{message}</p>
    </div>
  )
}
