
"use client"

import { useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2, Lock, Tag, MessageSquare, Zap, AlertTriangle, QrCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { QRCodeSVG } from "qrcode.react"

export default function ClaimVerificationPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [claimToken, setClaimToken] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const docRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "items", itemId)
  }, [db, itemId])

  const { data: item, isLoading } = useDoc(docRef)

  const verificationQs = useMemo(() => item?.verificationQuestions || [], [item])

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return
    setIsVerifying(true)

    try {
      // Basic scoring algorithm (exact match for now, could be enhanced with GenAI)
      let correct = 0
      verificationQs.forEach((q: any, idx: number) => {
        if (answers[idx]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
          correct++
        }
      })

      const finalScore = (correct / verificationQs.length) * 100
      setScore(finalScore)

      if (finalScore >= 70) {
        const code = Math.floor(1000 + Math.random() * 9000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60000).toISOString()

        await addDocumentNonBlocking(collection(db, "claims"), {
          itemId,
          userId: user.uid,
          answers,
          score: finalScore,
          claimCode: code,
          expiresAt,
          status: "approved",
          createdAt: new Date().toISOString()
        })

        setClaimToken(code)
        setStep(2)
        toast({ title: "Verification Passed!", description: "Show this code to the guard." })
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: "Your answers do not match our records." })
      }
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (!item || !verificationQs.length) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><AlertTriangle className="h-10 w-10 text-accent mb-4" /><h2 className="text-xl font-headline font-bold">Verification Unavailable</h2><Button onClick={() => router.back()} className="mt-4">Back</Button></div>

  if (step === 2 && claimToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-secondary/20">
           <CheckCircle2 className="h-12 w-12 text-secondary" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-2">Claim Code Issued</h2>
        <p className="text-muted-foreground text-sm mb-12 max-w-xs">
          Visit <strong>{item.storageOffice}</strong> within 15 minutes. Show this digital token to the campus guard.
        </p>
        
        <Card className="w-full max-w-sm rounded-[40px] border-none shadow-2xl bg-card p-10 flex flex-col items-center gap-8">
           <div className="p-4 bg-white rounded-3xl shadow-inner border">
              <QRCodeSVG value={claimToken} size={160} />
           </div>
           <div className="text-center space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Verification PIN</p>
              <div className="bg-primary/5 px-10 py-4 rounded-2xl border-2 border-dashed border-primary/20">
                 <span className="text-5xl font-mono font-black text-primary tracking-[0.4em]">{claimToken}</span>
              </div>
           </div>
        </Card>

        <p className="text-[10px] text-muted-foreground mt-12 font-bold uppercase tracking-widest flex items-center gap-2">
           <Lock className="h-3 w-3" /> Secure Handover Protocol Active
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mt-8">Return Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-headline font-bold">Ownership Quiz</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10">
        <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="pt-10 pb-2 flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
             </div>
             <div>
                <CardTitle className="font-headline font-bold text-xl">Identity Verification</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Score $\ge$ 70% required to claim</p>
             </div>
          </CardHeader>
          <CardContent className="p-10">
             <form onSubmit={handleQuizSubmit} className="space-y-8">
                {verificationQs.map((v: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                     <Label className="text-xs font-bold leading-relaxed">{v.question}</Label>
                     <Input 
                       value={answers[idx] || ""} 
                       onChange={(e) => {
                         const nextAnswers = [...answers]
                         nextAnswers[idx] = e.target.value
                         setAnswers(nextAnswers)
                       }}
                       placeholder="Your answer..." 
                       className="rounded-xl h-12 bg-muted/30 border-none shadow-none text-sm"
                       required
                     />
                  </div>
                ))}

                <Button type="submit" disabled={isVerifying || answers.length < verificationQs.length} className="w-full h-16 rounded-[24px] gradient-header font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                   {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Verify Answers</>}
                </Button>
             </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
