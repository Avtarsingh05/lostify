"use client"

import Link from "next/link"
import { 
  Search, 
  PlusCircle, 
  Map as MapIcon, 
  Package, 
  MessageCircle, 
  Gavel, 
  LayoutDashboard,
  Bell,
  User
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Report Lost Item",
    icon: Search,
    href: "/report-lost",
    gradient: "gradient-accent",
    description: "Submit a report for your missing property"
  },
  {
    title: "Report Found Item",
    icon: PlusCircle,
    href: "/report-found",
    gradient: "gradient-success",
    description: "Help someone get their item back"
  },
  {
    title: "View Map",
    icon: MapIcon,
    href: "/map",
    gradient: "bg-primary",
    description: "Browse items on an interactive map"
  },
  {
    title: "My Items",
    icon: Package,
    href: "/my-items",
    gradient: "bg-indigo-600",
    description: "Manage your lost and found reports"
  },
  {
    title: "Chat",
    icon: MessageCircle,
    href: "/chat",
    gradient: "bg-blue-600",
    description: "Communicate with finders and owners"
  },
  {
    title: "Auctions",
    icon: Gavel,
    href: "/auctions",
    gradient: "bg-purple-600",
    description: "Bid on items or claim rewards"
  }
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MapIcon size={200} />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col gap-6 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-4xl font-headline font-bold">Lostify</h1>
              <p className="text-white/80 font-medium">Hello, Alex! Welcome back.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors">
                <Bell className="text-white h-6 w-6" />
              </button>
              <button className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors">
                <User className="text-white h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4">
            <div className="bg-white rounded-xl p-2 text-primary font-bold">
              3
            </div>
            <p className="text-white font-medium">Items matched your lost reports recently!</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-4xl mx-auto px-6 -mt-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <ThreeDCard 
                className={item.gradient}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col gap-4 text-white">
                  <div className="bg-white/20 w-fit p-3 rounded-2xl">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold">{item.title}</h3>
                    <p className="text-sm opacity-80 mt-1">{item.description}</p>
                  </div>
                </div>
              </ThreeDCard>
            </Link>
          ))}
          
          <Link href="/admin" className="block md:col-span-2 lg:col-span-3">
             <ThreeDCard className="bg-card border-dashed border-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-3 rounded-2xl">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-semibold">Admin Dashboard</h3>
                    <p className="text-sm text-muted-foreground">System metrics and management</p>
                  </div>
                </div>
                <Badge variant="secondary" className="px-4 py-1">View Analytics</Badge>
             </ThreeDCard>
          </Link>
        </div>
      </main>
    </div>
  )
}
