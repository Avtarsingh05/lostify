
"use client"

import { useState } from "react"
import { useRouter } from "navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { collection, query, where, limit, getDocs } from "firebase/firestore"

export default function HandoverEntry() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4 || !db) return

    setIsVerifying(true)
    try {
      // Check general handovers first
      const handoversRef = collection(db, "handovers")
      const q = query(
        handoversRef, 
        where("verificationCode", "==", code),
        where("status", "==", "pending"),
        limit(1)
      )
      
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        router.push(`/handover/${snapshot.docs[0].id}`)
        return
      }

      // Check clock room handovers if not found in general
      const clockHandoversRef = collection(db, "clockRoomHandovers")
      const qClock = query(
        clockHandoversRef,
        where("verificationCode", "==", code),
        where("status", "==", "pending"),
        limit(1)
      )
      
      const clockSnapshot = await getDocs(qClock)

      if (!clockSnapshot.empty) {
        router.push(`/handover/${clockSnapshot.docs[0].id}?type=clock`)
        return
      }

      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "This code is incorrect or has already expired."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Something went wrong. Please try again."
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Secure Handover</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="pt-10 pb-2 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline font-bold text-xl">Identity Verification</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Enter the 4-digit code shown by the guard</p>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center block">Handover Token</Label>
                <Input 
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  maxLength={4}
                  className="rounded-3xl h-20 text-center text-5xl font-mono font-bold tracking-[0.2em] border-primary/20 bg-muted/30 focus-visible:ring-primary focus-visible:bg-background transition-all"
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                disabled={isVerifying || code.length < 4}
                className="w-full h-16 rounded-[28px] gradient-header font-bold text-md shadow-xl flex items-center justify-center gap-2 group"
              >
                {isVerifying ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="bg-muted/30 p-6 rounded-[32px] border border-dashed flex items-start gap-4">
               <Smartphone className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-xs font-bold leading-tight">Digital Handover Protocol</p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   This process ensures that the item is returned to the correct owner. Your campus registration and contact details will be logged for security purposes.
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-8 text-center space-y-1 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Recovery Layer v2.0</p>
          <p className="text-[9px] font-medium">Powered by Lostify Security</p>
        </div>
      </main>
    </div>
  )
}
