
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

  // Handover Logic
  const [handoverItem, setHandoverItem] = useState<any | null>(null)
  const [isCapturingUser, setIsCapturingUser] = useState(false)
  const [capturedUserPhoto, setCapturedUserPhoto] = useState<string | null>(null)
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientReg, setRecipientReg] = useState("")

  const [processingLuggage, setProcessingLuggage] = useState<any | null>(null)
  const [viewingClockItem, setViewingClockItem] = useState<any | null>(null)
  
  const [storageLocation, setStorageLocation] = useState("")
  const [rackInput, setRackInput] = useState("")
  const [slotInput, setSlotInput] = useState("")

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const handoversQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(collection(db, "handoverHistory"), orderBy("timestamp", "desc"), limit(20))
  }, [db, isAuthorized])

  const { data: rawItems, isLoading: isItemsLoading } = useCollection(itemsQuery)
  const { data: rawClockItems, isLoading: isClockLoading } = useCollection(clockItemsQuery)
  const { data: recentHandovers } = useCollection(handoversQuery)

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

  const inOfficeFound = useMemo(() => allItems?.filter(i => i.type === 'found' && i.status === 'In Custody') || [], [allItems])

  const startUserCamera = async () => {
    setIsCapturingUser(true)
    setTimeout(async () => {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
         if (videoRef.current) videoRef.current.srcObject = stream;
       } catch (err) {
         toast({ variant: "destructive", title: "Camera Error" })
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

  const handleProcessToken = async () => {
    const code = tokenInput;
    if (!code || code.length < 4 || !db) return
    setIsProcessingToken(true)

    try {
      // 1. Check Claims first (Lost & Found)
      const qClaim = query(collection(db, "claims"), where("claimCode", "==", code), where("status", "==", "approved"), limit(1))
      const snapClaim = await getDocs(qClaim)
      if (!snapClaim.empty) {
         const claim = snapClaim.docs[0].data();
         const itemRef = doc(db, "items", claim.itemId);
         const itemSnap = await getDocs(query(collection(db, "items"), where("__name__", "==", claim.itemId)));
         if (!itemSnap.empty) {
            setHandoverItem({ ...itemSnap.docs[0].data(), id: claim.itemId, claimId: snapClaim.docs[0].id })
            setTokenInput("")
            return
         }
      }

      // 2. Check Clock Room
      const qCheckIn = query(collection(db, "clockRoomItems"), where("checkInCode", "==", code), where("status", "==", "pending_storage"), limit(1))
      const snapIn = await getDocs(qCheckIn)
      if (!snapIn.empty) {
        setProcessingLuggage({ ...snapIn.docs[0].data(), id: snapIn.docs[0].id })
        setTokenInput("")
        return
      }

      const qCheckOut = query(collection(db, "clockRoomItems"), where("checkOutCode", "==", code), where("status", "==", "stored"), limit(1))
      const snapOut = await getDocs(qCheckOut)
      if (!snapOut.empty) {
         const itemData = { ...snapOut.docs[0].data(), id: snapOut.docs[0].id };
         setHandoverItem({ ...itemData, isClock: true });
         setTokenInput("")
         return
      }

      toast({ variant: "destructive", title: "Access Denied", description: "No matching token found." })
    } finally {
      setIsProcessingToken(false)
    }
  }

  const handleFinalizeHandover = async () => {
    if (!db || !handoverItem || !capturedUserPhoto || !recipientPhone || !recipientReg) {
      toast({ variant: "destructive", title: "Missing Proof", description: "Photo and ID details mandatory." });
      return
    }

    const historyRef = collection(db, "handoverHistory");
    const auditData = {
       itemId: handoverItem.id,
       itemName: handoverItem.name || handoverItem.itemType,
       itemImageUrl: handoverItem.imageUrl,
       recipientPhone,
       recipientReg,
       userPhoto: capturedUserPhoto,
       guardId: user?.uid,
       guardName: userData?.username || user?.displayName || "Guard",
       timestamp: new Date().toISOString(),
       status: "Delivered"
    }

    try {
       await addDocumentNonBlocking(historyRef, auditData);
       
       if (handoverItem.isClock) {
         updateDocumentNonBlocking(doc(db, "clockRoomItems", handoverItem.id), { status: "collected", collectedAt: new Date().toISOString() });
       } else {
         updateDocumentNonBlocking(doc(db, "items", handoverItem.id), { status: "Delivered", deliveredAt: new Date().toISOString() });
         updateDocumentNonBlocking(doc(db, "claims", handoverItem.claimId), { status: "completed" });
       }

       toast({ title: "Handover Success", description: "Audit trail secured." });
       setHandoverItem(null); setCapturedUserPhoto(null); setRecipientPhone(""); setRecipientReg("");
    } catch (e) {
       toast({ variant: "destructive", title: "System Error" });
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

  if (isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="hidden lg:flex gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all"><ArrowLeft className="h-8 w-8" /></button>
              <div><h1 className="text-6xl font-headline font-bold">Campus Security Portal</h1><p className="text-xl text-white/70 mt-2">Professional Digital Handover & Storage Management</p></div>
           </div>
           <div className="bg-white/20 p-6 rounded-[32px] backdrop-blur-md border border-white/10 flex items-center gap-4"><ShieldCheck className="h-10 w-10" /><div><p className="text-xs font-bold uppercase tracking-widest opacity-60">Verified Access</p><p className="text-xl font-bold">{userData?.role || 'GUARD'}</p></div></div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl">
              <CardContent className="p-6 lg:p-10 flex flex-col items-center gap-6">
                 <div className="flex w-full items-center justify-between">
                   <div className="flex items-center gap-2"><div className="bg-primary/10 p-3 rounded-2xl"><Key className="h-5 w-5 text-primary" /></div><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification</h2></div>
                   <button onClick={() => setIsScannerOpen(true)} className="bg-secondary/10 p-3 rounded-2xl text-secondary hover:bg-secondary/20 transition-all"><Camera className="h-5 w-5" /></button>
                 </div>
                 <div className="w-full flex flex-col gap-4">
                    <Input placeholder="CLAIM CODE" value={tokenInput} onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))} maxLength={4} className="h-20 rounded-[24px] text-center text-5xl font-mono font-black tracking-[0.4em] bg-muted/30 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" />
                    <Button onClick={handleProcessToken} disabled={isProcessingToken || tokenInput.length < 4} className="h-16 rounded-[24px] gradient-header font-bold text-lg shadow-xl shadow-primary/20">{isProcessingToken ? <Loader2 className="animate-spin h-6 w-6" /> : "Verify Identity"}</Button>
                 </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-lg p-8 space-y-6">
               <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Handovers</h3>
               <div className="space-y-4">
                  {recentHandovers?.map(h => (
                    <div key={h.id} className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full relative overflow-hidden border shadow-sm"><Image src={h.userPhoto} alt="User" fill className="object-cover" /></div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{h.itemName}</p>
                          <p className="text-[9px] text-muted-foreground">{format(new Date(h.timestamp), 'MMM dd, HH:mm')}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Search records..." className="pl-12 h-14 rounded-[24px] shadow-xl bg-white border-none text-sm" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            </div>

            <Tabs defaultValue="office" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-[24px] p-1 bg-card shadow-xl h-14 lg:h-16 mb-6 border overflow-hidden">
                <TabsTrigger value="office" className="rounded-xl font-bold text-xs gap-2"><Archive className="h-4 w-4" /> In Office</TabsTrigger>
                <TabsTrigger value="clock" className="rounded-xl font-bold text-xs gap-2"><Briefcase className="h-4 w-4" /> Clock Room</TabsTrigger>
              </TabsList>

              <TabsContent value="office" className="space-y-4 m-0">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inOfficeFound.map(item => (
                      <Card key={item.id} className="p-4 rounded-[32px] border-none shadow-md bg-card">
                         <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-2xl relative overflow-hidden shrink-0"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0">
                               <h3 className="font-headline font-bold text-sm truncate">{item.name}</h3>
                               <p className="text-[10px] text-primary font-bold uppercase mt-1">{item.storageOffice}</p>
                               <div className="mt-2 space-y-1">
                                  {item.verificationQuestions?.map((q: any, i: number) => (
                                    <p key={i} className="text-[8px] text-muted-foreground flex gap-1"><span className="font-bold">Q{i+1}:</span> {q.question}</p>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
              </TabsContent>

              <TabsContent value="clock" className="space-y-4 m-0">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clockItems.map(item => (
                      <Card key={item.id} className="p-4 rounded-[32px] border-none shadow-md bg-card">
                         <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-2xl relative overflow-hidden shrink-0"><Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" /></div>
                            <div className="flex-1 min-w-0">
                               <h3 className="font-headline font-bold text-sm truncate">{item.itemType}</h3>
                               <p className="text-[10px] text-muted-foreground">{item.studentName}</p>
                               <Badge className="mt-2 bg-primary/10 text-primary text-[8px] h-4">Rack {item.rackNumber}</Badge>
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Handover Dialog */}
      <Dialog open={!!handoverItem} onOpenChange={() => setHandoverItem(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-[480px] rounded-[40px] p-8 border-none shadow-2xl">
          <DialogHeader className="text-center">
             <DialogTitle className="text-2xl font-headline font-bold">Verification Handover</DialogTitle>
             <DialogDescription className="text-xs uppercase font-bold tracking-widest text-primary">Protocol Phase 2: Evidence Collection</DialogDescription>
          </DialogHeader>
          
          {handoverItem && (
            <div className="space-y-6 py-4">
               <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-3xl">
                  <div className="w-16 h-16 relative rounded-2xl overflow-hidden shadow-sm"><Image src={handoverItem.imageUrl} alt="Item" fill className="object-cover" /></div>
                  <div className="min-w-0">
                     <p className="font-bold text-sm truncate">{handoverItem.name || handoverItem.itemType}</p>
                     <p className="text-[10px] text-muted-foreground">Original Reporter: {handoverItem.studentName || handoverItem.ownerId.substring(0, 8)}</p>
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
                             <p className="text-[10px] font-bold uppercase">Recipient Visual Required</p>
                          </div>
                        )}
                        {capturedUserPhoto && <button onClick={() => setCapturedUserPhoto(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white"><X className="h-4 w-4" /></button>}
                     </div>
                     {!capturedUserPhoto && (
                       <Button onClick={isCapturingUser ? captureUserPhoto : startUserCamera} className="w-full rounded-2xl h-12 gradient-header font-bold text-xs gap-2">
                          <Camera className="h-4 w-4" /> {isCapturingUser ? "Snap Identity" : "Open Evidence Cam"}
                       </Button>
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5"><Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Registration ID</Label><Input value={recipientReg} onChange={(e) => setRecipientReg(e.target.value)} placeholder="e.g. 12200000" className="h-11 rounded-xl bg-muted/20 border-none text-xs" /></div>
                     <div className="space-y-1.5"><Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Phone Number</Label><Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+91..." className="h-11 rounded-xl bg-muted/20 border-none text-xs" /></div>
                  </div>
               </div>
            </div>
          )}

          <DialogFooter>
             <Button onClick={handleFinalizeHandover} disabled={!capturedUserPhoto || !recipientReg || !recipientPhone} className="w-full h-16 rounded-3xl gradient-header font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform">Verify & Deliver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
