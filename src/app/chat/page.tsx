
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
  Lock
} from "lucide-react"
import { Card } from "@/components/ui/card"
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
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  // Fetch community messages (last 50)
  const chatQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "community_messages"),
      orderBy("createdAt", "asc"),
      limit(50)
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasRegNo = !!userData?.registrationNumber

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Premium Header */}
      <div className="gradient-header pt-10 pb-6 px-4 rounded-b-[32px] shadow-xl text-white shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-headline font-bold flex items-center gap-2">
                Community Hub <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Public Campus Chat</p>
            </div>
          </div>
          <MessageSquare className="h-6 w-6 opacity-40" />
        </div>
      </div>

      {!hasRegNo && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col items-center gap-3 text-center">
           <div className="flex items-center gap-2">
             <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
             <p className="text-xs font-bold text-amber-700 uppercase tracking-tight">Access Restricted</p>
           </div>
           <p className="text-[10px] font-medium text-amber-600 max-w-xs">
             To participate in the Community Hub, you must provide your official Campus Registration Number in your profile settings.
           </p>
           <Button onClick={() => router.push('/settings/profile')} size="sm" variant="outline" className="h-8 rounded-xl border-amber-500/30 text-amber-700 font-bold text-[10px]">
             Verify Identity Now
           </Button>
        </div>
      )}

      {/* Message List */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 pt-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-10">
             <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center space-y-2">
                <div className="bg-muted p-4 rounded-full">
                   <Info className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">
                  Welcome to the Hub. Be respectful. Messages are public to all students.
                </p>
             </div>

             {messages?.map((msg, i) => {
               const isMe = msg.senderId === user?.uid
               return (
                 <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                    <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                       <p className="text-[10px] font-bold text-muted-foreground">
                         {msg.senderName} 
                         <span className="text-primary/60 ml-1">({msg.senderRegNo})</span>
                       </p>
                       <span className="text-[8px] font-medium opacity-40">
                         {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : 'now'}
                       </span>
                    </div>
                    
                    <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                       <Avatar className="h-8 w-8 shrink-0 border shadow-sm">
                          <AvatarImage src={msg.senderPhoto} />
                          <AvatarFallback className="text-[10px] font-bold">{msg.senderName.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                         isMe 
                           ? 'bg-primary text-primary-foreground rounded-tr-none' 
                           : 'bg-white dark:bg-card border rounded-tl-none'
                       }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                       </div>
                    </div>
                 </div>
               )
             })}
             <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </main>

      {/* Input Area */}
      <div className="p-4 bg-background border-t pb-10 lg:pb-6">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2 relative">
          {!hasRegNo && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
               <Lock className="h-4 w-4 text-muted-foreground mr-2" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verify identity to chat</span>
            </div>
          )}
          <Input 
            placeholder="Type your message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!hasRegNo}
            className="rounded-2xl h-14 bg-muted/30 border-none px-6 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || !hasRegNo}
            className="h-14 w-14 rounded-2xl gradient-header shadow-lg shadow-primary/20 shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
