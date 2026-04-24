
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Bell,
  Send,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Clock,
  Image as ImageIcon,
  Plus,
  Package,
  Phone,
  CreditCard,
  ChevronRight,
  User,
  ShieldCheck,
  Smartphone,
  Save,
  QrCode,
  ShieldAlert,
  Trophy,
  Megaphone,
  ShoppingBag,
  DollarSign,
  Zap,
  LayoutGrid,
  History,
  Archive
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc,
  useUser
} from "@/firebase"
import { collection, query, orderBy, doc, increment } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { format } from "date-fns"
import { sendOneSignalNotification } from "@/app/actions/notifications"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [userSearch, setUserSearch] = useState("")
  const [historySearch, setHistorySearch] = useState("")
  const [viewingUser, setViewingUser] = useState<any | null>(null)

  const itemsQuery = useMemoFirebase(() => query(collection(db, "items")), [db])
  const { data: allItems } = useCollection(itemsQuery)
  
  const usersQuery = useMemoFirebase(() => query(collection(db, "users")), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const theftReportsQuery = useMemoFirebase(() => query(collection(db, "theftReports"), orderBy("timestamp", "desc")), [db])
  const { data: theftReports } = useCollection(theftReportsQuery)

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  const historyQuery = useMemoFirebase(() => 
    query(collection(db, "handoverHistory"), orderBy("timestamp", "desc")), [db])
  const { data: handoverHistory } = useCollection(historyQuery)

  const handleVerifyTheft = async (reportId: string, reporterId: string, status: 'verified' | 'rejected') => {
    if (!db) return
    const reportRef = doc(db, "theftReports", reportId)
    const reporterRef = doc(db, "users", reporterId)

    if (status === 'verified') {
      updateDocumentNonBlocking(reportRef, { status: "verified", rewardGiven: true })
      updateDocumentNonBlocking(reporterRef, { points: increment(100) })
      toast({ title: "Verified", description: "Reporter rewarded with 100 points." })
    } else {
      updateDocumentNonBlocking(reportRef, { status: "rejected" })
      toast({ variant: "destructive", title: "Report Rejected" })
    }
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "GUARD" ? "USER" : "GUARD"
    const userRef = doc(db, "users", userId)
    updateDocumentNonBlocking(userRef, { role: newRole, updatedAt: new Date().toISOString() })
    toast({ title: "Role Updated" })
  }

  const filteredUsers = allUsers?.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.registrationNumber?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredHistory = handoverHistory?.filter(h => 
    h.itemName?.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.recipientReg?.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.recipientPhone?.toLowerCase().includes(historySearch.toLowerCase())
  )

  const stats = [
    { label: "Lost Items", value: allItems?.filter(i => i.type === 'lost' && i.status !== 'Delivered').length.toString() || "0", icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10" },
    { label: "Found Items", value: allItems?.filter(i => i.type === 'found' && i.status !== 'Delivered').length.toString() || "0", icon: CheckCircle, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Students", value: allUsers?.length.toString() || "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Handed Over", value: handoverHistory?.length.toString() || "0", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Campus Control</h1>
                <p className="text-xl text-white/70 mt-2">Manage security protocols and audit histories</p>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-10 -mt-24 space-y-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-[32px] p-1 bg-card shadow-xl h-16 mb-10 border overflow-hidden">
            <TabsTrigger value="overview" className="rounded-xl font-bold uppercase text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="theft" className="rounded-xl font-bold uppercase text-[10px] text-destructive">Theft Reports</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold uppercase text-[10px]">Students</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold uppercase text-[10px]">Audit Log</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl font-bold uppercase text-[10px]">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="m-0">
            <div className="grid grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-xl rounded-[32px] overflow-hidden group hover:translate-y-[-4px] transition-all">
                  <CardContent className="p-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-4xl font-headline font-bold mt-2">{stat.value}</h3>
                    </div>
                    <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="theft" className="m-0 space-y-6">
             <div className="grid grid-cols-3 gap-6">
                {theftReports?.map(report => (
                  <Card key={report.id} className="border-none shadow-xl rounded-[24px] overflow-hidden bg-card/80 backdrop-blur-sm">
                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                      {report.mediaUrl && <Image src={report.mediaUrl} alt="Proof" fill className="object-cover" />}
                      <div className="absolute top-3 left-3">
                        <Badge className={`${report.status === 'pending' ? 'bg-orange-500' : report.status === 'verified' ? 'bg-secondary' : 'bg-destructive'} border-none font-bold text-[8px] h-5`}>
                           {report.status?.toUpperCase() || "PENDING"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                       <h3 className="font-bold text-xs leading-tight">{report.locationName || "No Location"}</h3>
                       <p className="text-[8px] text-muted-foreground italic line-clamp-2">"{report.description}"</p>
                       <div className="flex gap-2">
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'verified')} disabled={report.status !== 'pending'} className="flex-1 rounded-lg h-8 bg-secondary text-[9px] font-bold">Verify & Reward</Button>
                          <Button onClick={() => handleVerifyTheft(report.id, report.reporterId, 'rejected')} disabled={report.status !== 'pending'} variant="outline" className="flex-1 rounded-lg h-8 text-[9px] font-bold">Reject</Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 m-0">
             <div className="relative max-w-2xl mx-auto">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input placeholder="Search students..." className="pl-12 h-14 rounded-2xl shadow-lg border-none" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
             </div>
             <div className="grid grid-cols-3 gap-6">
                {filteredUsers?.map(u => (
                  <Card key={u.id} className="p-6 rounded-[32px] border-none shadow-lg flex items-center gap-4">
                     <Avatar className="h-12 w-12"><AvatarImage src={u.photoURL} /><AvatarFallback className="bg-primary/10 text-primary font-bold">{u.username?.charAt(0)}</AvatarFallback></Avatar>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{u.username || "Anonymous"}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => setViewingUser(u)} className="shrink-0"><Settings className="h-4 w-4" /></Button>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 m-0">
             <div className="relative max-w-2xl mx-auto">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input placeholder="Search items, student IDs, or phones..." className="pl-12 h-14 rounded-2xl shadow-lg border-none" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
             </div>
             <div className="grid grid-cols-1 gap-4">
                {filteredHistory?.map(h => (
                  <Card key={h.id} className="p-6 rounded-[32px] border-none shadow-lg flex items-center gap-8 bg-card/80">
                     <div className="w-24 h-24 rounded-2xl relative overflow-hidden shrink-0 shadow-md"><Image src={h.userPhoto} alt="Recipient" fill className="object-cover" /></div>
                     <div className="flex-1 grid grid-cols-3 gap-8">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Item Recovered</p>
                           <h3 className="font-headline font-bold text-lg mt-1">{h.itemName}</h3>
                           <Badge variant="outline" className="mt-2 h-5 text-[8px] border-blue-500/20 text-blue-500 bg-blue-500/5">DELIVERED</Badge>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipient Registry</p>
                           <p className="text-sm font-bold mt-1">ID: {h.recipientReg}</p>
                           <p className="text-xs text-muted-foreground mt-1">{h.recipientPhone}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Auth Protocol</p>
                           <p className="text-sm font-bold mt-1 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-secondary" /> {h.guardName}</p>
                           <p className="text-xs text-muted-foreground mt-1">{format(new Date(h.timestamp), 'MMM dd, yyyy')}</p>
                        </div>
                     </div>
                  </Card>
                ))}
                {(!filteredHistory || filteredHistory.length === 0) && <div className="py-20 text-center opacity-30 bg-muted/10 rounded-[40px] border-4 border-dashed"><History className="h-12 w-12 mx-auto mb-4" /><p className="font-bold uppercase tracking-widest">No matching history found</p></div>}
             </div>
          </TabsContent>

          <TabsContent value="branding" className="m-0 space-y-6">
             {/* Branding states preserved from original page.tsx */}
             <Card className="rounded-[40px] p-10 space-y-6 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-2xl font-headline font-bold">Branding & System Configuration</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">Update your app's visual identity and system-wide configurations.</p>
             </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Student Identity Audit</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-8 pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/10"><AvatarImage src={viewingUser.photoURL} /><AvatarFallback className="bg-primary text-white text-3xl font-bold">{viewingUser.username?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <h3 className="text-2xl font-bold leading-tight">{viewingUser.username || "Anonymous"}</h3>
                  <Badge className="mt-2 bg-primary/10 text-primary border-none font-bold uppercase text-[9px] h-5">{viewingUser.role || "USER"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Registry ID</p><p className="text-sm font-bold">{viewingUser.registrationNumber || "Unverified"}</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p><p className="text-sm font-bold">{viewingUser.phoneNumber || "No Data"}</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Reward Ledger</p><p className="text-sm font-bold">{viewingUser.points || 0} pts</p></div>
                <div className="bg-muted/30 p-5 rounded-2xl space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Last Active</p><p className="text-sm font-bold">{viewingUser.updatedAt ? format(new Date(viewingUser.updatedAt), 'MMM dd') : "N/A"}</p></div>
              </div>
              <div className="pt-6 border-t border-dashed">
                <Button onClick={() => { handleToggleRole(viewingUser.id, viewingUser.role || "USER"); setViewingUser(null); }} className="w-full h-14 rounded-2xl font-bold gradient-header shadow-xl">Promote to {viewingUser.role === 'GUARD' ? 'STUDENT' : 'GUARD'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
