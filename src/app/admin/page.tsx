
"use client"

import { useState, useRef, useMemo } from "react"
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
  Save
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
  
  // Notification State
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [notifTargetId, setNotifTargetId] = useState("")
  const [sendToAll, setSendToAll] = useState(true)
  const [isPushing, setIsPushing] = useState(false)

  const [userSearch, setUserSearch] = useState("")
  const [itemSearch, setItemSearch] = useState("")
  const [luggageSearch, setLuggageSearch] = useState("")

  // Logo Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Banner Management State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState("")
  const [bannerLink, setBannerLink] = useState("")
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const itemsQuery = useMemoFirebase(() => query(collection(db, "items"), orderBy("reportedAt", "desc")), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, "users"), orderBy("updatedAt", "desc")), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const clockItemsQuery = useMemoFirebase(() => 
    query(collection(db, "clockRoomItems"), orderBy("createdAt", "desc")), [db])
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

  const handleDeleteItem = (id: string) => {
    const itemRef = doc(db, "items", id)
    deleteDocumentNonBlocking(itemRef)
    toast({ title: "Item Record Deleted" })
  }

  const handleDeleteLuggage = (id: string) => {
    const luggageRef = doc(db, "clockRoomItems", id)
    deleteDocumentNonBlocking(luggageRef)
    toast({ title: "Luggage Record Removed" })
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
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Logo upload failed")
      const data = await res.json()
      
      setDocumentNonBlocking(configRef, {
        appLogo: data.secure_url,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      toast({
        title: "Branding Updated",
        description: "New logo will appear on the login page.",
      })
      setLogoFile(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload logo.",
      })
    } finally {
      setIsUploading(false)
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
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Banner upload failed")
      const data = await res.json()
      
      const bannerCol = collection(db, "banners")
      addDocumentNonBlocking(bannerCol, {
        imageUrl: data.secure_url,
        targetUrl: bannerLink || "",
        createdAt: new Date().toISOString(),
        position: banners?.length || 0
      })

      toast({
        title: "Banner Added",
        description: "Promotional banner is now live on the dashboard.",
      })
      setBannerFile(null)
      setBannerPreview("")
      setBannerLink("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Banner Failed",
        description: error.message || "Could not upload banner.",
      })
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

  const filteredItems = allItems?.filter(i => 
    i.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.claimerRegNo?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.reporterRegNo?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.storageOffice?.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const filteredLuggage = clockItems?.filter(l => 
    l.studentName?.toLowerCase().includes(luggageSearch.toLowerCase()) ||
    l.registrationNumber?.toLowerCase().includes(luggageSearch.toLowerCase()) ||
    l.itemType?.toLowerCase().includes(luggageSearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Luggage", value: clockItems?.length.toString() || "0", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl lg:text-4xl font-headline font-bold">Admin Console</h1>
          </div>
          <Settings className="h-5 w-5 lg:h-8 lg:w-8" />
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-10 space-y-6 lg:space-y-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 rounded-2xl p-1 bg-card shadow-lg h-auto md:h-12 mb-6 max-w-4xl mx-auto lg:max-w-none gap-1">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Stats</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Users</TabsTrigger>
            <TabsTrigger value="push" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase text-primary">Push Alerts</TabsTrigger>
            <TabsTrigger value="luggage" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Luggage</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Branding</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Banners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 lg:space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden">
                  <CardContent className="p-4 lg:p-8 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] lg:text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-lg lg:text-3xl font-headline font-bold">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-2 lg:p-4 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 lg:h-8 lg:w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="push" className="space-y-6">
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden max-w-2xl mx-auto">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary" /> OneSignal Push Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleSendPushNotification} className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed">
                    <div className="space-y-0.5">
                       <Label className="text-sm font-bold flex items-center gap-2">
                         {sendToAll ? <Globe className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
                         {sendToAll ? "Broadcast to All Segments" : "Target Single Device"}
                       </Label>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                         {sendToAll ? "Everyone with the app will be notified" : "Enter a specific Firebase UID"}
                       </p>
                    </div>
                    <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
                  </div>

                  {!sendToAll && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Recipient User ID</Label>
                      <Input 
                        placeholder="e.g. gHZ9n7s2b9X8..." 
                        className="rounded-xl h-12 bg-muted/20 border-none shadow-none"
                        value={notifTargetId}
                        onChange={(e) => setNotifTargetId(e.target.value)}
                        required={!sendToAll}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Headline</Label>
                    <Input 
                      placeholder="e.g. New Auction Live!" 
                      className="rounded-xl h-12"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Message Content</Label>
                    <Input 
                      placeholder="e.g. Check out the latest items in the shop..." 
                      className="rounded-xl h-12"
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      required 
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isPushing}
                    className="w-full h-14 rounded-2xl gradient-header font-bold text-sm shadow-xl flex items-center justify-center gap-2 mt-4"
                  >
                    {isPushing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    Deploy Instant Alert
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="luggage" className="space-y-4 lg:space-y-8">
            <div className="relative max-w-2xl mx-auto lg:max-w-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search luggage..." className="pl-9 h-12 rounded-2xl" value={luggageSearch} onChange={(e) => setLuggageSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              {filteredLuggage?.map((lug) => (
                <Card key={lug.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden relative shadow-sm shrink-0">
                      <Image src={lug.imageUrl} alt={lug.itemType} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm truncate">{lug.itemType}</h4>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLuggage(lug.id)} className="h-7 w-7 text-destructive rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase truncate">{lug.studentName}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[8px] h-4">{lug.status.replace('_', ' ')}</Badge>
                        <Badge className="bg-primary/10 text-primary text-[8px] h-4 border-none">Rack {lug.rackNumber}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 lg:space-y-12">
            <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm max-w-2xl mx-auto">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" /> Login Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-[40px] gradient-header shadow-2xl flex items-center justify-center text-white overflow-hidden border-4 border-white/20">
                      {logoPreview || systemConfig?.appLogo ? (
                        <Image src={logoPreview || systemConfig?.appLogo} alt="App Logo" fill className="object-cover" />
                      ) : (
                        <Sparkles className="h-16 w-16 lg:h-24 lg:w-24" />
                      )}
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-white text-primary p-3 rounded-2xl shadow-xl border border-primary/10 hover:scale-110 transition-all"><Camera className="h-6 w-6" /></button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
                <Button onClick={handleSaveLogo} disabled={!logoFile || isUploading} className="w-full h-14 rounded-2xl gradient-header font-bold shadow-xl">
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update University Logo"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6 lg:space-y-12">
            <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm max-w-4xl mx-auto">
              <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                  <ImageIcon className="h-8 w-8 text-primary" /> Dashboard Banners
                </CardTitle>
                <Button onClick={handleShuffleBanners} variant="outline" className="rounded-xl font-bold text-[10px] uppercase gap-2 h-10 border-primary/20 hover:bg-primary/5">
                  <Shuffle className="h-3 w-3" /> Shuffle Order
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div onClick={() => bannerInputRef.current?.click()} className="relative w-full aspect-[21/9] rounded-[32px] border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-all overflow-hidden">
                  {bannerPreview ? <Image src={bannerPreview} alt="Preview" fill className="object-cover" /> : <div className="text-center space-y-2"><div className="bg-primary/10 p-4 rounded-2xl inline-block"><Plus className="h-8 w-8 text-primary" /></div><p className="text-xs font-bold uppercase text-primary">Upload New Banner</p></div>}
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
                </div>
                
                {bannerFile && (
                  <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/20 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Redirect URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. /shop or https://lpu.in" 
                        value={bannerLink}
                        onChange={(e) => setBannerLink(e.target.value)}
                        className="rounded-xl h-11 bg-white shadow-none"
                      />
                      <Button onClick={handleSaveBanner} disabled={isUploadingBanner} className="h-11 rounded-xl gradient-header font-bold px-6 shadow-lg">
                        {isUploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : "Push Live"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banners?.map((banner, index) => (
                    <Card key={banner.id} className="relative overflow-hidden group shadow-md border-2 border-transparent hover:border-primary/30 transition-all rounded-[24px]">
                      <div className="relative aspect-[16/9] w-full">
                        <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <Button variant="outline" size="icon" onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0} className="rounded-full h-10 w-10 bg-white/90"><ChevronLeft className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteBanner(banner.id)} className="rounded-full h-12 w-12"><Trash2 className="h-6 w-6" /></Button>
                          <Button variant="outline" size="icon" onClick={() => handleMoveBanner(index, 'down')} disabled={index === (banners?.length || 0) - 1} className="rounded-full h-10 w-10 bg-white/90"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-dashed">
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="Redirect URL" 
                            defaultValue={banner.targetUrl || ""} 
                            onBlur={(e) => handleUpdateBannerLink(banner.id, e.target.value)}
                            className="h-9 text-[10px] rounded-lg bg-white/80"
                          />
                          <Badge variant="outline" className="h-9 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary">
                             <ExternalLink className="h-3.5 w-3.5" />
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 lg:space-y-8">
            <div className="relative max-w-2xl mx-auto lg:max-w-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, ID, hostel, or phone..." className="pl-9 h-12 rounded-2xl" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 pb-12">
              {filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-xl rounded-[32px] p-5 lg:p-7 bg-card/80 backdrop-blur-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 border border-white/10">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-14 w-14 lg:h-16 lg:w-16 border-2 border-primary/20 shadow-md">
                            <AvatarImage src={u.photoURL} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{u.username?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {u.role === 'ADMIN' && (
                             <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                               <ShieldCheck className="h-3.5 w-3.5" />
                             </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base lg:text-lg font-headline font-bold truncate leading-tight">{u.username}</h3>
                          <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium italic">
                            <Mail className="h-3 w-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${u.role === 'ADMIN' ? 'bg-primary' : u.role === 'GUARD' ? 'bg-secondary' : 'bg-muted text-muted-foreground'} text-[8px] lg:text-[10px] font-bold tracking-widest px-2 h-5`}>
                        {u.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/10">
                       <div className="flex items-center gap-2.5">
                          <CreditCard className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <div className="min-w-0">
                             <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Registration ID</p>
                             <p className="text-xs font-bold text-foreground truncate">{u.registrationNumber || "NOT SET"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2.5">
                          <Smartphone className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <div className="min-w-0">
                             <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Phone Number</p>
                             <p className="text-xs font-bold text-foreground truncate">{u.phoneNumber || "NOT SET"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2.5">
                          <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <div className="min-w-0">
                             <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Hostel / Region</p>
                             <p className="text-xs font-bold text-foreground truncate">{u.region || "NOT SELECTED"}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-6 pt-4 border-t border-dashed">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setNotifTargetId(u.id);
                        setSendToAll(false);
                        const el = document.querySelector('[value="push"]');
                        if (el instanceof HTMLElement) el.click();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                      className="rounded-xl text-[10px] font-bold h-11 bg-white/50 hover:bg-primary hover:text-white transition-all border-primary/20"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Push Alert
                    </Button>
                    {u.role !== 'ADMIN' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleToggleRole(u.id, u.role)} 
                        className="rounded-xl text-[10px] font-bold h-11 shadow-sm"
                      >
                        {u.role === 'GUARD' ? "Demote to User" : "Promote Guard"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
