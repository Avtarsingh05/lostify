
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, HelpCircle, Mail, MessageCircle, FileText, Eye, ChevronRight, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HelpCenter() {
  const router = useRouter()

  const contactOptions = [
    {
      icon: Mail,
      label: "Email Support",
      value: "forigloohelp@gmail.com",
      href: "mailto:forigloohelp@gmail.com",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Phone,
      label: "WhatsApp Support",
      value: "+91 90136 18694",
      href: "https://wa.me/919013618694",
      color: "text-green-500",
      bg: "bg-green-500/10"
    }
  ]

  const legalOptions = [
    {
      icon: FileText,
      label: "Terms of Service",
      description: "Read our rules and regulations",
      href: "/terms"
    },
    {
      icon: Eye,
      label: "Privacy Policy",
      description: "How we handle your data",
      href: "/privacy"
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Help Center</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="pb-2 pt-8 px-6">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" /> Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {contactOptions.map((option, i) => (
              <a 
                key={i} 
                href={option.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`${option.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                    <option.icon className={`h-5 w-5 ${option.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold font-headline">{option.label}</p>
                    <p className="text-[10px] text-muted-foreground">{option.value}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Legal & Compliance</h3>
          <Card className="border-none shadow-lg rounded-[28px] overflow-hidden">
            <CardContent className="p-2 space-y-1">
              {legalOptions.map((option, i) => (
                <div 
                  key={i}
                  onClick={() => router.push(option.href)}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer rounded-2xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                      <option.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-headline">{option.label}</p>
                      <p className="text-[9px] text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <div className="text-center py-6">
          <p className="text-[10px] text-muted-foreground">Version 1.0.4 - Built for Campus Recovery</p>
        </div>
      </main>
    </div>
  )
}
