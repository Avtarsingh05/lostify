
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
import { collection, query, where, orderBy, doc, Timestamp, serverTimestamp } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"

export default function ChatScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Conversations
  const chatsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "chats"),
      where("participantIds", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    )
  }, [db, user])

  const { data: conversations, isLoading: isChatsLoading } = useCollection(chatsQuery)

  // 2. Fetch Messages for active chat
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

    // Send message
    addDocumentNonBlocking(messagesRef, messageData)
    
    // Update last message timestamp in chat doc
    updateDocumentNonBlocking(chatRef, {
      lastMessageAt: new Date().toISOString()
    })

    setNewMessage("")
  }

  const activeChat = useMemo(() => {
    return conversations?.find(c => c.id === activeChatId)
  }, [conversations, activeChatId])

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Conversation List View
  if (!activeChatId) {
    return (
      <div className="flex flex-col h-screen bg-background pb-safe">
        <div className="gradient-header py-6 px-4 shadow-lg text-white shrink-0 rounded-b-[32px]">
          <div className="flex items-center gap-3 mb-2">
             <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full active:scale-90 transition-transform">
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h1 className="text-xl font-headline font-bold">Messages</h1>
          </div>
          <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest px-1">Recent Conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {isChatsLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading Chats...</p>
            </div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((chat) => {
              const otherId = chat.participantIds.find((id: string) => id !== user.uid)
              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className="bg-card p-4 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={`https://picsum.photos/seed/${otherId}/200/200`} />
                    <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-headline font-bold truncate">Item Recovery Chat</h3>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {chat.lastMessageAt ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true }) : "just now"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">Click to view messages</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-12">
              <MessageCircle className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-bold font-headline">No conversations yet</p>
              <p className="text-[10px] mt-1 text-muted-foreground">Start a chat from an item profile or search results.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Individual Chat Thread View
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-safe">
      {/* Header */}
      <div className="gradient-header py-3 px-3 flex items-center justify-between shadow-lg z-10 text-white shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveChatId(null)} className="p-1 active:scale-90 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-white/20">
              <AvatarImage src={`https://picsum.photos/seed/${activeChatId}/200/200`} />
              <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-headline font-bold text-sm leading-tight truncate">Support Agent</h2>
              <p className="text-[9px] text-white/70 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Connected
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 cursor-pointer hover:opacity-70" />
          <MoreVertical className="h-4 w-4 cursor-pointer hover:opacity-70" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="flex justify-center mb-2">
          <span className="bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-muted-foreground border border-black/5">
            End-to-End Encrypted
          </span>
        </div>

        {isMessagesLoading ? (
           <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" />
           </div>
        ) : messages?.map((msg) => {
          const isMe = msg.senderId === user.uid
          return (
            <div 
              key={msg.id} 
              className={`max-w-[85%] flex flex-col ${isMe ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className={`px-4 py-2.5 shadow-sm text-sm font-medium ${isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                <p>{msg.content}</p>
              </div>
              <span className={`text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <Clock className="h-2 w-2" />
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
              </span>
            </div>
          )
        })}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-card border-t flex items-center gap-2 shrink-0">
        <button className="p-2 text-muted-foreground hover:bg-muted rounded-full active:scale-95">
          <Paperclip className="h-5 w-5" />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 bg-muted rounded-2xl px-3 h-10">
          <Smile className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-full text-xs p-0"
          />
        </form>
        <button 
          type="submit"
          onClick={() => handleSend()}
          className={`p-2.5 rounded-full transition-all active:scale-90 ${newMessage.trim() ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
