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
  Megaphone
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { format } from "date-fns"
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
  const [viewingUser, setViewingUser] = useState<any | null>(null)

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
      toast({ title: "Logo Updated" }); setLogoFile(null); setLogoPreview("")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logo update failed", description: error.message })
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
      toast({ title: "QR Updated" }); setQRFile(null); setQRPreview("")
    } catch (error: any) {
      toast({ variant: "destructive", title: "QR update failed", description: error.message })
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
    } catch (error: any) {
      toast({ variant: "destructive", title: "Banner deployment failed", description: error.message })
    } finally { setIsUploadingBanner(false) }
  }

  const handleDeleteBanner = (bannerId: string) => {
    if (!db) return
    deleteDocumentNonBlocking(doc(db, "banners", bannerId))
    toast({ title: "Banner Removed" })
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
                       <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-xs leading-tight line-clamp-1">{report.locationName || "No Location"}</h3>
                            <p className="text-[8px] text-muted-foreground mt-0.5">
                              {report.timestamp ? format(new Date(report.timestamp), 'MMM dd, HH:mm') : "Recent"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[7px] h-4 px-1.5">{report.itemType === 'clock' ? 'CLOCK' : 'LOST'}</Badge>
                       </div>
                       <p className="text-[10px] text-muted-foreground italic line-clamp-2 leading-relaxed">"{report.description || "No description provided."}"</p>
                       <div className="flex gap-2 pt-1">
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'verified')} disabled={report.status !== 'pending'} className="flex-1 rounded-lg h-8 bg-secondary text-[9px] font-bold">Verify & Reward</Button>
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'rejected')} disabled={report.status !== 'pending'} variant="outline" className="flex-1 rounded-lg h-8 text-[9px] font-bold border-destructive text-destructive">Reject</Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
                {(!theftReports || theftReports.length === 0) && <div className="col-span-full py-20 text-center opacity-30"><ShieldAlert className="h-12 w-12 mx-auto mb-4" /><p className="font-bold uppercase tracking-widest">No theft reports active</p></div>}
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-primary/10 text-primary text-[8px] font-bold">{u.points || 0} pts</Badge>
                          <Badge variant="outline" className="text-[8px]">{u.role || "USER"}</Badge>
                        </div>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => setViewingUser(u)} className="shrink-0"><Settings className="h-4 w-4" /></Button>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="push" className="m-0">
            <Card className="max-w-2xl mx-auto rounded-[48px] p-10 space-y-8">
              <div className="text-center space-y-2">
                 <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto"><Bell className="h-8 w-8 text-primary" /></div>
                 <h2 className="text-2xl font-headline font-bold">Broadcast Push Alert</h2>
                 <p className="text-sm text-muted-foreground">Instantly notify all users or a specific student via OneSignal</p>
              </div>
              <form onSubmit={handleSendPushNotification} className="space-y-6">
                 <div className="space-y-2">
                   <Label className="text-xs font-bold">Notification Title</Label>
                   <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Item Found!" className="rounded-xl h-12" required />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-bold">Message Body</Label>
                   <Input value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="A wallet was found in Block 34..." className="rounded-xl h-12" required />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div className="space-y-0.5">
                       <p className="text-xs font-bold">Broadcast to Everyone</p>
                       <p className="text-[10px] text-muted-foreground">Toggle off to target a specific User ID</p>
                    </div>
                    <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
                 </div>
                 {!sendToAll && (
                   <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                     <Label className="text-xs font-bold">Target User ID</Label>
                     <Input value={notifTargetId} onChange={(e) => setNotifTargetId(e.target.value)} placeholder="Paste Firebase UID here" className="rounded-xl h-12" />
                   </div>
                 )}
                 <Button type="submit" disabled={isPushing} className="w-full h-14 rounded-2xl font-bold gradient-header shadow-xl">
                    {isPushing ? <Loader2 className="animate-spin" /> : <><Send className="h-5 w-5 mr-2" /> Send via OneSignal</>}
                 </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="m-0 grid grid-cols-2 gap-10">
             <Card className="rounded-[48px] p-10 text-center space-y-6">
                <CardTitle className="flex items-center gap-3 justify-center"><Sparkles className="h-6 w-6 text-primary" /> App Logo</CardTitle>
                <div className="w-48 h-48 mx-auto rounded-[32px] gradient-header flex items-center justify-center overflow-hidden relative">
                  {logoPreview || systemConfig?.appLogo ? <Image src={logoPreview || systemConfig?.appLogo} alt="Logo" fill className="object-cover" /> : <Sparkles className="h-12 w-12 text-white" />}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
                <div className="flex gap-4">
                  <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="flex-1 rounded-2xl h-12">Choose</Button>
                  <Button onClick={handleSaveLogo} disabled={!logoFile || isUploading} className="flex-1 rounded-2xl h-12 gradient-header">{isUploading ? <Loader2 className="animate-spin" /> : "Save"}</Button>
                </div>
             </Card>

             <Card className="rounded-[48px] p-10 text-center space-y-6">
                <CardTitle className="flex items-center gap-3 justify-center"><QrCode className="h-6 w-6 text-primary" /> Download QR</CardTitle>
                <div className="w-48 h-48 mx-auto rounded-[32px] bg-muted flex items-center justify-center overflow-hidden relative">
                   {qrPreview || systemConfig?.appDownloadQR ? <Image src={qrPreview || systemConfig?.appDownloadQR} alt="QR" fill className="object-cover" /> : <QrCode className="h-12 w-12 opacity-20" />}
                </div>
                <input type="file" ref={qrInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ setQRFile(f); setQRPreview(URL.createObjectURL(f)) } }} />
                <div className="flex gap-4">
                  <Button onClick={() => qrInputRef.current?.click()} variant="outline" className="flex-1 rounded-2xl h-12">Choose</Button>
                  <Button onClick={handleSaveQR} disabled={!qrFile || isUploadingQR} className="flex-1 rounded-2xl h-12 gradient-header">{isUploadingQR ? <Loader2 className="animate-spin" /> : "Save"}</Button>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="banners" className="m-0 space-y-10">
             <div className="grid grid-cols-12 gap-10">
                <div className="col-span-4">
                   <Card className="rounded-[40px] p-10 space-y-6 bg-card border-none shadow-xl sticky top-10">
                      <h2 className="text-xl font-headline font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Create Campaign</h2>
                      <div className="space-y-4">
                         <div 
                           onClick={() => bannerInputRef.current?.click()}
                           className="aspect-video w-full rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-all overflow-hidden relative"
                         >
                            {bannerPreview ? <Image src={bannerPreview} alt="Preview" fill className="object-cover" /> : (
                              <>
                                <ImageIcon className="h-8 w-8 text-primary/40" />
                                <p className="text-[10px] font-bold uppercase mt-2">1200 x 600 suggested</p>
                              </>
                            )}
                         </div>
                         <input type="file" ref={bannerInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ setBannerFile(f); setBannerPreview(URL.createObjectURL(f)) } }} />
                         
                         <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target URL (Optional)</Label>
                            <Input value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} placeholder="https://..." className="rounded-xl h-12" />
                         </div>

                         <Button onClick={handleSaveBanner} disabled={!bannerFile || isUploadingBanner} className="w-full h-14 rounded-2xl gradient-header font-bold shadow-xl">
                            {isUploadingBanner ? <Loader2 className="animate-spin" /> : "Deploy Banner"}
                         </Button>
                      </div>
                   </Card>
                </div>

                <div className="col-span-8">
                   <div className="grid grid-cols-1 gap-6">
                      {banners?.map((banner) => (
                        <Card key={banner.id} className="rounded-[32px] overflow-hidden border-none shadow-lg bg-card/80 flex items-center group">
                           <div className="w-64 aspect-video relative overflow-hidden shrink-0">
                              <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
                           </div>
                           <div className="flex-1 p-8 flex items-center justify-between">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Target Link</p>
                                 <p className="text-sm font-bold truncate max-w-[300px]">{banner.targetUrl || "None"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteBanner(banner.id)} className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-6 w-6" />
                                 </Button>
                                 <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="h-6 w-6" />
                                 </div>
                              </div>
                           </div>
                        </Card>
                      ))}
                      {(!banners || banners.length === 0) && (
                        <div className="py-20 text-center opacity-30 bg-muted/10 rounded-[40px] border-4 border-dashed">
                           <Megaphone className="h-12 w-12 mx-auto mb-4" />
                           <p className="font-bold uppercase tracking-widest">No Active Campaigns</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">User Registry Details</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Verification & Identity Audit</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-8 pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-xl">
                  <AvatarImage src={viewingUser.photoURL} />
                  <AvatarFallback className="bg-primary text-white text-3xl font-bold">{viewingUser.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold leading-tight">{viewingUser.username || "Anonymous"}</h3>
                  <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  <Badge className="mt-2 bg-primary/10 text-primary border-none font-bold uppercase text-[9px] tracking-widest px-2 h-5">{viewingUser.role || "USER"}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Registration ID</p>
                  <p className="text-sm font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> {viewingUser.registrationNumber || "Unverified"}</p>
                </div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phone Number</p>
                  <p className="text-sm font-bold flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {viewingUser.phoneNumber || "No Data"}</p>
                </div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reward Ledger</p>
                  <p className="text-sm font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> {viewingUser.points || 0} pts</p>
                </div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Last Active</p>
                  <p className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 
                    {viewingUser.updatedAt ? format(new Date(viewingUser.updatedAt), 'MMM dd') : "N/A"}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-dashed">
                <Button 
                  onClick={() => { handleToggleRole(viewingUser.id, viewingUser.role || "USER"); setViewingUser(null); }} 
                  className="w-full h-14 rounded-2xl font-bold gradient-header shadow-xl"
                  variant={viewingUser.role === 'GUARD' ? 'outline' : 'default'}
                >
                  Promote to {viewingUser.role === 'GUARD' ? 'REGULAR STUDENT' : 'CAMPUS GUARD'}
                </Button>
                <p className="text-[9px] text-center text-muted-foreground mt-4 italic">Security Note: Role changes are logged and impact system-wide permissions instantly.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
