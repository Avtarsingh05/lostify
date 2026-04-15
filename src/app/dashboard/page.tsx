
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Search, 
  PlusCircle, 
  Map as MapIcon, 
  Package, 
  MessageCircle, 
  Gavel, 
  LayoutDashboard,
  ShieldCheck,
  Bell,
  User,
  Settings,
  LogOut,
  CreditCard
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Badge } from "@/components/ui/badge"
import { useAuth, useUser } from "@/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  {
    title: "Report Lost",
    icon: Search,
    href: "/report-lost",
    gradient: "gradient-accent",
    description: "Submit a missing report"
  },
  {
    title: "Report Found",
    icon: PlusCircle,
    href: "/report-found",
    gradient: "gradient-success",
    description: "Help return an item"
  },
  {
    title: "View Map",
    icon: MapIcon,
    href: "/map",
    gradient: "bg-primary",
    description: "Interactive browsing"
  },
  {
    title: "My Items",
    icon: Package,
    href: "/my-items",
    gradient: "bg-indigo-600",
    description: "Manage your reports"
  },
  {
    title: "Chat",
    icon: MessageCircle,
    href: "/chat",
    gradient: "bg-blue-600",
    description: "Secure messaging"
  },
  {
    title: "Auctions",
    icon: Gavel,
    href: "/auctions",
    gradient: "bg-purple-600",
    description: "Bid on items"
  }
]

export default function Dashboard() {
  const { user } = useUser()
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MapIcon size={150} />
        </div>
        <div className="max-w-md mx-auto flex flex-col gap-4 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-3xl font-headline font-bold">Lostify</h1>
              <p className="text-white/80 text-sm font-medium">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition-colors">
                <Bell className="text-white h-5 w-5" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-white/20">
                      <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                      <AvatarFallback className="bg-primary text-white text-[10px]">
                        {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2" align="end">
                  <DropdownMenuLabel className="font-headline font-bold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/my-items')} className="rounded-xl cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Items</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Rewards</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center gap-3">
            <div className="bg-white rounded-lg px-2 py-1 text-primary text-sm font-bold">
              3
            </div>
            <p className="text-white text-xs font-medium">New matches found recently!</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-md mx-auto px-4 -mt-10 w-full space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <ThreeDCard 
                className={item.gradient + " p-4 h-full"}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-2 text-white">
                  <div className="bg-white/20 w-fit p-2 rounded-xl">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-headline font-bold leading-tight">{item.title}</h3>
                    <p className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                </div>
              </ThreeDCard>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link href="/guard" className="block">
             <ThreeDCard className="bg-white dark:bg-card border-2 flex items-center justify-between p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 p-2 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-headline font-bold">Guard Dashboard</h3>
                    <p className="text-[10px] text-muted-foreground">Manage handovers & claims</p>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-0.5 text-[10px] bg-secondary/10 text-secondary border-none">Security</Badge>
             </ThreeDCard>
          </Link>

          <Link href="/admin" className="block">
             <ThreeDCard className="bg-white dark:bg-card border-2 flex items-center justify-between p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-headline font-bold">Admin Console</h3>
                    <p className="text-[10px] text-muted-foreground">Analytics & Global Control</p>
                  </div>
                </div>
                <Badge variant="outline" className="px-3 py-0.5 text-[10px]">Manager</Badge>
             </ThreeDCard>
          </Link>
        </div>
      </main>
    </div>
  )
}
