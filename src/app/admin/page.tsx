
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
  Package
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/dialog"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [isPushing, setIsPushing] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [itemSearch, setItemSearch] = useState("")

  // Logo Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Banner Management State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState("")
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const itemsQuery = useMemoFirebase(() => query(collection(db, "items"), orderBy("reportedAt", "desc")), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, "users"), orderBy("updatedAt", "desc")), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const shopItemsQuery = useMemoFirebase(() => 
    query(collection(db, "shopItems"), orderBy("createdAt", "desc")), [db])
  const { data: shopItems } = useCollection(shopItemsQuery)

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  const notificationsQuery = useMemoFirebase(() => 
    query(collection(db, "notifications"), orderBy("createdAt", "desc")), [db])
  const { data: notifications } = useCollection(notificationsQuery)

  const bannersQuery = useMemoFirebase(() => 
    query(collection(db, "banners"), orderBy("createdAt", "desc")), [db])
  const { data: banners } = useCollection(bannersQuery)

  const handlePushNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return

    setIsPushing(true)
    const notifRef = collection(db, "notifications")
    
    addDocumentNonBlocking(notifRef, {
      userId: 'all',
      title: notifTitle,
      message: notifMessage,
      createdAt: new Date().toISOString()
    }).then(() => {
      setNotifTitle("")
      setNotifMessage("")
      toast({ title: "Broadcast Sent" })
    }).finally(() => {
      setIsPushing(false)
    })
  }

  const handleDeleteNotification = (id: string) => {
    const notifRef = doc(db, "notifications", id)
    deleteDocumentNonBlocking(notifRef)
    toast({ title: "Broadcast Removed" })
  }

  const handleDeleteItem = (id: string) => {
    const itemRef = doc(db, "items", id)
    deleteDocumentNonBlocking(itemRef)
    toast({ title: "Item Record Deleted", description: "This action is permanent." })
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
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Banner Added",
        description: "Promotional banner is now live on the dashboard.",
      })
      setBannerFile(null)
      setBannerPreview("")
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

  const handleDeleteBanner = (id: string) => {
    const bannerRef = doc(db, "banners", id)
    deleteDocumentNonBlocking(bannerRef)
    toast({ title: "Banner Removed" })
  }

  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredItems = allItems?.filter(i => 
    i.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.claimerRegNo?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.storageOffice?.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Total Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Shop Items", value: shopItems?.length.toString() || "0", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10" },
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
          <TabsList className="grid w-full grid-cols-5 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 max-w-2xl mx-auto lg:max-w-none">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Stats</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Users</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Branding</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Banners</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl font-bold text-[8px] lg:text-xs uppercase">Audit</TabsTrigger>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
              <Card className="border-none shadow-md rounded-[32px] overflow-hidden">
                <CardHeader className="px-6 pt-6 pb-2 lg:px-10 lg:pt-10">
                  <CardTitle className="font-headline font-bold text-lg lg:text-2xl flex items-center gap-2">
                    <Bell className="h-5 w-5 lg:h-8 lg:w-8 text-primary" /> Global Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 lg:px-10 lg:pb-10 space-y-4">
                  <form onSubmit={handlePushNotification} className="space-y-3 lg:space-y-6">
                    <Input placeholder="Headline" className="rounded-xl h-12" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} required />
                    <Input placeholder="Message" className="rounded-xl h-12" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} required />
                    <Button type="submit" className="w-full h-12 lg:h-14 rounded-xl gradient-header font-bold text-xs lg:text-sm" disabled={isPushing}>
                      {isPushing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Push Broadcast
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md rounded-[32px] overflow-hidden bg-muted/20">
                <CardHeader className="px-6 pt-6 pb-2 lg:px-10 lg:pt-10">
                  <CardTitle className="font-headline font-bold text-lg lg:text-2xl flex items-center gap-2">
                    <Clock className="h-5 w-5 lg:h-8 lg:w-8 text-muted-foreground" /> Broadcast History
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 lg:px-10 lg:pb-10">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="bg-card p-4 rounded-2xl border flex items-center justify-between group">
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-bold truncate">{notif.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{notif.message}</p>
                              <span className="text-[8px] font-bold uppercase opacity-50 block pt-1">
                                {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : "recently"}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteNotification(notif.id)}
                              className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                          <Bell className="h-10 w-10 mb-2" />
                          <p className="text-[10px] font-bold uppercase">No broadcasts sent</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 lg:space-y-12">
            <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm max-w-2xl mx-auto">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" /> Login Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-[40px] gradient-header shadow-2xl flex items-center justify-center text-white overflow-hidden border-4 border-white/20">
                      {logoPreview || systemConfig?.appLogo ? (
                        <Image 
                          src={logoPreview || systemConfig?.appLogo} 
                          alt="App Logo" 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <Sparkles className="h-16 w-16 lg:h-24 lg:w-24" />
                      )}
                    </div>
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-white text-primary p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border border-primary/10"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoChange} 
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold">University Logo</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Replaces the default Sparkles icon on login</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveLogo} 
                  disabled={!logoFile || isUploading}
                  className="w-full h-14 rounded-2xl gradient-header font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading Branding...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5" />
                      Update University Logo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6 lg:space-y-12">
            <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card/80 backdrop-blur-sm max-w-4xl mx-auto">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                  <ImageIcon className="h-8 w-8 text-primary" /> Dashboard Banners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col gap-6">
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="relative w-full aspect-[21/9] rounded-[32px] border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-all overflow-hidden"
                  >
                    {bannerPreview ? (
                      <Image src={bannerPreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="bg-primary/10 p-4 rounded-2xl inline-block">
                           <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Upload New Banner</p>
                        <p className="text-[10px] text-muted-foreground">High resolution landscape recommended (21:9)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={bannerInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleBannerChange} 
                    />
                  </div>
                  
                  {bannerFile && (
                    <Button 
                      onClick={handleSaveBanner} 
                      disabled={isUploadingBanner}
                      className="h-14 rounded-2xl gradient-header font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      {isUploadingBanner ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                      Push Banner Live
                    </Button>
                  )}
                </div>

                <div className="space-y-4 pt-8 border-t">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Banners</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {banners?.map((banner) => (
                        <div key={banner.id} className="relative aspect-[16/9] rounded-2xl overflow-hidden group shadow-md">
                           <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => handleDeleteBanner(banner.id)}
                                className="rounded-full h-12 w-12 shadow-2xl"
                              >
                                <Trash2 className="h-6 w-6" />
                              </Button>
                           </div>
                        </div>
                      ))}
                      {(!banners || banners.length === 0) && (
                        <div className="col-span-full py-12 text-center opacity-30 border-2 border-dashed rounded-[32px]">
                           <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                           <p className="text-[10px] font-bold uppercase">No active banners</p>
                        </div>
                      )}
                   </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 lg:space-y-8">
            <div className="relative max-w-2xl mx-auto lg:max-w-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 h-12 rounded-2xl" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 pb-12">
              {filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-sm rounded-2xl p-4 lg:p-6 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 lg:h-12 lg:w-12"><AvatarImage src={u.photoURL} /><AvatarFallback>{u.username?.charAt(0)}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-sm lg:text-base font-bold">{u.username}</h3>
                        <p className="text-[10px] lg:text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge className={u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}>{u.role}</Badge>
                  </div>
                  {u.role !== 'ADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => handleToggleRole(u.id, u.role)} className="w-full mt-3 rounded-xl text-[10px] lg:text-xs font-bold h-10">
                      {u.role === 'GUARD' ? "Revoke Guard" : "Promote to Guard"}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4 lg:space-y-8">
            <div className="relative max-w-2xl mx-auto lg:max-w-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search Audit Logs (Reg No, Item, Office)..." className="pl-9 h-12 rounded-2xl" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6 pb-12">
              {filteredItems?.map((item) => (
                <Card key={item.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm p-4 lg:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl overflow-hidden relative border shadow-sm"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                      <div>
                        <h4 className="text-sm lg:text-base font-bold leading-tight">{item.name}</h4>
                        <Badge variant="outline" className="text-[8px] lg:text-[10px] h-4 mt-1">{item.status}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-muted/30 p-2 lg:p-3 rounded-xl border border-dashed">
                      <p className="text-[8px] lg:text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Building className="h-2 w-2" /> Storage</p>
                      <p className="text-[10px] lg:text-xs font-bold truncate">{item.storageOffice || "Not Logged"}</p>
                    </div>
                    <div className="bg-muted/30 p-2 lg:p-3 rounded-xl border border-dashed">
                      <p className="text-[8px] lg:text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><UserCheck className="h-2 w-2" /> Claimer</p>
                      <p className="text-[10px] lg:text-xs font-bold truncate">{item.claimerRegNo || "Active"}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-[8px] lg:text-[10px] text-muted-foreground flex justify-between">
                    <span>By: {item.verifiedBy || "N/A"}</span>
                    <span>Resolved: {item.resolvedBy || "N/A"}</span>
                  </div>
                </Card>
              ))}
              {(!filteredItems || filteredItems.length === 0) && (
                <div className="col-span-full py-24 text-center opacity-30 border-2 border-dashed rounded-[40px]">
                   <Package className="h-12 w-12 mx-auto mb-2" />
                   <p className="text-[10px] font-bold uppercase">No item records found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
