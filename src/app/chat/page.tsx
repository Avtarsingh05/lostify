
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Phone, Video, MoreVertical, Paperclip, Smile, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useUser } from "@/firebase"

const initialMessages = [
  { id: 1, text: "Hi! I think I found your black MK wallet near the fountain.", sender: "received", time: "10:30 AM" },
  { id: 2, text: "Oh thank god! Does it have a Metro card inside?", sender: "sent", time: "10:31 AM" },
  { id: 3, text: "Yes, exactly. I'm currently at the Library Security desk.", sender: "received", time: "10:32 AM" },
  { id: 4, text: "I'm coming now! I'd love to give you a small reward.", sender: "sent", time: "10:33 AM" },
]

export default function ChatScreen() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

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
    if (!newMessage.trim()) return

    const msg = {
      id: Date.now(),
      text: newMessage,
      sender: "sent",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, msg])
    setNewMessage("")
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Mobile Chat Header */}
      <div className="gradient-header py-3 px-3 flex items-center justify-between shadow-lg z-10 text-white shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1 active:scale-90 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-white/20">
              <AvatarImage src="https://picsum.photos/seed/finder/200/200" alt="Sarah J." />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-headline font-bold text-sm leading-tight truncate">Sarah Jenkins</h2>
              <p className="text-[9px] text-white/70 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 cursor-pointer hover:opacity-70" />
          <MoreVertical className="h-4 w-4 cursor-pointer hover:opacity-70" />
        </div>
      </div>

      {/* Messages Area - Compact */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="flex justify-center mb-2">
          <span className="bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-muted-foreground border border-black/5">
            End-to-End Encrypted
          </span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`max-w-[85%] flex flex-col ${msg.sender === 'sent' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div className={`px-4 py-2.5 shadow-sm text-sm font-medium ${msg.sender === 'sent' ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
              <p>{msg.text}</p>
            </div>
            <span className={`text-[9px] text-muted-foreground mt-1 px-1 ${msg.sender === 'sent' ? 'text-right' : 'text-left'}`}>
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Compact Input Bar for Mobile */}
      <div className="p-3 bg-card border-t flex items-center gap-2 shrink-0 pb-safe">
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
          onClick={() => handleSend()}
          className={`p-2.5 rounded-full transition-all active:scale-90 ${newMessage.trim() ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
