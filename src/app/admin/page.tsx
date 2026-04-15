
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Image as ImageIcon,
  Upload,
  Loader2,
  Trash2,
  Sparkles
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
} from "recharts"
import { ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const trafficData = [
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
  const db = useFirestore()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current banner
  const bannerDocRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "appSettings", "banner")
  }, [db])

  const { data: bannerData, isLoading: isBannerLoading } = useDoc(bannerDocRef)

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "admin_banner_upload")
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      
      const bannerRef = doc(db, "appSettings", "banner")
      setDocumentNonBlocking(bannerRef, {
        bannerUrl: data.secure_url,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      toast({
        title: "Banner Updated",
        description: "New promotional banner is now live on the dashboard.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: err.message || "Could not update banner.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBanner = () => {
    if (!db) return
    const bannerRef = doc(db, "appSettings", "banner")
    deleteDocumentNonBlocking(bannerRef)
    toast({
      title: "Banner Removed",
      description: "The dashboard banner has been deactivated.",
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
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
        
        {/* Banner Management Section */}
        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Dashboard Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="relative aspect-[21/9] w-full bg-muted rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center group transition-all">
              {bannerData?.bannerUrl ? (
                <>
                  <Image src={bannerData.bannerUrl} alt="Banner" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl font-bold text-xs"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Change
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleRemoveBanner}
                      className="rounded-xl font-bold text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center hover:scale-105 transition-transform"
                >
                  <div className="bg-primary/10 p-4 rounded-full mb-2">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload Promotion Image</p>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-xs font-bold font-headline">Syncing to Cloud...</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-3 w-3 text-accent" />
              <p className="text-[9px] text-muted-foreground leading-tight">Recommended: 21:9 ratio (e.g. 1260x540px) for optimal display on mobile devices.</p>
            </div>
          </CardContent>
        </Card>

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
                <BarChart data={trafficData}>
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
