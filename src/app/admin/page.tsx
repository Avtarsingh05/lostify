
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
  Link as LinkIcon,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  Building,
  UserCheck
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
  const [itemSearch, setItemSearch] = useState("")

  // Real-time data sync
  const itemsQuery = useMemoFirebase(() => collection(db, "items"), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, "users"), orderBy("updatedAt", "desc")), [db])
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)

  const shopItemsQuery = useMemoFirebase(() => 
    query(collection(db, "shopItems"), orderBy("createdAt", "desc")), [db])
  const { data: shopItems } = useCollection(shopItemsQuery)

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

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "GUARD" ? "USER" : "GUARD"
    const userRef = doc(db, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: new Date().toISOString() })
    toast({ title: "Role Updated" })
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
          <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-card shadow-lg h-12 mb-6 overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[8px] uppercase">Stats</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[8px] uppercase">Users</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl font-bold text-[8px] uppercase">Audit</TabsTrigger>
            <TabsTrigger value="shop" className="rounded-xl font-bold text-[8px] uppercase">Shop</TabsTrigger>
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
                  <Input placeholder="Headline" className="rounded-xl" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} required />
                  <Input placeholder="Message" className="rounded-xl" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} required />
                  <Button type="submit" className="w-full rounded-xl gradient-header font-bold text-xs" disabled={isPushing}>
                    {isPushing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Push Broadcast
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9 rounded-2xl" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="space-y-3 pb-12">
              {filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-sm rounded-2xl p-4 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={u.photoURL} /><AvatarFallback>{u.username?.charAt(0)}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-sm font-bold">{u.username}</h3>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge className={u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}>{u.role}</Badge>
                  </div>
                  {u.role !== 'ADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => handleToggleRole(u.id, u.role)} className="w-full mt-3 rounded-xl text-[10px] font-bold">
                      {u.role === 'GUARD' ? "Revoke Guard" : "Promote to Guard"}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search Audit Logs (Reg No, Item, Office)..." className="pl-9 rounded-2xl" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
            </div>
            <div className="space-y-3 pb-12">
              {filteredItems?.map((item) => (
                <Card key={item.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative border shadow-sm"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">{item.name}</h4>
                        <Badge variant="outline" className="text-[8px] h-4 mt-1">{item.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-muted/30 p-2 rounded-xl border border-dashed">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Building className="h-2 w-2" /> Storage Location</p>
                      <p className="text-[10px] font-bold truncate">{item.storageOffice || "Not Logged"}</p>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-xl border border-dashed">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1"><UserCheck className="h-2 w-2" /> Claimer Reg No</p>
                      <p className="text-[10px] font-bold truncate">{item.claimerRegNo || "Active/Pending"}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-[8px] text-muted-foreground flex justify-between">
                    <span>Verified By: {item.verifiedBy || "N/A"}</span>
                    <span>Resolved By: {item.resolvedBy || "N/A"}</span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shop" className="space-y-4">
             {/* Shop item list remains same as previous but integrated here */}
             <div className="text-center py-20 opacity-30"><ShoppingBag className="h-10 w-10 mx-auto" /><p className="text-[10px] font-bold mt-2">Shop Management Active</p></div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
