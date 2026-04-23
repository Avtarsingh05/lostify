
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Loader2,
  Lock,
  Trash2,
  CheckCircle2,
  Calendar,
  CreditCard,
  UserCheck,
  Tag,
  Archive,
  Info,
  Building,
  QrCode,
  ArrowRightCircle,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"
import { QRCodeSVG } from "qrcode.react"

export default function ItemDetailsPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  
  const docRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "clockRoomItems", itemId)
  }, [db, itemId])

  const { data: item, isLoading } = useDoc(docRef)

  if (isLoading || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPending = item.status === 'pending_storage'
  const isStored = item.status === 'stored'
  const isCollected = item.status === 'collected'
  const isLocked = item.status === 'under_investigation'

  const activeOtp = isPending ? item.checkInCode : item.checkOutCode

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Digital Token</h1>
          </div>
          <Badge className={`backdrop-blur-md text-white border-none font-bold text-[8px] sm:text-[10px] ${isLocked ? 'bg-destructive' : isCollected ? 'bg-secondary/50' : 'bg-white/20'}`}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        {isLocked && (
          <Card className="bg-destructive/10 border-2 border-destructive rounded-3xl p-6 flex flex-col items-center text-center gap-3 animate-pulse">
             <ShieldAlert className="h-10 w-10 text-destructive" />
             <div className="space-y-1">
               <h3 className="font-headline font-bold text-destructive">ACCOUNT LOCKED</h3>
               <p className="text-[10px] text-destructive/80 font-bold uppercase leading-tight">This item is under security investigation due to a theft report. Token generation suspended.</p>
             </div>
          </Card>
        )}

        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-video relative overflow-hidden bg-muted">
            <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h2 className="text-2xl font-headline font-bold truncate pr-4">{item.itemType}</h2>
                <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20 w-fit mt-2">
                   <Building className="h-3 w-3 text-primary" />
                   <span className="text-[10px] font-bold text-primary">Rack {item.rackNumber}</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
            </div>

            {!isCollected && !isLocked && (
              <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-[32px] border-2 border-dashed border-primary/20 gap-6">
                 <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
                   <QRCodeSVG value={activeOtp} size={140} />
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Verification Pin</p>
                   <div className="bg-white px-8 py-3 rounded-2xl border shadow-sm border-primary/10">
                      <span className="text-4xl font-headline font-black text-primary tracking-[0.3em]">{activeOtp}</span>
                   </div>
                 </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-dashed">
               {!isLocked && !isCollected && (
                 <Button onClick={() => router.push(`/theft-report?itemId=${itemId}&type=clock`)} variant="outline" className="w-full h-14 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] tracking-widest gap-2">
                    <ShieldAlert className="h-4 w-4" /> Report Suspicious Activity
                 </Button>
               )}
               
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Audit Timeline</p>
               <div className="space-y-3 bg-muted/20 p-5 rounded-[24px]">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground font-bold uppercase">Report Logged</span>
                    <span className="font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(item.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                  {item.storedAt && (
                    <div className="flex justify-between items-center text-[10px] border-t border-black/5 pt-3">
                      <span className="text-primary font-bold uppercase">Stored On Rack</span>
                      <span className="font-bold flex items-center gap-1.5"><Archive className="h-3 w-3" /> {format(new Date(item.storedAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  )}
               </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
