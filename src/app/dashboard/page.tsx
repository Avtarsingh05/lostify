
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
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
  MessageSquare,
  Globe,
  Zap,
  TrendingUp,
  LayoutGrid,
  QrCode
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThreeDCard } from "@/components/ui/three-d-card-wrapper"
import { Button } from "@/components/ui/button"
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
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import Autoplay from "embla-carousel-autoplay"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"

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

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

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
      title: "Campus Shop",
      icon: ShoppingBag,
      href: "/shop",
      gradient: "bg-rose-500",
      description: "Premium marketplace & ad spaces"
    },
    {
      title: "Campus Gallery",
      icon: Package,
      href: "/gallery",
      gradient: "bg-blue-600",
      description: "Browse found & lost items catalog"
    },
    {
      title: "Interactive Map",
      icon: MapIcon,
      href: "/map",
      gradient: "bg-primary",
      description: "Browse campus item matches live"
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* MOBILE VIEW (lg:hidden) */}
      <div className="lg:hidden flex flex-col min-h-screen pb-32">
        <div className="gradient-header pt-12 pb-24 px-6 rounded-b-[48px] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <MapIcon size={160} />
          </div>
          <div className="max-w-md mx-auto flex flex-col gap-4 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-white text-3xl font-headline font-bold">Lostify</h1>
                  {isAdmin ? (
                    <Badge className="bg-accent text-[8px] font-bold h-4 px-2">ADMIN</Badge>
                  ) : isGuard ? (
                    <Badge className="bg-secondary text-[8px] font-bold h-4 px-2">GUARD</Badge>
                  ) : null}
                </div>
                <p className="text-white/80 text-xs font-medium truncate max-w-[200px] mt-1 opacity-90">
                  Welcome back, {userData?.username || user?.displayName || user?.email?.split('@')[0]}
                </p>
              </div>
              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-white/20 p-0.5 rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-xl">
                      <Avatar className="h-10 w-10 border-2 border-white/20">
                        <AvatarImage src={userData?.photoURL || user?.photoURL} />
                        <AvatarFallback className="bg-primary text-white text-xs font-bold">
                          {userData?.username?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-2xl p-2 mt-2 shadow-2xl border-none" align="end">
                    <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-3">Account Management</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="rounded-xl cursor-pointer h-12 font-medium">
                      <User className="mr-3 h-5 w-5 text-primary" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/my-items')} className="rounded-xl cursor-pointer h-12 font-medium">
                      <Package className="mr-3 h-5 w-5 text-primary" />
                      <span>My Items</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/chat')} className="rounded-xl cursor-pointer h-12 font-bold text-primary">
                      <MessageSquare className="mr-3 h-5 w-5" />
                      <span>Community Hub</span>
                    </DropdownMenuItem>
                    {isGuard && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-secondary px-3">Staff Utilities</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push('/guard')} className="rounded-xl cursor-pointer h-12">
                          <ShieldCheck className="mr-3 h-5 w-5 text-secondary" />
                          <span className="font-bold text-secondary">Guard Station</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl cursor-pointer h-12">
                        <LayoutDashboard className="mr-3 h-5 w-5 text-primary" />
                        <span className="font-bold text-primary">Admin Console</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl cursor-pointer h-12">
                      <Settings className="mr-3 h-5 w-5 text-muted-foreground" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-destructive font-bold h-12">
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        <main className="max-w-md mx-auto px-6 -mt-16 w-full space-y-6">
          <Carousel plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]} opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {isBannersLoading ? (
                <CarouselItem><Skeleton className="w-full h-48 rounded-[32px]" /></CarouselItem>
              ) : displayBanners && displayBanners.length > 0 ? (
                displayBanners.map((banner) => (
                  <CarouselItem key={banner.id}>
                    {banner.targetUrl ? (
                      <Link href={banner.targetUrl} target={banner.targetUrl.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="block w-full">
                        <div className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-2xl group border border-white/10 active:scale-[0.99] transition-all">
                          <Image src={banner.imageUrl} alt="Promo Banner" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                        </div>
                      </Link>
                    ) : (
                      <div className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-2xl group border border-white/10">
                        <Image src={banner.imageUrl} alt="Promo Banner" fill className="object-cover" />
                      </div>
                    )}
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                   <div className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-2xl bg-muted flex items-center justify-center border border-dashed text-center opacity-30">
                      <Sparkles className="h-10 w-10 mx-auto mb-2" />
                      <p className="font-headline font-bold text-[10px] uppercase tracking-widest">No Banners Active</p>
                   </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </Carousel>
          <div className="grid grid-cols-2 gap-4 pb-12">
            {menuItems.map((item, index) => (
              <Link key={index} href={item.href} className="block group">
                <ThreeDCard className={item.gradient + " p-5 h-40 border-none flex flex-col justify-between group-hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/5"}>
                  <div className="flex flex-col gap-3 text-white h-full justify-between">
                    <div className="bg-white/20 w-fit p-2.5 rounded-2xl shadow-lg border border-white/10 backdrop-blur-md">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-headline font-bold leading-tight">{item.title}</h3>
                      <p className="text-[9px] opacity-80 mt-1 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                    </div>
                  </div>
                </ThreeDCard>
              </Link>
            ))}
          </div>
        </main>
      </div>

      {/* WEB PORTAL VIEW (hidden on small, flex on lg) */}
      <div className="hidden lg:flex min-h-screen bg-background relative">
        <aside className="w-72 border-r bg-card h-screen sticky top-0 flex flex-col p-8 space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl gradient-header flex items-center justify-center text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
             </div>
             <h1 className="text-2xl font-headline font-bold tracking-tight">Lostify Hub</h1>
          </div>

          <nav className="flex-1 space-y-2">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-4">Navigation</p>
             {menuItems.map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-primary/5 transition-all group group">
                   <div className={cn("p-2 rounded-xl transition-all shadow-sm group-hover:scale-110", item.gradient === 'gradient-accent' ? 'bg-accent/10 text-accent' : item.gradient.replace('bg-', 'bg-') + '/10 text-' + item.gradient.split('-')[1])}>
                      <item.icon className="h-5 w-5" />
                   </div>
                   <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.title}</span>
                   <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
             ))}
             
             <div className="pt-8 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-4">Community</p>
                <Link href="/chat" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-primary/5 transition-all text-primary font-bold">
                   <MessageSquare className="h-5 w-5" />
                   <span className="text-sm">Community Hub</span>
                </Link>
             </div>
          </nav>

          <div className="pt-6 border-t">
             <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 rounded-2xl w-full text-destructive hover:bg-destructive/5 transition-all">
                <LogOut className="h-5 w-5" />
                <span className="font-bold text-sm">Sign Out</span>
             </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="h-20 px-10 flex items-center justify-between border-b bg-background/50 backdrop-blur-xl sticky top-0 z-20">
             <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-muted-foreground">Campus Dashboard</span>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 border-l pl-6">
                   <div className="text-right">
                      <p className="text-sm font-bold leading-tight">{userData?.username || user?.displayName}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{userData?.registrationNumber || 'Student'}</p>
                   </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <button className="relative group">
                            <Avatar className="h-10 w-10 border-2 border-primary/20 ring-4 ring-transparent group-hover:ring-primary/10 transition-all">
                               <AvatarImage src={userData?.photoURL || user?.photoURL} />
                               <AvatarFallback className="bg-primary/10 text-primary font-bold">{userData?.username?.charAt(0)}</AvatarFallback>
                            </Avatar>
                         </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                         <DropdownMenuItem onClick={() => router.push('/settings/profile')}>Profile</DropdownMenuItem>
                         {isAdmin && <DropdownMenuItem onClick={() => router.push('/admin')} className="text-primary font-bold">Admin Console</DropdownMenuItem>}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={handleLogout} className="text-destructive">Log out</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
             </div>
          </header>

          <div className="p-10 max-w-5xl mx-auto space-y-10">
             {/* WEB BANNER SECTION - CINEMATIC SIZE */}
             <section>
                <Carousel plugins={[Autoplay({ delay: 6000 })]} opts={{ loop: true }} className="w-full">
                  <CarouselContent>
                    {isBannersLoading ? (
                      <CarouselItem><Skeleton className="w-full h-[440px] rounded-[40px]" /></CarouselItem>
                    ) : displayBanners?.map((banner) => (
                      <CarouselItem key={banner.id}>
                        <Link href={banner.targetUrl || '#'} className="block">
                          <div className="relative w-full h-[440px] rounded-[40px] overflow-hidden shadow-2xl group border border-white/10">
                            <Image src={banner.imageUrl} alt="Banner" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                               <p className="text-white font-bold text-sm flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">Explore Promotion <ChevronRight className="h-4 w-4" /></p>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
             </section>

             <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-headline font-bold">University Modules</h2>
                   <Badge variant="outline" className="rounded-lg h-7 font-bold uppercase tracking-widest text-[10px]">Verified Access</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {menuItems.map((item, index) => (
                    <Link key={index} href={item.href} className="block group">
                      <Card className="rounded-[32px] overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all h-full bg-card hover:translate-y-[-4px]">
                         <CardContent className="p-0 flex flex-col h-full">
                            <div className={cn("h-24 flex items-center justify-center text-white", item.gradient === 'gradient-accent' ? 'gradient-accent' : item.gradient)}>
                               <item.icon className="h-10 w-10" />
                            </div>
                            <div className="p-6 space-y-2">
                               <h3 className="text-lg font-bold font-headline">{item.title}</h3>
                               <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                               <div className="pt-4 flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                  Access Feature <ChevronRight className="h-3 w-3" />
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
             </section>

             <footer className="pt-10 border-t flex items-center justify-between opacity-50">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Lostify Campus Layer v1.2</p>
                <div className="flex items-center gap-6">
                   <p className="text-[9px] font-medium">Support: forigloohelp@gmail.com</p>
                   <p className="text-[9px] font-medium">Privacy Policy</p>
                </div>
             </footer>
          </div>
        </main>

        <aside className="w-80 border-l bg-muted/20 h-screen sticky top-0 hidden xl:flex flex-col overflow-hidden shadow-inner">
           <ScrollArea className="h-full">
             <div className="p-8 space-y-8 pb-12">
               <Card className="rounded-[28px] border-none shadow-lg bg-card overflow-hidden">
                  <div className="h-20 gradient-header" />
                  <CardContent className="px-6 -mt-8 text-center pb-6">
                     <Avatar className="h-16 w-16 border-4 border-card mx-auto shadow-xl">
                        <AvatarImage src={userData?.photoURL} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{userData?.username?.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <div className="mt-3 space-y-1">
                        <h3 className="font-bold">{userData?.username || 'Student'}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{userData?.region || 'LPU Campus'}</p>
                     </div>
                     <Button onClick={() => router.push('/settings/profile')} variant="outline" className="w-full mt-4 rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest">Manage Account</Button>
                  </CardContent>
               </Card>

               {/* APP DOWNLOAD SECTION - DYNAMIC QR */}
               <Card className="rounded-[28px] border-none shadow-lg bg-card overflow-hidden">
                  <CardContent className="p-6 text-center space-y-5">
                     <div className="space-y-1">
                        <h3 className="text-sm font-bold font-headline uppercase tracking-widest text-primary">Download App</h3>
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight">Official Campus Application</p>
                     </div>
                     <div className="relative aspect-square w-36 mx-auto bg-muted rounded-2xl overflow-hidden border-4 border-white shadow-inner flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        {systemConfig?.appDownloadQR ? (
                           <Image src={systemConfig.appDownloadQR} alt="Download App QR" fill className="object-contain p-2" />
                        ) : (
                           <QrCode className="h-10 w-10 text-muted-foreground/30" />
                        )}
                     </div>
                     <div className="pt-2">
                        <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-tighter">Scan for Android / iOS</p>
                        <p className="text-[9px] text-muted-foreground italic mt-1">Optimized for Campus Mobility</p>
                     </div>
                  </CardContent>
               </Card>

               <div className="bg-primary/5 border border-primary/10 p-6 rounded-[28px] space-y-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Trust & Safety</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">All campus transactions and handovers are logged via secure digital handshakes for student protection.</p>
               </div>
             </div>
           </ScrollArea>
        </aside>
      </div>
    </div>
  )
}
