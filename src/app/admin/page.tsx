"use client"

import { useState, useRef } from "react"
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
  ShoppingBag,
  Building,
  UserCheck,
  Camera,
  Sparkles,
  UploadCloud,
  Trash2,
  Clock,
  Image as ImageIcon,
  Plus,
  Package,
  Briefcase,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Zap,
  Globe,
  User,
  MapPin,
  Mail,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Save,
  QrCode,
  Archive,
  LayoutGrid
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { sendOneSignalNotification } from "@/app/actions/notifications"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [notifTargetId, setNotifTargetId] = useState("")
  const [sendToAll, setSendToAll] = useState(true)
  const [isPushing, setIsPushing] = useState(false)

  const [userSearch, setUserSearch] = useState("")

  const [isUploading, setIsUploading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [isUploadingQR, setIsUploadingQR] = useState(false)
  const [qrFile, setQRFile] = useState<File | null>(null)
  const [qrPreview, setQRPreview] = useState("")
  const qrInputRef = useRef<HTMLInputElement>(null)

  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState("")
  const [bannerLink, setBannerLink] = useState("")
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const itemsQuery = useMemoFirebase(() => query(collection(db, "items")), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => query(collection(db, "users")), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const clockItemsQuery = useMemoFirebase(() => query(collection(db, "clockRoomItems")), [db])
  const { data: clockItems } = useCollection(clockItemsQuery)

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  const bannersQuery = useMemoFirebase(() => 
    query(collection(db, "banners"), orderBy("position", "asc")), [db])
  const { data: banners } = useCollection(bannersQuery)

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return
    if (!sendToAll && !notifTargetId) {
      toast({ variant: "destructive", title: "Missing Target", description: "Provide a User ID for targeted alerts." })
      return
    }

    setIsPushing(true)
    try {
      const result = await sendOneSignalNotification({
        title: notifTitle,
        message: notifMessage,
        targetUserId: sendToAll ? undefined : notifTargetId,
        sendToAll: sendToAll
      })

      if (result.success) {
        toast({ title: "Notification Sent", description: "Successfully pushed via OneSignal." })
        setNotifTitle("")
        setNotifMessage("")
      } else {
        toast({ variant: "destructive", title: "API Configuration Missing", description: result.message })
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Push Failed", description: error.message })
    } finally {
      setIsPushing(false)
    }
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "GUARD" ? "USER" : "GUARD"
    const userRef = doc(db, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: new Date().toISOString() })
    toast({ title: "Role Updated" })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveLogo = async () => {
    if (!logoFile || !db) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      formData.append("upload_preset", "admin_banner_upload")
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Logo upload failed")
      const data = await res.json()
      setDocumentNonBlocking(configRef, { appLogo: data.secure_url, updatedAt: new Date().toISOString() }, { merge: true })
      toast({ title: "Branding Updated", description: "New logo will appear on the login page." })
      setLogoFile(null)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message || "Could not upload logo." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleQRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQRFile(file)
      setQRPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveQR = async () => {
    if (!qrFile || !db) return
    setIsUploadingQR(true)
    try {
      const formData = new FormData()
      formData.append("file", qrFile)
      formData.append("upload_preset", "admin_banner_upload")
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("QR upload failed")
      const data = await res.json()
      setDocumentNonBlocking(configRef, { appDownloadQR: data.secure_url, updatedAt: new Date().toISOString() }, { merge: true })
      toast({ title: "QR Code Updated", description: "Download link is now live on the dashboard." })
      setQRFile(null)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message || "Could not upload QR." })
    } finally {
      setIsUploadingQR(false)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveBanner = async () => {
    if (!bannerFile || !db) return
    setIsUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append("file", bannerFile)
      formData.append("upload_preset", "admin_banner_upload")
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Banner upload failed")
      const data = await res.json()
      const bannerCol = collection(db, "banners")
      addDocumentNonBlocking(bannerCol, { imageUrl: data.secure_url, targetUrl: bannerLink || "", createdAt: new Date().toISOString(), position: banners?.length || 0 })
      toast({ title: "Banner Added", description: "Promotional banner is now live on the dashboard." })
      setBannerFile(null); setBannerPreview(""); setBannerLink("")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Banner Failed", description: error.message || "Could not upload banner." })
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleUpdateBannerLink = (id: string, newLink: string) => {
    if (!db) return
    const bannerRef = doc(db, "banners", id)
    updateDocumentNonBlocking(bannerRef, { targetUrl: newLink })
    toast({ title: "Link Updated" })
  }

  const handleDeleteBanner = (id: string) => {
    const bannerRef = doc(db, "banners", id)
    deleteDocumentNonBlocking(bannerRef)
    toast({ title: "Banner Removed" })
  }

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    if (!banners || !db) return
    const newBanners = [...banners]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= banners.length) return
    const temp = newBanners[index]
    newBanners[index] = newBanners[targetIndex]
    newBanners[targetIndex] = temp
    for (let i = 0; i < newBanners.length; i++) {
      const bRef = doc(db, "banners", newBanners[i].id)
      updateDocumentNonBlocking(bRef, { position: i })
    }
    toast({ title: "Order Updated" })
  }

  const handleShuffleBanners = async () => {
    if (!banners || banners.length < 2 || !db) return
    const shuffled = [...banners].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i++) {
      const bRef = doc(db, "banners", shuffled[i].id)
      updateDocumentNonBlocking(bRef, { position: i })
    }
    toast({ title: "Banners Shuffled" })
  }

  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.registrationNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.region?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost' && i.status !== 'Archived').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found' && i.status !== 'Archived').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Luggage", value: clockItems?.filter(l => l.status !== 'archived').length.toString() || "0", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-2xl font-headline font-bold">Admin Console</h1>
          </div>
          <Settings className="h-5 w-5" />
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
                <h1 className="text-6xl font-headline font-bold">Campus Control Center</h1>
                <p className="text-xl text-white/70 mt-2">Manage users, branding assets, promotional banners, and high-level campus statistics</p>
              </div>
           </div>
           <div className="bg-white/20 p-8 rounded-[40px] shadow-2xl border border-white/10"><LayoutGrid className="h-12 w-12 text-white" /></div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 rounded-[24px] lg:rounded-[32px] p-1 bg-card shadow-xl h-auto md:h-14 lg:h-16 mb-10 max-w-5xl mx-auto border overflow-hidden">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[8px] lg:text-sm uppercase">Statistics</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[8px] lg:text-sm uppercase">User Base</TabsTrigger>
            <TabsTrigger value="push" className="rounded-xl font-bold text-[8px] lg:text-sm uppercase text-primary">Push Alerts</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl font-bold text-[8px] lg:text-sm uppercase">Branding</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold text-[8px] lg:text-sm uppercase">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 lg:space-y-12 m-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-xl rounded-[32px] overflow-hidden group hover:translate-y-[-8px] transition-all">
                  <CardContent className="p-6 lg:p-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] lg:text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-2xl lg:text-5xl font-headline font-bold mt-2">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-6 w-6 lg:h-10 lg:w-10 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="push" className="m-0">
            <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden max-w-3xl mx-auto bg-card/80 backdrop-blur-xl">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="font-headline font-bold text-3xl flex items-center gap-4">
                  <Zap className="h-10 w-10 text-primary" /> OneSignal Broadcaster
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <form onSubmit={handleSendPushNotification} className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-muted/30 rounded-3xl border border-dashed">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        {sendToAll ? <Globe className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                        {sendToAll ? "Broadcast to All Users" : "Target Specific Device"}
                      </Label>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {sendToAll ? "Everyone with the app will be notified" : "Enter a specific Firebase UID"}
                      </p>
                    </div>
                    <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
                  </div>
                  {!sendToAll && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-2">Recipient User ID</Label>
                      <Input placeholder="e.g. gHZ9n7s2b9X8..." className="rounded-2xl h-14 bg-muted/20 border-none px-6" value={notifTargetId} onChange={(e) => setNotifTargetId(e.target.value)} required={!sendToAll} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-2">Alert Headline</Label>
                    <Input placeholder="e.g. New Auction Live!" className="rounded-2xl h-14" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-2">Message Payload</Label>
                    <Input placeholder="e.g. Check out the latest items in the shop..." className="rounded-2xl h-14" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={isPushing} className="w-full h-16 rounded-3xl gradient-header font-bold text-lg shadow-2xl flex items-center justify-center gap-3 mt-6">
                    {isPushing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />} Deploy Instant Broadcast
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-8 m-0 pb-24">
            <div className="relative max-w-4xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search students by name, registration ID, email or phone..." className="pl-12 h-16 rounded-3xl shadow-xl bg-white border-none text-base" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-xl rounded-[40px] p-8 bg-card/80 backdrop-blur-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 border border-white/10 relative overflow-hidden">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <Avatar className="h-16 w-16 lg:h-20 lg:w-16 border-2 border-primary/20 shadow-md">
                            <AvatarImage src={u.photoURL} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{u.username?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {u.role === 'ADMIN' && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg lg:text-xl font-headline font-bold truncate leading-tight">{u.username}</h3>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1 font-medium italic"><Mail className="h-3 w-3" /> {u.email}</p>
                        </div>
                      </div>
                      <Badge className={`${u.role === 'ADMIN' ? 'bg-primary' : u.role === 'GUARD' ? 'bg-secondary' : 'bg-muted text-muted-foreground'} text-[9px] font-bold tracking-widest px-3 h-6`}>{u.role}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 bg-muted/20 p-5 rounded-3xl border border-dashed border-primary/10">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase font-bold text-muted-foreground">Registration ID</p>
                          <p className="text-xs font-bold truncate">{u.registrationNumber || "NOT SET"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase font-bold text-muted-foreground">Phone Number</p>
                          <p className="text-xs font-bold truncate">{u.phoneNumber || "NOT SET"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase font-bold text-muted-foreground">Resident Area</p>
                          <p className="text-xs font-bold truncate">{u.region || "NOT SELECTED"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-dashed">
                    <Button variant="outline" size="sm" onClick={() => { setNotifTargetId(u.id); setSendToAll(false); const el = document.querySelector('[value="push"]'); if (el instanceof HTMLElement) el.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-2xl text-[10px] font-bold h-12 border-primary/20 hover:bg-primary hover:text-white transition-all"><Zap className="h-4 w-4 mr-2" /> Push Alert</Button>
                    {u.role !== 'ADMIN' && (
                      <Button variant="secondary" size="sm" onClick={() => handleToggleRole(u.id, u.role)} className="rounded-2xl text-[10px] font-bold h-12 shadow-sm">
                        {u.role === 'GUARD' ? "Demote Guard" : "Make Guard"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="branding" className="m-0 space-y-10 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
              <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-card/80 backdrop-blur-xl">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="font-headline font-bold text-3xl flex items-center gap-4">
                    <Sparkles className="h-10 w-10 text-primary" /> App Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10 text-center">
                  <div className="relative group mx-auto">
                    <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-[48px] gradient-header shadow-2xl flex items-center justify-center text-white overflow-hidden border-8 border-white/20">
                      {logoPreview || systemConfig?.appLogo ? (
                        <Image src={logoPreview || systemConfig?.appLogo} alt="Logo" fill className="object-cover" />
                      ) : (
                        <Sparkles className="h-24 w-24" />
                      )}
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-4 -right-4 bg-white text-primary p-5 rounded-[24px] shadow-2xl border border-primary/10 hover:scale-110 transition-all">
                      <Camera className="h-8 w-8" />
                    </button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </div>
                  <Button onClick={handleSaveLogo} disabled={!logoFile || isUploading} className="w-full h-16 rounded-3xl gradient-header font-bold text-lg shadow-2xl">
                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Update Global Logo"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-card/80 backdrop-blur-xl">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="font-headline font-bold text-3xl flex items-center gap-4">
                    <QrCode className="h-10 w-10 text-secondary" /> Download QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10 text-center">
                  <div className="relative group mx-auto">
                    <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-[48px] bg-muted shadow-2xl flex items-center justify-center text-muted-foreground overflow-hidden border-8 border-white/20">
                      {qrPreview || systemConfig?.appDownloadQR ? (
                        <Image src={qrPreview || systemConfig?.appDownloadQR} alt="QR" fill className="object-contain p-8" />
                      ) : (
                        <QrCode className="h-24 w-24 opacity-20" />
                      )}
                    </div>
                    <button onClick={() => qrInputRef.current?.click()} className="absolute -bottom-4 -right-4 bg-white text-secondary p-5 rounded-[24px] shadow-2xl border border-secondary/10 hover:scale-110 transition-all">
                      <Camera className="h-8 w-8" />
                    </button>
                    <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={handleQRChange} />
                  </div>
                  <Button onClick={handleSaveQR} variant="secondary" disabled={!qrFile || isUploadingQR} className="w-full h-16 rounded-3xl font-bold text-lg shadow-2xl">
                    {isUploadingQR ? <Loader2 className="h-6 w-6 animate-spin" /> : "Update App QR"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banners" className="m-0 space-y-10 pb-24">
            <Card className="border-none shadow-2xl rounded-[64px] overflow-hidden bg-card/80 backdrop-blur-xl max-w-6xl mx-auto">
              <CardHeader className="p-10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <CardTitle className="font-headline font-bold text-3xl flex items-center gap-4">
                  <ImageIcon className="h-10 w-10 text-primary" /> Campaign Manager
                </CardTitle>
                <Button onClick={handleShuffleBanners} variant="outline" className="rounded-[20px] font-bold text-xs uppercase gap-3 h-14 border-primary/20 hover:bg-primary/5 px-8 shadow-sm">
                  <Shuffle className="h-4 w-4" /> Randomize Position
                </Button>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div onClick={() => bannerInputRef.current?.click()} className="relative w-full aspect-[21/9] rounded-[48px] border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-all overflow-hidden">
                  {bannerPreview ? (
                    <Image src={bannerPreview} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-primary/10 p-6 rounded-[32px] inline-block shadow-lg">
                        <Plus className="h-12 w-12 text-primary" />
                      </div>
                      <p className="text-sm font-black uppercase text-primary tracking-widest">Upload Campaign Visual</p>
                    </div>
                  )}
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                </div>
                {bannerFile && (
                  <div className="space-y-4 bg-muted/40 p-8 rounded-[32px] border border-dashed border-primary/20 animate-in slide-in-from-top-4">
                    <Label className="text-xs font-bold uppercase text-muted-foreground ml-2">Destination URL (Internal or External)</Label>
                    <div className="flex gap-4">
                      <Input placeholder="e.g. /shop or https://external-promo.com" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} className="rounded-2xl h-14 bg-white shadow-none text-base" />
                      <Button onClick={handleSaveBanner} disabled={isUploadingBanner} className="h-14 rounded-2xl gradient-header font-bold px-10 shadow-2xl">
                        {isUploadingBanner ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deploy Now"}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {banners?.map((banner, index) => (
                    <Card key={banner.id} className="relative overflow-hidden group shadow-2xl border-4 border-transparent hover:border-primary/20 transition-all rounded-[40px]">
                      <div className="relative aspect-[16/9] w-full">
                        <Image src={banner.imageUrl} alt="Campaign" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <Button variant="outline" size="icon" onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0} className="rounded-full h-14 w-14 bg-white/90 shadow-2xl">
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner(banner.id)} className="rounded-full h-16 w-16 shadow-2xl">
                            <Trash2 className="h-8 w-8" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleMoveBanner(index, 'down')} disabled={index === (banners?.length || 0) - 1} className="rounded-full h-14 w-14 bg-white/90 shadow-2xl">
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-6 bg-white/50 backdrop-blur-md border-t border-dashed">
                        <div className="flex gap-3 items-center">
                          <Input placeholder="Redirect Target" defaultValue={banner.targetUrl || ""} onBlur={(e) => handleUpdateBannerLink(banner.id, e.target.value)} className="h-10 text-xs rounded-xl bg-white/80 shadow-none" />
                          <Badge variant="outline" className="h-10 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary shadow-sm">
                            <ExternalLink className="h-4 w-4" />
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
