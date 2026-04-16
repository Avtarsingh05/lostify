"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { 
  Search, 
  PlusCircle, 
  Map as MapIcon, 
  ShoppingBag, 
  LayoutDashboard,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Loader2,
  Sparkles,
  Settings,
  History,
  Info
} from "lucide-react"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from "@/firebase"
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
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import Autoplay from "embla-carousel-autoplay"

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

  // Staff Authorization Logic
  const isAdmin = user?.uid === "PX8zNjMWBWTFGYnaYWrtxojquD02" || 
                  user?.email === "worker@gmail.com" || 
                  user?.email === "avtarsingh9528972330@gmail.com" ||
                  userData?.role === "ADMIN";
  const isGuard = isAdmin || userData?.role === "GUARD";

  useEffect(() => {
    if (user && db && !isSynced) {
      const userRef = doc(db, "users", user.uid)
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || "",
        role: isAdmin ? "ADMIN" : (userData?.role || "USER"),
        updatedAt: new Date().toISOString()
      }, { merge: true })
      setIsSynced(true)
    }
  }, [user, db, isSynced, isAdmin, userData?.role])

  const notifQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [db, user])

  const { data: notifications } = useCollection(notifQuery)

  const bannersQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "banners"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: displayBanners, isLoading: isBannersLoading } = useCollection(bannersQuery)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // User Menu Items (Staff panels removed from grid cards)
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
      gradient: "bg-emerald-600",
      description: "Help return an item"
    },
    {
      title: "Interactive Map",
      icon: MapIcon,
      href: "/map",
      gradient: "bg-primary",
      description: "Browse campus matches"
    },
    {
      title: "Campus Shop",
      icon: ShoppingBag,
      href: "/shop",
      gradient: "bg-blue-600",
      description: "Premium marketplace"
    },
    {
      title: "My Reports",
      icon: History,
      href: "/my-items",
      gradient: "bg-purple-600",
      description: "Track your submissions"
    },
    {
      title: "Help Center",
      icon: Info,
      href: "/help",
      gradient: "bg-slate-600",
      description: "Support & documentation"
    }
  ]

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
                  <Badge className="bg-accent text-[8px] font-bold h-4">ADMIN</Badge>
                ) : isGuard ? (
                  <Badge className="bg-secondary text-[8px] font-bold h-4">GUARD</Badge>
                ) : null}
              </div>
              <p className="text-white/80 text-xs font-medium truncate max-w-[200px]">
                Welcome, {userData?.username || user?.displayName || user?.email?.split('@')[0]}
              </p>
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
                    <h4 className="font-headline font-bold text-sm px-1">Notifications</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-3 bg-muted/30 rounded-2xl space-y-1">
                            <p className="text-xs font-bold leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{notif.message}</p>
                            <span className="text-[8px] font-bold uppercase opacity-50 block pt-1">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-8 text-[10px] font-bold uppercase opacity-40">No alerts</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white/20 p-0.5 rounded-full hover:bg-white/30 transition-colors">
                    <Avatar className="h-10 w-10 border-2 border-white/20">
                      <AvatarImage src={userData?.photoURL || user?.photoURL} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {userData?.username?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2" align="end">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-3">Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/orders')} className="rounded-xl cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  
                  {isGuard && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-secondary px-3">Staff Tools</DropdownMenuLabel>
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
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-destructive font-bold">
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
              {notifications?.[0]?.title || "Campus recovery is active!"}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 w-full space-y-6">
        {isBannersLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-[32px] shadow-2xl" />
          </div>
        ) : displayBanners && displayBanners.length > 0 && (
          <Carousel 
            className="w-full"
            plugins={[Autoplay({ delay: 5000 })]}
          >
            <CarouselContent>
              {displayBanners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <a 
                    href={banner.targetUrl || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block relative h-44 rounded-[32px] overflow-hidden shadow-2xl group border border-white/10"
                  >
                    <Image 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                        <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Featured</p>
                      </div>
                      <h2 className="text-white text-lg font-headline font-bold leading-tight">{banner.title}</h2>
                      {banner.subtitle && (
                        <p className="text-white/70 text-[10px] font-medium leading-relaxed max-w-[80%] mt-1">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

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
