"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  MessageSquare,
  AlertTriangle,
  Info,
  Lock,
  Clock,
  Sparkles,
  Users,
  ShieldCheck
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useDoc,
  addDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore"
import { format, subHours } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function CommunityChat() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [message, setMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch current user details for registration number
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userDocRef)

  // Fetch community messages (Last 24 Hours only)
  const chatQuery = useMemoFirebase(() => {
    if (!db) return null
    const twentyFourHoursAgo = subHours(new Date(), 24).toISOString()
    return query(
      collection(db, "community_messages"),
      where("createdAt", ">=", twentyFourHoursAgo),
      orderBy("createdAt", "asc"),
      limit(100)
    )
  }, [db])

  const { data: messages, isLoading: isChatLoading } = useCollection(chatQuery)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user || !db || !userData?.registrationNumber) return

    const msgData = {
      content: message.trim(),
      senderId: user.uid,
      senderName: userData?.username || user.displayName || user.email?.split('@')[0],
      senderRegNo: userData?.registrationNumber,
      senderPhoto: userData?.photoURL || user.photoURL || "",
      createdAt: new Date().toISOString()
    }

    addDocumentNonBlocking(collection(db, "community_messages"), msgData)
    setMessage("")
  }

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const hasRegNo = !!userData?.registrationNumber

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* MOBILE VIEW HEADER */}
      <div className="lg:hidden gradient-header pt-10 pb-6 px-4 rounded-b-[32px] shadow-xl text-white shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-headline font-bold flex items-center gap-2">Community Hub</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[7px] h-4 font-bold uppercase tracking-widest px-1.5">
                  <Clock className="h-2 w-2 mr-1" /> Auto-clears 24h
                </Badge>
              </div>
            </div>
          </div>
          <MessageSquare className="h-6 w-6 opacity-40" />
        </div>
      </div>

      {/* WEB VIEW HEADER */}
      <div className="hidden lg:flex gradient-header pt-12 pb-24 px-10 rounded-b-[64px] shadow-2xl text-white shrink-0">
         <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-4xl font-headline font-bold flex items-center gap-4">Campus Community Hub <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" /></h1>
                <p className="text-lg text-white/70 mt-2">Real-time coordination for lost & found recovery. Messages vanish after 24 hours.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
               <Users className="h-5 w-5 text-white/60" />
               <span className="text-sm font-bold uppercase tracking-widest">Public Lounge</span>
            </div>
         </div>
      </div>

      {!hasRegNo && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col items-center gap-3 text-center">
           <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /><p className="text-xs font-bold text-amber-700 uppercase tracking-tight">Access Restricted</p></div>
           <p className="text-[10px] font-medium text-amber-600 max-w-xs">To participate in the Community Hub, you must provide your official Campus Registration Number in your profile settings.</p>
           <Button onClick={() => router.push('/settings/profile')} size="sm" variant="outline" className="h-8 rounded-xl border-amber-500/30 text-amber-700 font-bold text-[10px]">Verify Identity Now</Button>
        </div>
      )}

      {/* Message List Area */}
      <main className="flex-1 overflow-hidden flex justify-center">
        <div className="w-full lg:max-w-6xl lg:grid lg:grid-cols-12 lg:gap-10 px-4 pt-6 pb-4">
           {/* Sidebar Info for Web */}
           <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
              <Card className="rounded-[32px] border-none shadow-xl bg-card/80 backdrop-blur-xl overflow-hidden">
                 <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                       <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Channel Rules</h3>
                       <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Identity is verified via Registration Number. Be respectful and professional.</p>
                       </div>
                       <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">History is cleared automatically every 24 hours to ensure student privacy.</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>
              <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 space-y-3">
                 <Sparkles className="h-8 w-8 text-primary" />
                 <h4 className="font-bold text-sm">Pro Tip</h4>
                 <p className="text-[11px] text-muted-foreground">Share the location name or a nearby landmark when reporting a found item in the chat.</p>
              </div>
           </div>

           {/* The Chat Window */}
           <div className="col-span-12 lg:col-span-9 flex flex-col h-full bg-white dark:bg-card/30 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden lg:-mt-20 z-10">
              <ScrollArea className="flex-1 px-6 pt-10">
                <div className="max-w-4xl mx-auto space-y-6 pb-10">
                   <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center space-y-2">
                      <div className="bg-muted p-4 rounded-full"><Sparkles className="h-6 w-6 text-primary" /></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest max-w-[220px]">Messages vanish after 24 hours. Be respectful and help your fellow students.</p>
                   </div>
                   {messages?.map((msg, i) => {
                     const isMe = msg.senderId === user?.uid
                     return (
                       <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                          <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                             <p className="text-[10px] font-bold text-muted-foreground">{msg.senderName} <span className="text-primary/60 ml-1">({msg.senderRegNo})</span></p>
                             <span className="text-[8px] font-medium opacity-40">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : 'now'}</span>
                          </div>
                          <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                             <Avatar className="h-8 w-8 shrink-0 border shadow-sm"><AvatarImage src={msg.senderPhoto} /><AvatarFallback className="text-[10px] font-bold">{msg.senderName.charAt(0)}</AvatarFallback></Avatar>
                             <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white dark:bg-card border rounded-tl-none'}`}><p className="leading-relaxed">{msg.content}</p></div>
                          </div>
                       </div>
                     )
                   })}
                   <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 bg-background/50 backdrop-blur-xl border-t">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 relative">
                  {!hasRegNo && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                       <Lock className="h-4 w-4 text-muted-foreground mr-2" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verify identity to chat</span>
                    </div>
                  )}
                  <Input placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={!hasRegNo} className="rounded-2xl h-14 bg-muted/40 border-none px-6 focus-visible:ring-2 focus-visible:ring-primary/20" />
                  <Button type="submit" disabled={!message.trim() || !hasRegNo} className="h-14 w-14 rounded-2xl gradient-header shadow-lg shadow-primary/20 shrink-0"><Send className="h-5 w-5" /></Button>
                </form>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}