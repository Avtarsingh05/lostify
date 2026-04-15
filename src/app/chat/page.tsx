
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Loader2, 
  MessageCircle,
  User as UserIcon,
  Clock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"

export default function ChatScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Conversations - Robust query filtered by participant ID
  const chatsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "chats"),
      where("participantIds", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    )
  }, [db, user])

  const { data: conversations, isLoading: isChatsLoading } = useCollection(chatsQuery)

  // 2. Fetch Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !activeChatId) return null
    return query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("sentAt", "asc")
    )
  }, [db, activeChatId])

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !activeChatId || !user || !db) return

    const messageData = {
      chatId: activeChatId,
      senderId: user.uid,
      content: newMessage.trim(),
      sentAt: new Date().toISOString()
    }

    const chatRef = doc(db, "chats", activeChatId)
    const messagesRef = collection(db, "chats", activeChatId, "messages")

    addDocumentNonBlocking(messagesRef, messageData)
    updateDocumentNonBlocking(chatRef, { lastMessageAt: new Date().toISOString() })
    setNewMessage("")
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!activeChatId) {
    return (
      <div className="flex flex-col h-screen bg-background pb-safe">
        <div className="gradient-header py-6 px-4 shadow-lg text-white shrink-0 rounded-b-[32px]">
          <div className="flex items-center gap-3 mb-2">
             <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full">
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h1 className="text-xl font-headline font-bold">Inbox</h1>
          </div>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest px-1">Verified Encrypted Chats</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {isChatsLoading ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((chat) => {
              const otherId = chat.participantIds.find((id: string) => id !== user.uid)
              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className="bg-card p-4 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${otherId}/200/200`} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-headline font-bold truncate">LPU Recovery Chat</h3>
                      <span className="text-[8px] text-muted-foreground font-bold">
                        {chat.lastMessageAt ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true }) : "new"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">Open thread to view messages</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-12">
              <MessageCircle className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-bold font-headline">No chats found</p>
              <p className="text-[10px] mt-1 text-muted-foreground">Matches will appear here after contact.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-safe">
      <div className="gradient-header py-3 px-3 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveChatId(null)} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://picsum.photos/seed/${activeChatId}/200/200`} />
              <AvatarFallback><UserIcon /></AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-headline font-bold text-sm truncate leading-tight">Support / Match</h2>
              <p className="text-[9px] text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Secure Line
              </p>
            </div>
          </div>
        </div>
        <Phone className="h-4 w-4" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isMessagesLoading ? (
           <div className="flex justify-center p-10 opacity-20"><Loader2 className="animate-spin" /></div>
        ) : messages?.map((msg) => {
          const isMe = msg.senderId === user.uid
          return (
            <div key={msg.id} className={`max-w-[85%] flex flex-col ${isMe ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`px-4 py-2.5 shadow-sm text-sm ${isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                <p>{msg.content}</p>
              </div>
              <span className={`text-[8px] text-muted-foreground mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
              </span>
            </div>
          )
        })}
      </div>

      <div className="p-3 bg-card border-t flex items-center gap-2">
        <button className="p-2 text-muted-foreground"><Paperclip className="h-5 w-5" /></button>
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 bg-muted rounded-2xl px-3 h-10">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-full text-xs p-0"
          />
        </form>
        <button onClick={() => handleSend()} className={`p-2.5 rounded-full ${newMessage.trim() ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
