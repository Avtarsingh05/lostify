
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  User, 
  Package, 
  Calendar,
  ShieldAlert,
  MapPin,
  Building
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useUser, 
  useDoc, 
  useMemoFirebase, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"

export default function HandoverVerification({ params }: { params: Promise<{ handoverId: string }> }) {
  const { handoverId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading: isAuthLoading } = useUser()
  
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handoverRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "handovers", handoverId)
  }, [db, handoverId])

  const { data: handover, isLoading: isHandoverLoading } = useDoc(handoverRef)

  const handleConfirm = async () => {
    if (!db || !handover || !user) return
    setIsConfirming(true)

    try {
      // 1. Update Handover Session
      const hRef = doc(db, "handovers", handoverId)
      updateDocumentNonBlocking(hRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userEmail: user.email,
        status: "completed",
        completedAt: new Date().toISOString()
      })

      // 2. Update Item Status
      const itemRef = doc(db, "items", handover.itemId)
      updateDocumentNonBlocking(itemRef, {
        status: "Resolved",
        claimerId: user.uid,
        resolvedBy: handover.guardName,
        resolvedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      })

      setIsSuccess(true)
      toast({
        title: "Item Received",
        description: "Your handover has been confirmed and logged."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Confirmation Failed",
        description: "Could not finalize handover. Please contact the guard."
      })
    } finally {
      setIsConfirming(false)
    }
  }

  if (isAuthLoading || isHandoverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!handover || handover.status === 'completed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
           <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-headline font-bold">Session Expired</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          This handover session is no longer active. Please ask the guard to initiate a new verification code.
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="rounded-xl px-8">Return Home</Button>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-secondary/20">
          <CheckCircle2 className="h-12 w-12 text-secondary" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-2">Item Received!</h2>
        <p className="text-muted-foreground text-sm mb-12 max-w-xs">
          Your collection has been securely logged. Thank you for using Lostify.
        </p>
        
        <Card className="w-full max-w-sm rounded-[32px] border-none shadow-xl bg-muted/20 p-6 space-y-4">
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold text-muted-foreground uppercase">Verified By</span>
             <span className="font-bold">{handover.guardName} (Guard)</span>
           </div>
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold text-muted-foreground uppercase">Session ID</span>
             <span className="font-mono">{handoverId.substring(0, 12)}</span>
           </div>
        </Card>

        <Button onClick={() => router.push("/dashboard")} className="mt-12 w-full max-w-sm h-14 rounded-2xl gradient-header font-bold shadow-xl">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Verify Collection</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Card className="rounded-[40px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-video relative overflow-hidden bg-muted">
             <Image src={handover.itemImageUrl} alt={handover.itemName} fill className="object-cover" />
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-headline font-bold leading-tight">{handover.itemName}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Item to be Handed Over</p>
               </div>
               <Badge className="bg-secondary/10 text-secondary border-none font-bold">In Handover</Badge>
            </div>

            <div className="space-y-4">
               <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student Information</p>
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user?.displayName || "University Student"}</p>
                      <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                    </div>
                 </div>
               </div>

               <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Handover Details</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Handed Over By</p>
                      <p className="text-[10px] font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-secondary" /> {handover.guardName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Timestamp</p>
                      <p className="text-[10px] font-bold flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" /> {format(new Date(), 'PPp')}</p>
                    </div>
                 </div>
               </div>
            </div>

            <Button 
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full h-16 rounded-[28px] gradient-header font-bold text-md shadow-xl flex items-center justify-center gap-2 mt-4"
            >
              {isConfirming ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm & Receive Item
                </>
              )}
            </Button>
            
            <p className="text-[9px] text-muted-foreground text-center px-4 leading-relaxed italic">
              By clicking confirm, you acknowledge that you have physically inspected and received the correct item from the guard.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
