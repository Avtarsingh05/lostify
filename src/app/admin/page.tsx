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
  { name: "M", lost: 40, found: 24 },
  { name: "T", lost: 30, found: 13 },
  { name: "W", lost: 20, found: 98 },
  { name: "T", lost: 27, found: 39 },
  { name: "F", lost: 18, found: 48 },
  { name: "S", lost: 23, found: 38 },
  { name: "S", lost: 34, found: 43 },
]

const stats = [
  { label: "Lost", value: "1,248", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
  { label: "Found", value: "852", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
  { label: "Returned", value: "421", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Auctions", value: "24", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
]

export default function AdminDashboard() {
  const router = useRouter()

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

        {/* Charts and Tables */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
              <CardTitle className="font-headline font-bold text-lg">Traffic</CardTitle>
              <Badge variant="outline" className="text-[10px]">Weekly</Badge>
            </CardHeader>
            <CardContent className="px-4 pb-6 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="lost" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="found" fill="hsl(var(--secondary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="font-headline font-bold text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">
                      {item}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold line-clamp-1">User #{1240 + item} reported item</p>
                      <p className="text-[9px] text-muted-foreground">2 min ago</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4">OK</Badge>
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
