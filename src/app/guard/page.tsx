
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
  History,
  AlertTriangle,
  QrCode,
  Smartphone,
  Calendar,
  Briefcase,
  ChevronRight,
  Package
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { collection, query, doc, orderBy, limit, where } from "firebase/firestore"
import Image from "next/image"
import { isBefore, subDays, format } from "date-fns"
import { QRCodeSVG } from "qrcode.react"

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

  const [handoverSession, setHandoverSession] = useState<any | null>(null)
  const [isHandoverLoading, setIsHandoverLoading] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  // Master Authority Identifiers
  const adminEmails = useMemo(() => ["worker@gmail.com", "forigloohelp@gmail.com", "avtarsingh9528972330@gmail.com"], []);
  const adminUIDs = useMemo(() => ["PX8zNjMWBWTFGYnaYWrtxojquD02", "9Qv4QkTuukaYhr2sggnQmQmqgHu1"], []);

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const isMaster = adminEmails.includes(user.email?.toLowerCase() || "") || adminUIDs.includes(user.uid);
    const hasRole = userData?.role === "ADMIN" || userData?.role === "GUARD";
    return isMaster || hasRole;
  }, [user, userData, adminEmails, adminUIDs]);

  // General Items Query
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(
      collection(db, "items"),
      orderBy("reportedAt", "desc"),
      limit(100)
    )
  }, [db, isAuthorized])

  const { data: allItems, isLoading } = useCollection(itemsQuery)

  // Clock Room Items Query
  const clockRoomQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null
    return query(
      collection(db, "clockRoomItems"),
      where("status", "==", "stored"),
      orderBy("createdAt", "desc")
    )
  }, [db, isAuthorized])

  const { data: clockItems, isLoading: isClockLoading } = useCollection(clockRoomQuery)

  const thirtyDaysAgo = subDays(new Date(), 30)

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
      verifiedBy: user?.displayName || user?.email?.split('@')[0] || "Guard",
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
      resolvedBy: user?.displayName || user?.email?.split('@')[0] || "Guard",
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

  // --- NEW: CLOCK ROOM PICKUP FLOW ---
  const handleInitiateClockHandover = async (item: any) => {
    if (!db || !user) return
    setIsHandoverLoading(true)
    toast({ title: "Verification started", description: "Generating secure session..." })

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString()
    const handoverData = {
      itemId: item.id,
      userId: item.userId,
      guardId: user.uid,
      guardName: user.displayName || user.email?.split('@')[0] || "Guard",
      verificationCode,
      status: "pending",
      type: "clock_room",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }

    const colRef = collection(db, "clockRoomHandovers");
    addDocumentNonBlocking(colRef, handoverData).then((docRef) => {
       setHandoverSession({ ...handoverData, id: docRef?.id || "session_pending" });
       setIsHandoverLoading(false)
    });
  }

  const handleInitiateHandover = async (item: any) => {
    if (!db || !user) return
    setIsHandoverLoading(true)

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString()
    const handoverData = {
      itemId: item.id,
      itemName: item.name,
      itemImageUrl: item.imageUrl,
      guardId: user.uid,
      guardName: user.displayName || user.email?.split('@')[0] || "Guard",
      verificationCode,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }

    const colRef = collection(db, "handovers");
    addDocumentNonBlocking(colRef, handoverData).then((docRef) => {
       setHandoverSession({ ...handoverData, id: docRef?.id || "session_pending" });
       setIsHandoverLoading(false)
    });
  }

  const filterItems = (list: any[]) => {
    return list.filter(item => 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.locationDescription?.toLowerCase().includes(search.toLowerCase()) ||
      item.itemType?.toLowerCase().includes(search.toLowerCase())
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

  if (!isAuthorized && !isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-headline font-bold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">This panel is restricted to authorized campus personnel only.</p>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
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
        <div className="grid grid-cols-4 gap-2 lg:gap-8">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Reports</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-secondary">{pendingFound.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Office</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-primary">{inOfficeFound.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Lost</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-accent">{activeLost.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-8 text-center">
              <p className="text-[8px] lg:text-xs font-bold text-muted-foreground uppercase tracking-wider">Storage</p>
              <h3 className="text-xl lg:text-4xl font-headline font-bold mt-1 text-orange-500">{clockItems?.length || 0}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="relative group max-w-2xl mx-auto lg:max-w-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search all reports & storage..." 
            className="pl-10 h-14 rounded-2xl shadow-lg border-none bg-white dark:bg-card/80 backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 border overflow-x-auto max-w-2xl mx-auto lg:max-w-none">
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="office" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <Archive className="h-3 w-3 lg:h-4 lg:w-4" /> Office
            </TabsTrigger>
            <TabsTrigger value="lost" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <AlertCircle className="h-3 w-3 lg:h-4 lg:w-4" /> Lost
            </TabsTrigger>
            <TabsTrigger value="clock" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase tracking-widest gap-1">
              <Briefcase className="h-3 w-3 lg:h-4 lg:w-4" /> Clock Room
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
                              Pending
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
                            Log to Office
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} message="No reports pending." />
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
                        <div className="flex items-center gap-2 mt-3 justify-end">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleInitiateHandover(item)}
                            disabled={isHandoverLoading}
                            className="h-8 lg:h-10 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-bold shadow-md flex items-center gap-1.5"
                          >
                            <QrCode className="h-3 w-3" /> Secure Handover
                          </Button>
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

          {/* --- NEW: CLOCK ROOM TAB --- */}
          <TabsContent value="clock" className="space-y-4">
             {isClockLoading ? (
               <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin h-8 w-8" /></div>
             ) : filterItems(clockItems || []).length > 0 ? (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                 {filterItems(clockItems || []).map((item) => (
                   <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/90 backdrop-blur-sm border border-orange-500/10">
                     <div className="flex p-4 lg:p-6 gap-4 lg:gap-8">
                       <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl overflow-hidden relative shadow-md bg-muted shrink-0">
                         <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-between">
                         <div>
                           <div className="flex justify-between items-start">
                             <h3 className="font-headline font-bold text-sm lg:text-lg truncate pr-2">{item.itemType}</h3>
                             <Badge className="bg-orange-500 text-[8px] lg:text-[10px] h-4 lg:h-5">STORED</Badge>
                           </div>
                           <p className="text-[10px] lg:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                             <MapPin className="h-3 w-3 text-orange-500" /> Rack {item.rackNumber}, Slot {item.slotNumber}
                           </p>
                           <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                             <Clock className="h-2.5 w-2.5" /> Stored {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                           </p>
                         </div>
                         <div className="flex items-center justify-end mt-3">
                           <Button 
                             size="sm" 
                             onClick={() => handleInitiateClockHandover(item)}
                             disabled={isHandoverLoading}
                             className="h-8 lg:h-10 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-bold bg-orange-500 hover:bg-orange-600 active:scale-95 transition-transform gap-2"
                           >
                             <QrCode className="h-3.5 w-3.5" /> Verify Pickup
                           </Button>
                         </div>
                       </div>
                     </div>
                   </Card>
                 ))}
               </div>
             ) : (
               <EmptyState icon={Package} message="Clock room is empty." />
             )}
          </TabsContent>
        </Tabs>
      </main>

      {/* --- HANDOVER MODAL (SHARED) --- */}
      <Dialog open={!!handoverSession} onOpenChange={() => setHandoverSession(null)}>
        <DialogContent className="max-w-[420px] rounded-[48px] p-8 bg-card border-none shadow-2xl">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="font-headline font-bold text-2xl">Verify Handover</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Scan QR or use manual code
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-8 py-4">
            <div className="bg-white p-6 rounded-[40px] shadow-inner shadow-black/5 border-2 border-dashed border-primary/20">
              <QRCodeSVG 
                value={handoverSession ? `${window.location.origin}/handover/${handoverSession.id}${handoverSession.type === 'clock_room' ? '?type=clock' : ''}` : ""} 
                size={200}
                includeMargin
              />
            </div>

            <div className="text-center space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Verification Code</p>
              <div className="bg-primary/10 px-8 py-4 rounded-3xl border border-primary/20">
                <span className="text-5xl font-headline font-black text-primary tracking-[0.2em]">
                  {handoverSession?.verificationCode}
                </span>
              </div>
            </div>

            <div className="bg-secondary/10 p-4 rounded-2xl flex items-center gap-3 w-full border border-secondary/20">
              <Smartphone className="h-5 w-5 text-secondary" />
              <p className="text-[10px] font-bold text-secondary-foreground leading-tight">
                Student should open Lostify on their phone and scan this QR or enter the 4-digit code.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setHandoverSession(null)}
              variant="outline"
              className="w-full h-14 rounded-2xl font-bold text-xs"
            >
              Close Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
