
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
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
  Loader2
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
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
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="gradient-header pt-8 pb-16 px-4 rounded-b-[32px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <MapIcon size={120} />
        </div>
        <div className="max-w-md mx-auto flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-2xl font-headline font-bold">Lostify</h1>
              <p className="text-white/80 text-[11px] font-medium">Hi, {user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                <Bell className="text-white h-4 w-4" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white/20 p-0.5 rounded-full hover:bg-white/30 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-white/20">
                      <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} />
                      <AvatarFallback className="bg-primary text-white text-[10px]">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2" align="end">
                  <DropdownMenuLabel className="font-headline font-bold">Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/my-items')} className="rounded-xl cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Reports</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-headline font-bold text-[10px] text-muted-foreground uppercase tracking-widest px-2 py-1">Management</DropdownMenuLabel>
                  
                  <DropdownMenuItem onClick={() => router.push('/guard')} className="rounded-xl cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4 text-secondary" />
                    <span>Guard Station</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                    <span>Admin Console</span>
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
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
            <div className="bg-white rounded-md px-1.5 py-0.5 text-primary text-[10px] font-bold">
              3
            </div>
            <p className="text-white text-[10px] font-medium">New matches discovered in your area!</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-md mx-auto px-4 -mt-8 w-full space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <ThreeDCard 
                className={item.gradient + " p-3.5 h-full border-none"}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-2 text-white">
                  <div className="bg-white/20 w-fit p-1.5 rounded-lg">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-headline font-bold leading-tight">{item.title}</h3>
                    <p className="text-[9px] opacity-70 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>
              </ThreeDCard>
            </Link>
          ))}
        </div>

        <div className="pt-8 pb-4 text-center space-y-1 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
          <p className="text-[9px] font-medium">Powered by Igloo Enterprises</p>
        </div>
      </main>
    </div>
  )
}
