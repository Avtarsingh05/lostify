
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Bell,
  Send,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Clock,
  Image as ImageIcon,
  Plus,
  Package,
  Phone,
  CreditCard,
  ChevronRight,
  User,
  ShieldCheck,
  Smartphone,
  Save,
  QrCode,
  ShieldAlert,
  Trophy,
  Megaphone,
  ShoppingBag,
  DollarSign,
  Zap,
  LayoutGrid,
  History,
  Archive,
  UploadCloud,
  Globe,
  Briefcase
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc,
  useUser
} from "@/firebase"
import { collection, query, orderBy, doc, increment, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { format } from "date-fns"
import { sendOneSignalNotification } from "@/app/actions/notifications"
import { compressImage } from "@/lib/image-utils"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [userSearch, setUserSearch] = useState("")
  const [historySearch, setHistorySearch] = useState("")
  const [viewingUser, setViewingUser] = useState<any | null>(null)

  // System Config State
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingQR, setIsUploadingQR] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  // Banner State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerLink, setBannerLink] = useState("")
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Push State
  const [pushTitle, setPushTitle] = useState("")
  const [pushMessage, setPushMessage] = useState("")
  const [pushTargetId, setPushTargetId] = useState("")
  const [isSendingPush, setIsSendingPush] = useState(false)

  // Shop State
  const [shopName, setShopName] = useState("")
  const [shopPrice, setShopPrice] = useState("")
  const [shopDesc, setShopDesc] = useState("")
  const [shopCurrency, setShopCurrency] = useState("INR")
  const [shopImage, setShopImage] = useState<string | null>(null)
  const [isAddingShop, setIsAddingShop] = useState(false)
  const shopInputRef = useRef<HTMLInputElement>(null)

  // Data Fetching
  const itemsQuery = useMemoFirebase(() => query(collection(db, "items")), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => query(collection(db, "users")), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const theftReportsQuery = useMemoFirebase(() => query(collection(db, "theftReports"), orderBy("timestamp", "desc")), [db])
  const { data: theftReports } = useCollection(theftReportsQuery)

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  const bannersQuery = useMemoFirebase(() => query(collection(db, "banners"), orderBy("position", "asc")), [db])
  const { data: allBanners } = useCollection(bannersQuery)

  const shopQuery = useMemoFirebase(() => query(collection(db, "shopItems"), orderBy("createdAt", "desc")), [db])
  const { data: shopItems } = useCollection(shopQuery)

  const historyQuery = useMemoFirebase(() => 
    query(collection(db, "handoverHistory"), orderBy("timestamp", "desc")), [db])
  const { data: handoverHistory } = useCollection(historyQuery)

  // Actions: Theft
  const handleVerifyTheft = async (reportId: string, reporterId: string, status: 'verified' | 'rejected') => {
    if (!db) return
    const reportRef = doc(db, "theftReports", reportId)
    const reporterRef = doc(db, "users", reporterId)

    if (status === 'verified') {
      updateDocumentNonBlocking(reportRef, { status: "verified", rewardGiven: true })
      updateDocumentNonBlocking(reporterRef, { points: increment(100) })
      toast({ title: "Verified", description: "Reporter rewarded with 100 points." })
    } else {
      updateDocumentNonBlocking(reportRef, { status: "rejected" })
      toast({ variant: "destructive", title: "Report Rejected" })
    }
  }

  // Actions: Roles
  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "GUARD" ? "USER" : "GUARD"
    const userRef = doc(db, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: new Date().toISOString() })
    toast({ title: "Role Updated" })
  }

  // Actions: Branding
  const handleImageUpload = async (file: File, type: 'logo' | 'qr' | 'banner' | 'shop') => {
    const reader = new FileReader()
    const compressed = await new Promise<string>((resolve) => {
      reader.onload = async (e) => resolve(await compressImage(e.target?.result as string))
      reader.readAsDataURL(file)
    })

    const formData = new FormData()
    formData.append("file", compressed)
    formData.append("upload_preset", "admin_banner_upload")
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
    if (!res.ok) throw new Error("Upload failed")
    return (await res.json()).secure_url
  }

  const handleSaveLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db) return
    setIsUploadingLogo(true)
    try {
      const url = await handleImageUpload(file, 'logo')
      updateDocumentNonBlocking(configRef, { appLogo: url })
      toast({ title: "Logo Updated" })
    } finally { setIsUploadingLogo(false) }
  }

  const handleSaveQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db) return
    setIsUploadingQR(true)
    try {
      const url = await handleImageUpload(file, 'qr')
      updateDocumentNonBlocking(configRef, { downloadQR: url })
      toast({ title: "QR Code Updated" })
    } finally { setIsUploadingQR(false) }
  }

  // Actions: Banners
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db) return
    setIsUploadingBanner(true)
    try {
      const url = await handleImageUpload(file, 'banner')
      addDocumentNonBlocking(collection(db, "banners"), {
        imageUrl: url,
        targetUrl: bannerLink,
        position: (allBanners?.length || 0) + 1,
        createdAt: new Date().toISOString()
      })
      setBannerLink("")
      toast({ title: "Banner Live" })
    } finally { setIsUploadingBanner(false) }
  }

  // Actions: Shop
  const handleAddShopItem = async () => {
    if (!shopImage || !shopName || !shopPrice || !db) return
    setIsAddingShop(true)
    try {
      addDocumentNonBlocking(collection(db, "shopItems"), {
        name: shopName,
        price: Number(shopPrice),
        description: shopDesc,
        paymentType: shopCurrency,
        imageUrl: shopImage,
        createdAt: new Date().toISOString()
      })
      setShopName(""); setShopPrice(""); setShopDesc(""); setShopImage(null)
      toast({ title: "Inventory Updated" })
    } finally { setIsAddingShop(false) }
  }

  // Actions: Push
  const handleSendPush = async (all: boolean) => {
    if (!pushTitle || !pushMessage) return
    setIsSendingPush(true)
    try {
      await sendOneSignalNotification({
        title: pushTitle,
        message: pushMessage,
        targetUserId: all ? undefined : pushTargetId,
        sendToAll: all
      })
      setPushTitle(""); setPushMessage(""); setPushTargetId("")
      toast({ title: "Notification Dispatched" })
    } catch (e) {
      toast({ variant: "destructive", title: "Push Failed" })
    } finally { setIsSendingPush(false) }
  }

  // Filters
  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.registrationNumber?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredHistory = handoverHistory?.filter(h => 
    h.itemName?.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.recipientReg?.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.recipientPhone?.toLowerCase().includes(historySearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost' && i.status !== 'Delivered').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found' && i.status !== 'Delivered').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Handed Over", value: handoverHistory?.length.toString() || "0", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Lostify Command</h1>
                <p className="text-xl text-white/70 mt-2">Central terminal for campus security & marketplace oversight</p>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-10 -mt-24 space-y-12">
        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="flex w-fit rounded-[32px] p-1 bg-card shadow-xl h-16 mb-10 border overflow-hidden">
              <TabsTrigger value="overview" className="rounded-xl font-bold uppercase text-[10px] px-6">Overview</TabsTrigger>
              <TabsTrigger value="theft" className="rounded-xl font-bold uppercase text-[10px] px-6 text-destructive">Theft Reports</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl font-bold uppercase text-[10px] px-6">Inventory</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-bold uppercase text-[10px] px-6">Students</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-bold uppercase text-[10px] px-6">Audit Log</TabsTrigger>
              <TabsTrigger value="campaign" className="rounded-xl font-bold uppercase text-[10px] px-6">Campaign</TabsTrigger>
              <TabsTrigger value="push" className="rounded-xl font-bold uppercase text-[10px] px-6">Push</TabsTrigger>
              <TabsTrigger value="branding" className="rounded-xl font-bold uppercase text-[10px] px-6">Branding</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="overview" className="m-0">
            <div className="grid grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-xl rounded-[32px] overflow-hidden group hover:translate-y-[-4px] transition-all">
                  <CardContent className="p-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-4xl font-headline font-bold mt-2">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="theft" className="m-0 space-y-6">
             <div className="grid grid-cols-3 gap-6">
                {theftReports?.map(report => (
                  <Card key={report.id} className="border-none shadow-xl rounded-[24px] overflow-hidden bg-card/80 backdrop-blur-sm">
                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                      {report.mediaUrl && <Image src={report.mediaUrl} alt="Proof" fill className="object-cover" />}
                      <div className="absolute top-3 left-3">
                        <Badge className={`${report.status === 'pending' ? 'bg-orange-500' : report.status === 'verified' ? 'bg-secondary' : 'bg-destructive'} border-none font-bold text-[8px] h-5`}>
                           {report.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                       <h3 className="font-bold text-xs leading-tight">{report.locationName || "No Location"}</h3>
                       <p className="text-[10px] text-muted-foreground italic line-clamp-2">"{report.description}"</p>
                       <div className="flex gap-2">
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'verified')} disabled={report.status !== 'pending'} className="flex-1 rounded-lg h-8 bg-secondary text-[9px] font-bold">Verify & Reward</Button>
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'rejected')} disabled={report.status !== 'pending'} variant="outline" className="flex-1 rounded-lg h-8 text-[9px] font-bold">Reject</Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="inventory" className="m-0 space-y-10">
             <Card className="rounded-[40px] border-none shadow-xl p-10 space-y-8">
                <div className="flex items-center gap-3"><ShoppingBag className="h-6 w-6 text-primary" /><h2 className="text-xl font-headline font-bold">Add New Gear</h2></div>
                <div className="grid grid-cols-12 gap-8">
                   <div className="col-span-4 space-y-4">
                      <div 
                        onClick={() => shopInputRef.current?.click()}
                        className="aspect-square rounded-[32px] border-4 border-dashed border-muted-foreground/10 bg-muted/5 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/10 transition-all overflow-hidden relative"
                      >
                         {shopImage ? <Image src={shopImage} alt="Preview" fill className="object-cover" /> : <div className="text-center"><ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" /><p className="text-[10px] font-bold uppercase">Product Photo</p></div>}
                         <input type="file" ref={shopInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (file) setShopImage(await handleImageUpload(file, 'shop'))
                         }} />
                      </div>
                   </div>
                   <div className="col-span-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Item Name</Label><Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="rounded-xl h-14" /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Currency & Price</Label><div className="flex gap-2"><Select value={shopCurrency} onValueChange={setShopCurrency}><SelectTrigger className="w-32 h-14 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="POINTS">POINTS (PTS)</SelectItem></SelectContent></Select><Input value={shopPrice} onChange={(e) => setShopPrice(e.target.value)} type="number" className="rounded-xl h-14 flex-1" placeholder="0" /></div></div>
                      </div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Description</Label><Textarea value={shopDesc} onChange={(e) => setShopDesc(e.target.value)} className="rounded-xl min-h-[100px]" /></div>
                      <Button onClick={handleAddShopItem} disabled={isAddingShop || !shopName || !shopPrice || !shopImage} className="w-full h-16 rounded-[24px] gradient-header font-bold text-lg shadow-xl">{isAddingShop ? <Loader2 className="animate-spin" /> : "Deploy to Shop"}</Button>
                   </div>
                </div>
             </Card>
             <div className="grid grid-cols-4 gap-6">
                {shopItems?.map(item => (
                  <Card key={item.id} className="rounded-3xl border-none shadow-lg overflow-hidden group">
                     <div className="aspect-[4/3] relative"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /><div className="absolute top-3 left-3"><Badge className={`${item.paymentType === 'POINTS' ? 'bg-accent' : 'bg-primary'} border-none font-bold text-[8px]`}>{item.paymentType === 'POINTS' ? `${item.price} PTS` : `₹${item.price}`}</Badge></div></div>
                     <CardContent className="p-4 flex items-center justify-between">
                        <p className="font-bold text-xs truncate mr-2">{item.name}</p>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, "shopItems", item.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 m-0">
             <div className="relative max-w-2xl mx-auto">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input placeholder="Search students..." className="pl-12 h-14 rounded-2xl shadow-lg border-none" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
             </div>
             <div className="grid grid-cols-3 gap-6">
                {filteredUsers?.map(u => (
                  <Card key={u.id} className="p-6 rounded-[32px] border-none shadow-lg flex items-center gap-4">
                     <Avatar className="h-12 w-12"><AvatarImage src={u.photoURL} /><AvatarFallback className="bg-primary/10 text-primary font-bold">{u.username?.charAt(0)}</AvatarFallback></Avatar>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{u.username || "Anonymous"}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => setViewingUser(u)} className="shrink-0"><Settings className="h-4 w-4" /></Button>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 m-0">
             <div className="relative max-w-2xl mx-auto">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input placeholder="Search items, student IDs, or phones..." className="pl-12 h-14 rounded-2xl shadow-lg border-none" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
             </div>
             <div className="grid grid-cols-1 gap-4">
                {filteredHistory?.map(h => (
                  <Card key={h.id} className="p-6 rounded-[32px] border-none shadow-lg flex items-center gap-8 bg-card/80 overflow-hidden relative">
                     <div className={`absolute top-0 right-0 w-2 h-full ${h.itemSource === 'CLOCK_ROOM' ? 'bg-orange-500' : 'bg-primary'}`} />
                     <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0 shadow-md"><Image src={h.userPhoto} alt="Recipient" fill className="object-cover" /></div>
                     <div className="flex-1 grid grid-cols-3 gap-8">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Released Item</p>
                           <h3 className="font-headline font-bold text-lg mt-1">{h.itemName}</h3>
                           <Badge variant="outline" className={`mt-2 h-5 text-[8px] font-bold border-none ${h.itemSource === 'CLOCK_ROOM' ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                             {h.itemSource === 'CLOCK_ROOM' ? 'LUGGAGE RETRIEVAL' : 'ITEM RECOVERY'}
                           </Badge>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipient Registry</p>
                           <p className="text-sm font-bold mt-1">ID: {h.recipientReg}</p>
                           <p className="text-xs text-muted-foreground mt-1">{h.recipientPhone}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Auth Protocol</p>
                           <p className="text-sm font-bold mt-1 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary" /> {h.guardName}</p>
                           <p className="text-xs text-muted-foreground mt-1">{format(new Date(h.timestamp), 'MMM dd, HH:mm')}</p>
                        </div>
                     </div>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="campaign" className="m-0 space-y-10">
             <Card className="rounded-[40px] border-none shadow-xl p-10 space-y-8">
                <div className="flex items-center gap-3"><Megaphone className="h-6 w-6 text-primary" /><h2 className="text-xl font-headline font-bold">New Promotion</h2></div>
                <div className="grid grid-cols-12 gap-10">
                   <div className="col-span-5 space-y-4">
                      <div 
                        onClick={() => bannerInputRef.current?.click()}
                        className="aspect-video rounded-[32px] border-4 border-dashed border-muted-foreground/10 bg-muted/5 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/10 transition-all relative overflow-hidden"
                      >
                         <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
                         <p className="text-[10px] font-bold uppercase text-muted-foreground">Select Banner (16:9)</p>
                         <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                         {isUploadingBanner && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                   </div>
                   <div className="col-span-7 space-y-6">
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Destination Link (Optional)</Label><Input placeholder="https://..." value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} className="rounded-xl h-14" /></div>
                      <p className="text-11px] text-muted-foreground italic">Banners are displayed on the student dashboard. Upload an image to publish instantly.</p>
                   </div>
                </div>
             </Card>
             <div className="grid grid-cols-2 gap-8">
                {allBanners?.map(banner => (
                  <Card key={banner.id} className="rounded-[32px] overflow-hidden border-none shadow-xl relative group">
                     <div className="aspect-video relative"><Image src={banner.imageUrl} alt="Banner" fill className="object-cover" /></div>
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button onClick={() => deleteDocumentNonBlocking(doc(db, "banners", banner.id))} variant="destructive" className="rounded-2xl h-14 px-8 font-bold"><Trash2 className="mr-2" /> Remove</Button>
                     </div>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="push" className="m-0">
             <Card className="rounded-[40px] border-none shadow-xl p-10 max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-primary/10 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-primary"><Bell className="h-8 w-8" /></div>
                   <h2 className="text-3xl font-headline font-bold">Campus Dispatch</h2>
                   <p className="text-muted-foreground">Broadcast high-priority alerts via OneSignal</p>
                </div>
                <div className="space-y-6 pt-4">
                   <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Heading</Label><Input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} className="rounded-xl h-14 text-lg font-bold" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Alert Message</Label><Textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} className="rounded-xl min-h-[120px]" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Specific User ID (Leave blank for all)</Label><Input value={pushTargetId} onChange={(e) => setPushTargetId(e.target.value)} className="rounded-xl h-12 font-mono text-xs" /></div>
                   <div className="grid grid-cols-2 gap-4 pt-4">
                      <Button onClick={() => handleSendPush(false)} disabled={isSendingPush || !pushTargetId} variant="outline" className="h-16 rounded-2xl font-bold border-2"><User className="mr-2 h-5 w-5" /> Target ID</Button>
                      <Button onClick={() => handleSendPush(true)} disabled={isSendingPush} className="h-16 rounded-2xl font-bold gradient-header shadow-xl shadow-primary/20"><Megaphone className="mr-2 h-5 w-5" /> All Students</Button>
                   </div>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="branding" className="m-0">
             <div className="grid grid-cols-2 gap-10">
                <Card className="rounded-[40px] border-none shadow-xl p-10 space-y-8">
                   <div className="flex items-center gap-3"><ImageIcon className="h-6 w-6 text-primary" /><h2 className="text-xl font-headline font-bold">App Identity</h2></div>
                   <div className="flex items-center gap-8">
                      <div className="w-32 h-32 rounded-[32px] bg-muted relative overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
                         {systemConfig?.appLogo ? <Image src={systemConfig.appLogo} alt="Logo" fill className="object-contain p-2" /> : <Sparkles className="h-10 w-10 text-muted-foreground/30" />}
                         {isUploadingLogo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                      <div className="flex-1 space-y-4">
                         <p className="text-xs text-muted-foreground leading-relaxed font-medium">Upload your university or app logo. Transparent PNG recommended.</p>
                         <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="w-full h-12 rounded-xl">Replace Logo</Button>
                         <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleSaveLogo} />
                      </div>
                   </div>
                </Card>
                <Card className="rounded-[40px] border-none shadow-xl p-10 space-y-8">
                   <div className="flex items-center gap-3"><QrCode className="h-6 w-6 text-primary" /><h2 className="text-xl font-headline font-bold">Onboarding</h2></div>
                   <div className="flex items-center gap-8">
                      <div className="w-32 h-32 rounded-[32px] bg-white relative overflow-hidden flex items-center justify-center border-4 border-muted/5 shadow-xl">
                         {systemConfig?.downloadQR ? <Image src={systemConfig.downloadQR} alt="QR" fill className="object-contain p-2" /> : <div className="h-8 w-8 bg-muted rounded-full" />}
                         {isUploadingQR && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                      <div className="flex-1 space-y-4">
                         <p className="text-xs text-muted-foreground leading-relaxed font-medium">Update the app download QR code visible on the login screen.</p>
                         <Button onClick={() => qrInputRef.current?.click()} variant="outline" className="w-full h-12 rounded-xl">Update QR</Button>
                         <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={handleSaveQR} />
                      </div>
                   </div>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-lg">
          <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Student Identity Audit</DialogTitle></DialogHeader>
          {viewingUser && (
            <div className="space-y-8 pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/10"><AvatarImage src={viewingUser.photoURL} /><AvatarFallback className="bg-primary text-white text-3xl font-bold">{viewingUser.username?.charAt(0)}</AvatarFallback></Avatar>
                <div><h3 className="text-2xl font-bold leading-tight">{viewingUser.username || "Anonymous"}</h3><Badge className="mt-2 bg-primary/10 text-primary border-none font-bold uppercase text-[9px] h-5">{viewingUser.role || "USER"}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Registry ID</p><p className="text-sm font-bold">{viewingUser.registrationNumber || "Unverified"}</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p><p className="text-sm font-bold">{viewingUser.phoneNumber || "No Data"}</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Reward Ledger</p><p className="text-sm font-bold">{viewingUser.points || 0} pts</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Last Active</p><p className="text-sm font-bold">{viewingUser.updatedAt ? format(new Date(viewingUser.updatedAt), 'MMM dd') : "N/A"}</p></div>
              </div>
              <div className="pt-6 border-t border-dashed">
                <Button onClick={() => { handleToggleRole(viewingUser.id, viewingUser.role || "USER"); setViewingUser(null); }} className="w-full h-14 rounded-2xl font-bold gradient-header shadow-xl">Promote to {viewingUser.role === 'GUARD' ? 'STUDENT' : 'GUARD'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
