"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MapPin, Plus, Settings, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: MapPin, label: "Map", href: "/map" },
  { icon: Plus, label: "Report", href: "/report-lost", central: true },
  { icon: MessageCircle, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide navigation on the chat screen or login screen
  if (pathname === '/chat' || pathname === '/') return null

  return (
    <div className="fixed bottom-10 left-0 right-0 z-50 px-6 pointer-events-none">
      <nav className="max-w-[420px] mx-auto h-18 py-3 bg-white/85 dark:bg-card/85 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-[32px] flex items-center justify-around px-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.central) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-10 flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full gradient-header shadow-2xl shadow-primary/40 flex items-center justify-center text-white ring-8 ring-background group-hover:scale-110 active:scale-95 transition-all duration-300">
                  <Icon className="h-8 w-8" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 px-3 py-1 rounded-2xl",
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 animate-in zoom-in duration-300" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
