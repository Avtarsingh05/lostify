"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  LogOut,
  Loader2,
  Clock
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { collection, query, orderBy, limit, doc, setDoc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

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
  const db = useFirestore()
  const router = useRouter()
  const [isSynced, setIsSynced] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  useEffect(() => {
    if (user && db && !isSynced) {
      const userRef = doc(db, "users", user.uid)
      // Robust profile sync to ensure user container exists in Firestore
      setDoc(userRef, {
        id: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || "",
        updatedAt: new Date().toISOString()
      }, { merge: true })
      .then(() => setIsSynced(true))
      .catch((err) => console.warn("Sync error:", err))
    }
  }, [user, db, isSynced])

  const notifQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [db, user])

  const { data: notifications } = useCollection(notifQuery)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  // Force Admin role for your UID for the prototype dashboard view
  const isAdmin = userData?.role === "ADMIN" || user?.uid === "PX8zNjMWBWTFGYnaYWrtxojquD02" || user?.uid === "tkGcuQnwxGgC32WZrtinZifDrDI2" || user?.email === "worker@gmail.com";
  const isGuard = userData?.role === "GUARD" || isAdmin;

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      <div className="gradient-header pt-12 pb-20 px-4 rounded-b-[48px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <MapIcon size={160} />
        </div>
        <div className="max-w-md mx-auto flex flex-col gap-4 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-3xl font-headline font-bold">Lostify</h1>
                {isAdmin ? (
                  <Badge className="bg-accent text-[8px] font-bold h-4">SUPER ADMIN</Badge>
                ) : isGuard ? (
                  <Badge className="bg-secondary text-[8px] font-bold h-4">GUARD</Badge>
                ) : null}
              </div>
              <p className="text-white/80 text-xs font-medium">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
            </div>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors relative">
                    <Bell className="text-white h-5 w-5" />
                    {notifications && notifications.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-primary animate-pulse" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-[28px] p-4 mt-2" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="font-headline font-bold text-sm">Notifications</h4>
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-3 bg-muted/30 rounded-2xl space-y-1">
                            <p className="text-xs font-bold leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{notif.message}</p>
                            <div className="flex items-center gap-1 pt-1 opacity-50">
                              <Clock className="h-2.5 w-2.5" />
                              <span className="text-[8px] font-bold uppercase">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 opacity-40">
                          <Bell className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No new alerts</p>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white/20 p-0.5 rounded-full hover:bg-white/30 transition-colors">
                    <Avatar className="h-10 w-10 border-2 border-white/20">
                      <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
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
                  
                  {isGuard && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="font-headline font-bold text-[10px] text-muted-foreground uppercase tracking-widest px-2 py-1">Management</DropdownMenuLabel>
                      
                      <DropdownMenuItem onClick={() => router.push('/guard')} className="rounded-xl cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4 text-secondary" />
                        <span>Guard Station</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                      <span>Admin Console</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <div className="bg-white rounded-lg px-2 py-1 text-primary text-xs font-bold shadow-sm">
              {notifications?.length || 0}
            </div>
            <p className="text-white text-xs font-medium truncate">
              {notifications?.[0]?.title || "Stay alert for campus item matches!"}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 w-full space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block group">
              <ThreeDCard 
                className={item.gradient + " p-4 h-36 border-none flex flex-col justify-between group-active:scale-[0.98] transition-transform shadow-2xl"}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-2 text-white">
                  <div className="bg-white/20 w-fit p-2 rounded-xl">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-headline font-bold leading-tight">{item.title}</h3>
                    <p className="text-[9px] opacity-80 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ThreeDCard>
            </Link>
          ))}
        </div>

        <div className="pt-12 pb-8 text-center space-y-2 opacity-50">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
          <p className="text-[10px] font-medium">Powered by Igloo Enterprises</p>
        </div>
      </main>
    </div>
  )
}