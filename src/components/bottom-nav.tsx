
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MapPin, Plus, Package, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: MapPin, label: "Map", href: "/map" },
  { icon: Plus, label: "Report", href: "/report-lost", central: true },
  { icon: Package, label: "My Items", href: "/my-items" },
  { icon: MessageCircle, label: "Chat", href: "/chat" },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide navigation on the chat screen as it has its own input bar
  if (pathname === '/chat') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none">
      <nav className="max-w-lg mx-auto h-16 bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] rounded-[24px] flex items-center justify-around px-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.central) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-8 flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full gradient-header shadow-2xl shadow-primary/40 flex items-center justify-center text-white ring-8 ring-background group-hover:scale-110 transition-transform duration-300">
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
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3 py-1 rounded-xl",
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
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-in zoom-in duration-300" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
