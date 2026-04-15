
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Phone, Video, MoreVertical, Paperclip, Smile, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useUser } from "@/firebase"

const initialMessages = [
  { id: 1, text: "Hi! I saw your post about the black wallet. I think I found it near the Central Park fountain.", sender: "received", time: "10:30 AM" },
  { id: 2, text: "Oh my god, thank you! Does it have a 'MK' logo on the front?", sender: "sent", time: "10:31 AM" },
  { id: 3, text: "Yes, it does. I also see a Metro card inside.", sender: "received", time: "10:32 AM" },
  { id: 4, text: "That's definitely mine. Where can we meet? I'd love to give you a reward.", sender: "sent", time: "10:33 AM" },
  { id: 5, text: "I'm currently at the Information Desk. You can come by anytime before 5 PM.", sender: "received", time: "10:35 AM" },
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
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <div className="gradient-header py-4 px-4 flex items-center justify-between shadow-xl z-10 text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src="https://picsum.photos/seed/finder/200/200" alt="Sarah J." />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-headline font-bold leading-tight">Sarah Jenkins</h2>
              <p className="text-[10px] text-white/70 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Phone className="h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity" />
          <Video className="h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity" />
          <MoreVertical className="h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="flex justify-center mb-4">
          <span className="bg-muted px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Conversation Securely Encrypted
          </span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`max-w-[80%] flex flex-col ${msg.sender === 'sent' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div className={`p-4 shadow-sm ${msg.sender === 'sent' ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
              <p className="text-sm font-medium">{msg.text}</p>
            </div>
            <span className={`text-[10px] text-muted-foreground mt-1 px-1 ${msg.sender === 'sent' ? 'text-right' : 'text-left'}`}>
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-card border-t flex items-center gap-3">
        <button className="p-2 text-muted-foreground hover:bg-muted rounded-full">
          <Paperclip className="h-6 w-6" />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-3 bg-muted rounded-2xl px-4 py-1">
          <Smile className="h-6 w-6 text-muted-foreground" />
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10"
          />
        </form>
        <button 
          onClick={() => handleSend()}
          className={`p-3 rounded-full transition-all ${newMessage.trim() ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground'}`}
        >
          <Send className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
