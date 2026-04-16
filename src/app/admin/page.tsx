
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
  ShieldCheck,
  User as UserIcon,
  Search,
  Image as ImageIcon,
  Trash2,
  Upload,
  Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
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
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

const trafficData = [
  { name: "M", lost: 40, found: 24 },
  { name: "T", lost: 30, found: 13 },
  { name: "W", lost: 20, found: 98 },
  { name: "T", lost: 27, found: 39 },
  { name: "F", lost: 18, found: 48 },
  { name: "S", lost: 23, found: 38 },
  { name: "S", lost: 34, found: 43 },
]

const chartConfig = {
  lost: { label: "Lost", color: "hsl(var(--accent))" },
  found: { label: "Found", color: "hsl(var(--secondary))" },
} satisfies ChartConfig

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [isPushing, setIsPushing] = useState(false)
  const [userSearch, setUserSearch] = useState("")

  // Banner State
  const [bannerTitle, setBannerTitle] = useState("")
  const [bannerSub, setBannerSub] = useState("")
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const bannerFileRef = useRef<HTMLInputElement>(null)

  // Real-time data sync
  const itemsQuery = useMemoFirebase(() => collection(db, "items"), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, "users"), orderBy("updatedAt", "desc")), [db])
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)

  const bannersQuery = useMemoFirebase(() => collection(db, "banners"), [db])
  const { data: allBanners } = useCollection(bannersQuery)

  const lostCount = allItems?.filter(i => i.type === 'lost').length || 0
  const foundCount = allItems?.filter(i => i.type === 'found').length || 0

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
      toast({
        title: "Broadcast Sent",
        description: "Notification pushed to all users.",
      })
    }).finally(() => {
      setIsPushing(false)
    })
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !bannerTitle) {
      toast({
        variant: "destructive",
        title: "Incomplete Data",
        description: "Please enter a title before selecting an image.",
      })
      return
    }

    setIsUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "admin_banner_upload")
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Cloudinary upload failed")
      const data = await res.json()
      
      const bannersRef = collection(db, "banners")
      await addDocumentNonBlocking(bannersRef, {
        title: bannerTitle,
        subtitle: bannerSub,
        imageUrl: data.secure_url,
        createdAt: new Date().toISOString()
      })

      setBannerTitle("")
      setBannerSub("")
      toast({
        title: "Banner Added",
        description: "Your new campaign banner is live.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message,
      })
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleDeleteBanner = (id: string) => {
    const bannerRef = doc(db, "banners", id)
    deleteDocumentNonBlocking(bannerRef)
    toast({
      title: "Banner Removed",
      description: "The banner has been deleted from the rotation.",
    })
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "GUARD" ? "USER" : "GUARD"
    const userRef = doc(db, "users", userId)
    
    updateDocumentNonBlocking(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    })

    toast({
      title: "Role Updated",
      description: `User role changed to ${newRole}.`,
    })
  }

  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: lostCount.toString(), icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: foundCount.toString(), icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Total Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Health", value: "99%", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-headline font-bold">Admin Console</h1>
          </div>
          <Settings className="h-5 w-5" />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[9px] uppercase">Stats</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[9px] uppercase">Users</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold text-[9px] uppercase">Banners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-lg font-headline font-bold">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-2 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-md rounded-[32px] overflow-hidden">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="font-headline font-bold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Global Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <form onSubmit={handlePushNotification} className="space-y-3">
                  <Input 
                    placeholder="Headline" 
                    className="rounded-xl h-11 text-xs"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    required
                  />
                  <Input 
                    placeholder="Short detail..." 
                    className="rounded-xl h-11 text-xs"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl gradient-header font-bold text-xs h-11"
                    disabled={isPushing}
                  >
                    {isPushing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Push to Campus
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[32px] overflow-hidden">
              <CardContent className="p-4 h-[250px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="lost" fill="var(--color-lost)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="found" fill="var(--color-found)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search database..." 
                className="pl-9 rounded-2xl h-12 border-none shadow-md"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3 pb-12">
              {isUsersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.photoURL || `https://picsum.photos/seed/${u.id}/200/200`} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold truncate">{u.username}</h3>
                          {u.role === "GUARD" && <Badge className="bg-secondary text-[8px] h-3.5">Guard</Badge>}
                          {u.role === "ADMIN" && <Badge className="bg-primary text-[8px] h-3.5">Admin</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    {u.role !== "ADMIN" && (
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => handleToggleRole(u.id, u.role || "USER")}
                        className="w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest border-primary/20"
                      >
                        {u.role === "GUARD" ? "Revoke Guard Status" : "Promote to Guard"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <Card className="border-none shadow-md rounded-[32px] overflow-hidden">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="font-headline font-bold text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-secondary" /> Add Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-3">
                  <Input 
                    placeholder="Banner Title" 
                    className="rounded-xl h-11 text-xs"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                  />
                  <Input 
                    placeholder="Subtext (Optional)" 
                    className="rounded-xl h-11 text-xs"
                    value={bannerSub}
                    onChange={(e) => setBannerSub(e.target.value)}
                  />
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={bannerFileRef} 
                    accept="image/*"
                    onChange={handleBannerUpload}
                  />
                  <Button 
                    onClick={() => bannerFileRef.current?.click()}
                    className="w-full rounded-xl gradient-success font-bold text-xs h-11"
                    disabled={isUploadingBanner || !bannerTitle}
                  >
                    {isUploadingBanner ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                    Upload to Cloudinary
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 pb-12">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Active Banners</h3>
              {allBanners && allBanners.length > 0 ? allBanners.map((banner) => (
                <Card key={banner.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
                  <div className="flex h-20">
                    <div className="w-24 h-full relative">
                      <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-bold truncate leading-tight">{banner.title}</h4>
                        <p className="text-[8px] text-muted-foreground truncate">{banner.subtitle}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-12 opacity-30">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase">No Custom Banners</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <div className="pt-8 pb-12 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Platform Sync Enabled</p>
      </div>
    </div>
  )
}
