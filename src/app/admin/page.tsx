"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Bell,
  Send,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  Search,
  MoreVertical,
  Calendar,
  Mail,
  ShieldAlert
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
  updateDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"

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
  lost: {
    label: "Lost",
    color: "hsl(var(--accent))",
  },
  found: {
    label: "Found",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMessage, setNotifMessage] = useState("")
  const [isPushing, setIsPushing] = useState(false)
  const [userSearch, setUserSearch] = useState("")

  // Real-time data sync
  const itemsQuery = useMemoFirebase(() => collection(db, "items"), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const auctionsQuery = useMemoFirebase(() => collection(db, "auctions"), [db])
  const { data: allAuctions } = useCollection(auctionsQuery)

  const usersQuery = useMemoFirebase(() => 
    query(collection(db, "users"), orderBy("createdAt", "desc")), [db])
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery)

  const recentActivityQuery = useMemoFirebase(() => 
    query(collection(db, "items"), orderBy("reportedAt", "desc"), limit(4)), [db])
  const { data: recentItems } = useCollection(recentActivityQuery)

  const lostCount = allItems?.filter(i => i.type === 'lost').length || 0
  const foundCount = allItems?.filter(i => i.type === 'found').length || 0
  const totalCount = allItems?.length || 0

  const handlePushNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle || !notifMessage) return

    setIsPushing(true)
    const notifRef = collection(db, "notifications")
    
    try {
      await addDocumentNonBlocking(notifRef, {
        userId: 'all',
        title: notifTitle,
        message: notifMessage,
        createdAt: new Date().toISOString()
      })
      
      setNotifTitle("")
      setNotifMessage("")
      toast({
        title: "Broadcast Sent",
        description: "Notification pushed to all users.",
      })
    } finally {
      setIsPushing(false)
    }
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
    { label: "Total Reports", value: totalCount.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Students", value: allUsers?.length.toString() || "0", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-headline font-bold">Admin Console</h1>
          </div>
          <div className="flex gap-2">
            <button className="bg-white/20 p-2 rounded-xl">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-[20px] p-1 bg-white/10 backdrop-blur-md shadow-lg border border-white/20 h-12 mb-6">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Overview</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary transition-all">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-2">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-xl rounded-[24px] overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-lg font-headline font-bold mt-0.5">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-2 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Push Notification Panel */}
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card/50 backdrop-blur-xl">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="font-headline font-bold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> Push Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <form onSubmit={handlePushNotification} className="space-y-3">
                  <Input 
                    placeholder="Notification Title" 
                    className="rounded-xl bg-muted/50 border-none h-11 text-xs"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    required
                  />
                  <Input 
                    placeholder="Short message..." 
                    className="rounded-xl bg-muted/50 border-none h-11 text-xs"
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
                    Broadcast to Users
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
                <CardTitle className="font-headline font-bold text-lg">Platform Growth</CardTitle>
                <Badge variant="outline" className="text-[10px]">Weekly</Badge>
              </CardHeader>
              <CardContent className="px-4 pb-6 h-[250px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="lost" fill="var(--color-lost)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="found" fill="var(--color-found)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 m-0 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students by name or email..." 
                className="pl-9 rounded-2xl h-12 border-none shadow-lg bg-white dark:bg-card"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4 pb-12">
              {isUsersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading Database...</p>
                </div>
              ) : filteredUsers?.map((u) => (
                <Card key={u.id} className="border-none shadow-md rounded-[28px] overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-white/20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage src={u.photoURL || `https://picsum.photos/seed/${u.id}/200/200`} />
                        <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-bold truncate">{u.username}</h3>
                          {u.role === "GUARD" && <Badge className="bg-secondary text-[8px] h-3.5 px-1.5 uppercase tracking-tighter">Guard</Badge>}
                          {u.role === "ADMIN" && <Badge className="bg-primary text-[8px] h-3.5 px-1.5 uppercase tracking-tighter">Admin</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Joined
                        </p>
                        <p className="text-[10px] font-medium">
                          {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "Unknown"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <ShieldAlert className="h-2.5 w-2.5" /> Role
                        </p>
                        <p className="text-[10px] font-medium capitalize">
                          {u.role?.toLowerCase() || "User"}
                        </p>
                      </div>
                    </div>

                    {u.role !== "ADMIN" && (
                      <Button 
                        variant={u.role === "GUARD" ? "outline" : "default"}
                        size="sm" 
                        onClick={() => handleToggleRole(u.id, u.role || "USER")}
                        className={`w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest ${u.role === 'GUARD' ? 'border-secondary text-secondary hover:bg-secondary/10' : 'bg-secondary text-white shadow-lg'}`}
                      >
                        {u.role === "GUARD" ? "Remove Guard Access" : "Promote to Guard"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filteredUsers?.length === 0 && !isUsersLoading && (
                <div className="text-center py-20 opacity-40">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]">No students found</p>
                  <p className="text-[10px] mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="font-headline font-bold text-lg">Real-time Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              {recentItems?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] overflow-hidden">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold line-clamp-1">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{item.type} • {item.locationDescription}</p>
                  </div>
                  <Badge variant="outline" className={`text-[8px] h-4 ${item.status === 'Active' ? 'text-secondary border-secondary' : 'text-accent border-accent'}`}>
                    {item.status === 'Active' ? 'LIVE' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="pt-8 pb-12 text-center space-y-2 opacity-50">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
        <p className="text-[10px] font-medium">Powered by Igloo Enterprises</p>
      </div>
    </div>
  )
}
