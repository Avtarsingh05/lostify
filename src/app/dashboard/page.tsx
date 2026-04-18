
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { 
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
  Info,
  ChevronRight,
  Package,
  AlertCircle,
  Briefcase,
  Megaphone
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
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isSynced, setIsSynced] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData } = useDoc(userDocRef)

  // Master Admin Identification Logic
  const adminEmails = ["worker@gmail.com", "forigloohelp@gmail.com", "avtarsingh9528972330@gmail.com"];
  const adminUIDs = ["PX8zNjMWBWTFGYnaYWrtxojquD02", "9Qv4QkTuukaYhr2sggnQmQmqgHu1"];

  const isAdmin = (user?.email && adminEmails.includes(user.email.toLowerCase())) || 
                  (user?.uid && adminUIDs.includes(user.uid)) ||
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const menuItems = [
    {
      title: "Report Lost",
      icon: AlertCircle,
      href: "/report-lost",
      gradient: "gradient-accent",
      description: "Submit details of your missing item"
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
      title: "Campus Gallery",
      icon: Package,
      href: "/gallery",
      gradient: "gradient-header",
      description: "Browse found & lost items"
    },
    {
      title: "Clock Room",
      icon: Briefcase,
      href: "/clock-room",
      gradient: "bg-slate-800",
      description: "Luggage storage & tracking"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <MapIcon size={160} />
        </div>
        <div className="max-w-md lg:max-w-6xl mx-auto flex flex-col gap-4 relative z-10">
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
              <p className="text-white/80 text-xs font-medium truncate max-w-[200px] lg:max-w-md">
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
                  <DropdownMenuItem onClick={() => router.push('/my-items')} className="rounded-xl cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>My Items</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/orders')} className="rounded-xl cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast({ description: "Opening Clock Room Storage..." });
                    router.push('/clock-room');
                  }} className="rounded-xl cursor-pointer">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Clock Room Storage</span>
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
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-destructive font-bold">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-4 -mt-24 w-full space-y-6 lg:space-y-12">
        {/* Message Strip */}
        {notifications && notifications.length > 0 && (
          <div className="bg-white/90 dark:bg-card/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/20 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-primary/10 p-2 rounded-xl shrink-0">
              <Megaphone className="h-4 w-4 text-primary animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary truncate">{notifications[0].title}</p>
              <p className="text-xs text-muted-foreground truncate">{notifications[0].message}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}

        {/* Banner Carousel */}
        <section className="w-full">
          <Carousel 
            plugins={[Autoplay({ delay: 4000 })]} 
            className="w-full lg:max-w-5xl mx-auto"
          >
            <CarouselContent>
              {isBannersLoading ? (
                <CarouselItem>
                  <Skeleton className="w-full h-48 lg:h-[400px] rounded-[32px] lg:rounded-[48px]" />
                </CarouselItem>
              ) : displayBanners && displayBanners.length > 0 ? (
                displayBanners.map((banner) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative w-full h-48 lg:h-[400px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl group border border-white/10">
                      <Image 
                        src={banner.imageUrl} 
                        alt="Promo Banner" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                   <div className="relative w-full h-48 lg:h-[400px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl bg-muted flex items-center justify-center border border-dashed">
                      <div className="text-center opacity-30">
                        <Sparkles className="h-12 w-12 mx-auto mb-2" />
                        <p className="font-headline font-bold text-xs uppercase tracking-widest">No Banners Active</p>
                      </div>
                   </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </Carousel>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block group">
              <ThreeDCard 
                className={item.gradient + " p-4 lg:p-8 h-36 lg:h-56 border-none flex flex-col justify-between group-active:scale-[0.98] transition-transform shadow-2xl shadow-black/5"}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-2 lg:gap-4 text-white">
                  <div className="bg-white/20 w-fit p-2 lg:p-3 rounded-xl">
                    <item.icon className="h-4 w-4 lg:h-7 lg:w-7" />
                  </div>
                  <div>
                    <h3 className="text-sm lg:text-2xl font-headline font-bold leading-tight">{item.title}</h3>
                    <p className="text-[9px] lg:text-sm opacity-80 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ThreeDCard>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
