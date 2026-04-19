
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
  Archive,
  Briefcase,
  MessageSquare
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore"
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

  const adminEmails = ["worker@gmail.com", "forigloohelp@gmail.com", "avtarsingh9528972330@gmail.com"];
  const adminUIDs = ["PX8zNjMWBWTFGYnaYWrtxojquD02", "9Qv4QkTuukaYhr2sggnQmQmqgHu1"];

  const isAdmin = (user?.email && adminEmails.includes(user.email.toLowerCase())) || 
                  (user?.uid && adminUIDs.includes(user.uid)) ||
                  userData?.role === "ADMIN";
  
  const isGuard = isAdmin || userData?.role === "GUARD";

  useEffect(() => {
    if (user && db && !isSynced) {
      const pendingNickname = localStorage.getItem('pending_nickname')
      const pendingRegNo = localStorage.getItem('pending_regno')

      if (pendingNickname || pendingRegNo || (userData && !userData.registrationNumber)) {
        const userRef = doc(db, "users", user.uid)
        setDocumentNonBlocking(userRef, {
          id: user.uid,
          email: user.email,
          username: pendingNickname || userData?.username || user.displayName || user.email?.split('@')[0] || 'User',
          registrationNumber: pendingRegNo || userData?.registrationNumber || "",
          photoURL: user.photoURL || "",
          role: isAdmin ? "ADMIN" : (userData?.role || "USER"),
          updatedAt: new Date().toISOString()
        }, { merge: true })

        if (pendingNickname) localStorage.removeItem('pending_nickname')
        if (pendingRegNo) localStorage.removeItem('pending_regno')
      }
      
      setIsSynced(true)
    }
  }, [user, db, isSynced, isAdmin, userData])

  const bannersQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "banners"), orderBy("position", "asc"))
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
      description: "Help return an item to security"
    },
    {
      title: "Interactive Map",
      icon: MapIcon,
      href: "/map",
      gradient: "bg-primary",
      description: "Browse campus item matches live"
    },
    {
      title: "Campus Gallery",
      icon: Package,
      href: "/gallery",
      gradient: "bg-rose-500", 
      description: "Browse found & lost items catalog"
    },
    {
      title: "Campus Shop",
      icon: ShoppingBag,
      href: "/shop",
      gradient: "bg-blue-600", 
      description: "Premium marketplace & ad spaces"
    },
    {
      title: "Clock Room",
      icon: Briefcase,
      href: "/clock-room",
      gradient: "bg-orange-600",
      description: "Secure digital luggage storage protocol"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      {/* Refined Header for Desktop */}
      <div className="gradient-header pt-12 pb-24 lg:pt-16 lg:pb-32 px-6 rounded-b-[48px] lg:rounded-b-[64px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none lg:p-16">
          <MapIcon size={180} />
        </div>
        <div className="max-w-md lg:max-w-6xl mx-auto flex flex-col gap-4 lg:gap-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 lg:gap-3">
                <h1 className="text-white text-3xl lg:text-5xl font-headline font-bold">Lostify</h1>
                {isAdmin ? (
                  <Badge className="bg-accent text-[8px] lg:text-[10px] font-bold h-4 lg:h-5 px-2.5">ADMIN</Badge>
                ) : isGuard ? (
                  <Badge className="bg-secondary text-[8px] lg:text-[10px] font-bold h-4 lg:h-5 px-2.5">GUARD</Badge>
                ) : null}
              </div>
              <p className="text-white/80 text-xs lg:text-lg font-medium truncate max-w-[200px] lg:max-w-xl mt-1 lg:mt-2 opacity-90">
                Welcome back, {userData?.username || user?.displayName || user?.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex gap-3 lg:gap-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white/20 p-0.5 lg:p-1 rounded-full hover:bg-white/30 transition-all hover:scale-105 active:scale-95 shadow-xl">
                    <Avatar className="h-10 w-10 lg:h-14 lg:w-14 border-2 border-white/20">
                      <AvatarImage src={userData?.photoURL || user?.photoURL} />
                      <AvatarFallback className="bg-primary text-white text-xs lg:text-lg font-bold">
                        {userData?.username?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 lg:w-64 rounded-2xl lg:rounded-3xl p-2 mt-2 lg:mt-3 shadow-2xl border-none" align="end">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-3">Account Management</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12 font-medium">
                    <User className="mr-3 h-5 w-5 text-primary" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/my-items')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12 font-medium">
                    <Package className="mr-3 h-5 w-5 text-primary" />
                    <span>My Items</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/chat')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12 font-bold text-primary">
                    <MessageSquare className="mr-3 h-5 w-5" />
                    <span>Community Hub</span>
                  </DropdownMenuItem>
                  
                  {isGuard && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-secondary px-3">Staff Utilities</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push('/guard')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12">
                        <ShieldCheck className="mr-3 h-5 w-5 text-secondary" />
                        <span className="font-bold text-secondary">Guard Station</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12">
                      <LayoutDashboard className="mr-3 h-5 w-5 text-primary" />
                      <span className="font-bold text-primary">Admin Console</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl lg:rounded-2xl cursor-pointer h-12">
                    <Settings className="mr-3 h-5 w-5 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl lg:rounded-2xl cursor-pointer text-destructive font-bold h-12">
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-6xl mx-auto px-6 -mt-16 lg:-mt-24 w-full space-y-8 lg:space-y-12">
        {/* Refined Banner Carousel */}
        <section className="w-full">
          <Carousel 
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]} 
            opts={{ loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {isBannersLoading ? (
                <CarouselItem>
                  <Skeleton className="w-full h-48 lg:h-[380px] rounded-[32px] lg:rounded-[48px]" />
                </CarouselItem>
              ) : displayBanners && displayBanners.length > 0 ? (
                displayBanners.map((banner) => (
                  <CarouselItem key={banner.id}>
                    {banner.targetUrl ? (
                      <a href={banner.targetUrl} target={banner.targetUrl.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="block w-full">
                        <div className="relative w-full h-48 lg:h-[380px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl group border border-white/10 active:scale-[0.99] transition-all">
                          <Image 
                            src={banner.imageUrl} 
                            alt="Promo Banner" 
                            fill 
                            className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                          />
                        </div>
                      </a>
                    ) : (
                      <div className="relative w-full h-48 lg:h-[380px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl group border border-white/10">
                        <Image 
                          src={banner.imageUrl} 
                          alt="Promo Banner" 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />
                      </div>
                    )}
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                   <div className="relative w-full h-48 lg:h-[380px] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl bg-muted flex items-center justify-center border border-dashed">
                      <div className="text-center opacity-30">
                        <Sparkles className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-2" />
                        <p className="font-headline font-bold text-xs lg:text-xl uppercase tracking-widest">No Banners Active</p>
                      </div>
                   </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Refined Dashboard Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 pb-12">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block group">
              <ThreeDCard 
                className={item.gradient + " p-5 lg:p-8 h-40 lg:h-52 border-none flex flex-col justify-between group-hover:scale-[1.03] active:scale-[0.98] transition-all shadow-2xl shadow-black/10 hover:shadow-primary/20"}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col gap-3 lg:gap-4 text-white h-full justify-between">
                  <div className="bg-white/20 w-fit p-2.5 lg:p-4 rounded-2xl lg:rounded-2xl shadow-lg border border-white/10 backdrop-blur-md">
                    <item.icon className="h-5 w-5 lg:h-8 lg:w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm lg:text-xl font-headline font-bold leading-tight flex items-center gap-2">
                      {item.title}
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transition-transform" />
                    </h3>
                    <p className="text-[9px] lg:text-sm opacity-80 mt-1 lg:mt-2 line-clamp-2 leading-relaxed font-medium">
                      {item.description}
                    </p>
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
