
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
  LayoutGrid,
  ShieldAlert,
  Trophy
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
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { formatDistanceToNow, format } from "date-fns"
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

  const theftReportsQuery = useMemoFirebase(() => query(collection(db, "theftReports"), orderBy("timestamp", "desc")), [db])
  const { data: theftReports } = useCollection(theftReportsQuery)

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  const bannersQuery = useMemoFirebase(() => 
    query(collection(db, "banners"), orderBy("position", "asc")), [db])
  const { data: banners } = useCollection(bannersQuery)

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

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return
    if (!sendToAll && !notifTargetId) {
      toast({ variant: "destructive", title: "Missing Target", description: "Provide a User ID." })
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
        toast({ title: "Sent via OneSignal" });
        setNotifTitle(""); setNotifMessage("");
      } else {
        toast({ variant: "destructive", title: "Config Error", description: result.message })
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message })
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

  const handleSaveLogo = async () => {
    if (!logoFile || !db) return
    setIsUploading(true)
    try {
      const formData = new FormData(); formData.append("file", logoFile); formData.append("upload_preset", "admin_banner_upload");
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setDocumentNonBlocking(configRef, { appLogo: data.secure_url, updatedAt: new Date().toISOString() }, { merge: true })
      toast({ title: "Logo Updated" }); setLogoFile(null)
    } finally { setIsUploading(false) }
  }

  const handleSaveQR = async () => {
    if (!qrFile || !db) return
    setIsUploadingQR(true)
    try {
      const formData = new FormData(); formData.append("file", qrFile); formData.append("upload_preset", "admin_banner_upload");
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setDocumentNonBlocking(configRef, { appDownloadQR: data.secure_url, updatedAt: new Date().toISOString() }, { merge: true })
      toast({ title: "QR Updated" }); setQRFile(null)
    } finally { setIsUploadingQR(false) }
  }

  const handleSaveBanner = async () => {
    if (!bannerFile || !db) return
    setIsUploadingBanner(true)
    try {
      const formData = new FormData(); formData.append("file", bannerFile); formData.append("upload_preset", "admin_banner_upload");
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      addDocumentNonBlocking(collection(db, "banners"), { imageUrl: data.secure_url, targetUrl: bannerLink || "", createdAt: new Date().toISOString(), position: banners?.length || 0 })
      toast({ title: "Banner Live" }); setBannerFile(null); setBannerPreview(""); setBannerLink("")
    } finally { setIsUploadingBanner(false) }
  }

  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.registrationNumber?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost' && i.status !== 'Archived').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found' && i.status !== 'Archived').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Theft Alerts", value: theftReports?.filter(r => r.status === 'pending').length.toString() || "0", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" },
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
                <h1 className="text-6xl font-headline font-bold">Campus Control</h1>
                <p className="text-xl text-white/70 mt-2">Manage users, alerts, and system visuals</p>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-10 -mt-24 space-y-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 rounded-[32px] p-1 bg-card shadow-xl h-16 mb-10 border overflow-hidden">
            <TabsTrigger value="overview" className="rounded-xl font-bold uppercase text-xs">Stats</TabsTrigger>
            <TabsTrigger value="theft" className="rounded-xl font-bold uppercase text-xs text-destructive">Theft Alerts</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold uppercase text-xs">Users</TabsTrigger>
            <TabsTrigger value="push" className="rounded-xl font-bold uppercase text-xs">Push</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl font-bold uppercase text-xs">Branding</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold uppercase text-xs">Campaigns</TabsTrigger>
          </TabsList>

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
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theftReports?.map(report => (
                  <Card key={report.id} className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-sm">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <Image src={report.mediaUrl} alt="Proof" fill className="object-cover" />
                      <div className="absolute top-4 left-4">
                        <Badge className={`${report.status === 'pending' ? 'bg-orange-500' : report.status === 'verified' ? 'bg-secondary' : 'bg-destructive'} border-none font-bold`}>
                           {report.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-sm leading-tight">{report.locationName}</h3>
                            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(report.timestamp), 'MMM dd, HH:mm')}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px]">{report.itemType === 'clock' ? 'CLOCK ROOM' : 'LOST ITEM'}</Badge>
                       </div>
                       <p className="text-xs text-muted-foreground italic line-clamp-3">"{report.description}"</p>
                       <div className="flex gap-2 pt-2">
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'verified')} disabled={report.status !== 'pending'} className="flex-1 rounded-xl h-10 bg-secondary text-[10px] font-bold">Verify & Reward</Button>
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'rejected')} disabled={report.status !== 'pending'} variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-bold border-destructive text-destructive">Reject</Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
                {theftReports?.length === 0 && <div className="col-span-full py-20 text-center opacity-30"><ShieldAlert className="h-12 w-12 mx-auto mb-4" /><p className="font-bold uppercase tracking-widest">No theft reports active</p></div>}
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
                     <Avatar className="h-12 w-12"><AvatarImage src={u.photoURL} /><AvatarFallback>{u.username?.charAt(0)}</AvatarFallback></Avatar>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{u.username}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-primary/10 text-primary text-[8px] font-bold">{u.points || 0} pts</Badge>
                          <Badge variant="outline" className="text-[8px]">{u.role}</Badge>
                        </div>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => handleToggleRole(u.id, u.role)} className="shrink-0"><Settings className="h-4 w-4" /></Button>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="branding" className="m-0 grid grid-cols-2 gap-10">
             <Card className="rounded-[48px] p-10 text-center space-y-6">
                <CardTitle className="flex items-center gap-3 justify-center"><Sparkles className="h-6 w-6 text-primary" /> App Logo</CardTitle>
                <div className="w-48 h-48 mx-auto rounded-[32px] gradient-header flex items-center justify-center overflow-hidden">
                  {logoPreview || systemConfig?.appLogo ? <Image src={logoPreview || systemConfig?.appLogo} alt="Logo" width={192} height={192} className="object-cover" /> : <Sparkles className="h-12 w-12 text-white" />}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
                <div className="flex gap-4">
                  <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="flex-1 rounded-2xl h-12">Choose</Button>
                  <Button onClick={handleSaveLogo} disabled={!logoFile || isUploading} className="flex-1 rounded-2xl h-12 gradient-header">{isUploading ? <Loader2 className="animate-spin" /> : "Save"}</Button>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
