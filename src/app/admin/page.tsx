
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
  Loader2
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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

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

  // Real-time data sync
  const itemsQuery = useMemoFirebase(() => collection(db, "items"), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const auctionsQuery = useMemoFirebase(() => collection(db, "auctions"), [db])
  const { data: allAuctions } = useCollection(auctionsQuery)

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
    } catch (err) {
      // Permission errors are handled by the global listener, 
      // but we reset loading state here.
    } finally {
      setIsPushing(false)
    }
  }

  const stats = [
    { label: "Lost Items", value: lostCount.toString(), icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: foundCount.toString(), icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Total Reports", value: totalCount.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Auctions", value: allAuctions?.length.toString() || "0", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
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

        {/* Charts and Tables */}
        <div className="space-y-6">
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
        </div>
      </main>

      <div className="pt-8 pb-12 text-center space-y-2 opacity-50">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
        <p className="text-[10px] font-medium">Powered by Igloo Enterprises</p>
      </div>
    </div>
  )
}
