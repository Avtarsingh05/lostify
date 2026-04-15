"use client"

import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Settings
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

const data = [
  { name: "Mon", lost: 40, found: 24 },
  { name: "Tue", lost: 30, found: 13 },
  { name: "Wed", lost: 20, found: 98 },
  { name: "Thu", lost: 27, found: 39 },
  { name: "Fri", lost: 18, found: 48 },
  { name: "Sat", lost: 23, found: 38 },
  { name: "Sun", lost: 34, found: 43 },
]

const stats = [
  { label: "Total Lost Items", value: "1,248", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
  { label: "Total Found Items", value: "852", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
  { label: "Items Returned", value: "421", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Auctions", value: "24", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
]

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-headline font-bold">Admin Console</h1>
          </div>
          <div className="flex gap-3">
            <button className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition-colors">
              <FileText className="h-5 w-5" />
            </button>
            <button className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-12 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-xl rounded-[24px] overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-headline font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`${stat.bg} p-4 rounded-2xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl rounded-[32px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
              <CardTitle className="font-headline font-bold">Traffic Overview</CardTitle>
              <Badge variant="outline">Weekly</Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="lost" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="found" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="font-headline font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                      {item}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">User #{1240 + item} reported an item</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">VERIFIED</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
