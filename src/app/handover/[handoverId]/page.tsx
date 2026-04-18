
"use client"

import { useState, use, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Building,
  Phone,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Archive,
  Tag,
  Clock
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
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading: isAuthLoading } = useUser()
  
  const isClockRoom = searchParams.get('type') === 'clock'
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [mountedTime, setMountedTime] = useState<string | null>(null)

  useEffect(() => {
    setMountedTime(format(new Date(), 'HH:mm:ss'))
  }, [])

  // Fetch handover details
  const handoverRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, isClockRoom ? "clockRoomHandovers" : "handovers", handoverId)
  }, [db, handoverId, isClockRoom])

  const { data: handover, isLoading: isHandoverLoading } = useDoc(handoverRef)

  // Fetch associated item (only if handover exists)
  const itemRef = useMemoFirebase(() => {
    if (!db || !handover?.itemId) return null
    return doc(db, isClockRoom ? "clockRoomItems" : "items", handover.itemId)
  }, [db, handover?.itemId, isClockRoom])

  const { data: item, isLoading: isItemLoading } = useDoc(itemRef)

  // Fetch student profile (if different from current user, for verification summary)
  const studentRef = useMemoFirebase(() => {
    if (!db || !handover?.userId) return null
    return doc(db, "users", handover.userId)
  }, [db, handover?.userId])

  const { data: studentData } = useDoc(studentRef)

  const handleConfirm = async () => {
    if (!db || !handover || !user || !item) return
    setIsConfirming(true)

    try {
      // 1. Update Handover Session
      const hRef = doc(db, isClockRoom ? "clockRoomHandovers" : "handovers", handoverId)
      updateDocumentNonBlocking(hRef, {
        status: "completed",
        completedAt: new Date().toISOString()
      })

      // 2. Update Item Status
      const targetItemRef = doc(db, isClockRoom ? "clockRoomItems" : "items", handover.itemId)
      if (isClockRoom) {
        updateDocumentNonBlocking(targetItemRef, {
          status: "collected",
          collectedAt: new Date().toISOString()
        })
      } else {
        updateDocumentNonBlocking(targetItemRef, {
          status: "Resolved",
          claimerId: user.uid,
          resolvedBy: handover.guardName,
          resolvedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        })
      }

      setIsSuccess(true)
      toast({
        title: "Pickup confirmed",
        description: "Your collection has been securely logged."
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

  if (isAuthLoading || isHandoverLoading || isItemLoading) {
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
        <h2 className="text-3xl font-headline font-bold mb-2">Luggage collected successfully</h2>
        <p className="text-muted-foreground text-sm mb-12 max-w-xs">
          Your retrieval has been securely logged. Safe travels!
        </p>
        
        <Card className="w-full max-w-sm rounded-[32px] border-none shadow-xl bg-muted/20 p-6 space-y-4">
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold text-muted-foreground uppercase">Verified By</span>
             <span className="font-bold">{handover.guardName} (Guard)</span>
           </div>
           <div className="flex justify-between items-center text-xs">
             <span className="font-bold text-muted-foreground uppercase">Guard ID</span>
             <span className="font-mono">{handover.guardId.substring(0, 10).toUpperCase()}</span>
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
             <Image src={item?.imageUrl || handover.itemImageUrl} alt="Pickup Item" fill className="object-cover" />
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-headline font-bold leading-tight">{isClockRoom ? item?.itemType : handover.itemName}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                   {isClockRoom ? "Luggage Storage Pickup" : "Item Handover"}
                 </p>
               </div>
               <Badge className="bg-orange-500 text-white border-none font-bold">IN VERIFICATION</Badge>
            </div>

            <div className="space-y-6">
               {/* --- STUDENT INFO --- */}
               <div className="bg-muted/30 p-5 rounded-2xl space-y-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student Information</p>
                 <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-bold leading-tight">{studentData?.username || user?.displayName || "Student"}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] font-bold flex items-center gap-1.5 text-muted-foreground">
                          <CreditCard className="h-3 w-3" /> {studentData?.registrationNumber || "N/A"}
                        </p>
                        <p className="text-[10px] font-bold flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {studentData?.phoneNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                 </div>
               </div>

               {/* --- LUGGAGE / STORAGE INFO --- */}
               {isClockRoom && item && (
                 <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl space-y-4">
                   <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Verification Details</p>
                   
                   <div className="grid grid-cols-2 gap-4 pb-2">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Location</p>
                        <p className="text-sm font-bold flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-500" /> Rack {item.rackNumber}, Slot {item.slotNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Stored Since</p>
                        <p className="text-sm font-bold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-orange-500" /> {format(new Date(item.createdAt), 'MMM dd')}</p>
                      </div>
                   </div>

                   <div className="space-y-3 pt-2 border-t border-orange-500/10">
                      <div className="space-y-1">
                         <p className="text-[8px] font-bold text-muted-foreground uppercase">Unique Markings</p>
                         <p className="text-xs font-bold text-orange-600 flex items-center gap-2"><Tag className="h-3 w-3" /> {item.brandMarkings || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-bold text-muted-foreground uppercase">Internal Contents</p>
                         <p className="text-xs font-bold text-orange-600 flex items-start gap-2 bg-white/50 p-2 rounded-xl italic">
                           <Archive className="h-3 w-3 mt-0.5 shrink-0" /> "{item.contentsVerification}"
                         </p>
                      </div>
                   </div>
                 </div>
               )}

               <div className="bg-muted/30 p-5 rounded-2xl space-y-3">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Handover Session</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Verified By (Guard)</p>
                      <p className="text-[10px] font-bold flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-secondary" /> {handover.guardName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Timestamp</p>
                      <p className="text-[10px] font-bold flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary" /> 
                        {mountedTime || '--:--:--'}
                      </p>
                    </div>
                 </div>
               </div>
            </div>

            <Button 
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full h-16 rounded-[28px] gradient-header font-bold text-lg shadow-xl flex items-center justify-center gap-3 mt-4 active:scale-95 transition-transform"
            >
              {isConfirming ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Briefcase className="h-5 w-5" />
                  Confirm Pickup
                </>
              )}
            </Button>
            
            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                By clicking confirm, you acknowledge physical inspection and receipt of your luggage. This action is final and will be logged in the campus security audit trail.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
