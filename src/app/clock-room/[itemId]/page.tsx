
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
  ChevronRight
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

  const activeOtp = isPending ? item.checkInCode : item.checkOutCode

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Digital Token</h1>
          </div>
          <Badge className={`backdrop-blur-md text-white border-none font-bold text-[8px] sm:text-[10px] ${isCollected ? 'bg-secondary/50' : 'bg-white/20'}`}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-video relative overflow-hidden bg-muted">
            <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
          </div>
          <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-headline font-bold truncate pr-4">{item.itemType}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                   <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
                     <Building className="h-3 w-3 text-primary" />
                     <span className={`text-[10px] sm:text-xs font-bold ${isPending ? 'text-accent' : isCollected ? 'text-secondary' : 'text-primary'}`}>
                       {isPending ? "Uni Mall Staging" : `Rack ${item.rackNumber}`}
                     </span>
                   </div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
            </div>

            <div className="bg-muted/30 p-4 sm:p-5 rounded-[24px] border border-dashed flex items-start gap-4">
               {isPending ? <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" /> : isCollected ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-secondary shrink-0" /> : <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
               <div className="space-y-1">
                 <p className="text-[11px] sm:text-xs font-bold leading-tight uppercase tracking-tight text-primary">
                   {isPending ? "Check-in Handshake" : isStored ? "Retrieval Handshake" : "Handover Complete"}
                 </p>
                 <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed italic">
                   {isPending 
                     ? "Show this code to the guard at Uni Mall reception to confirm storage." 
                     : isStored 
                     ? "Present this retrieval token to the guard when you collect your bag." 
                     : "This item has been successfully returned to the owner."}
                 </p>
               </div>
            </div>

            {!isCollected && (
              <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-[32px] border-2 border-dashed border-primary/20 gap-6">
                 <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
                   <QRCodeSVG value={activeOtp} size={140} />
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Secret Verification Pin</p>
                   <div className="bg-white px-8 py-3 rounded-2xl border shadow-sm border-primary/10">
                      <span className="text-3xl sm:text-4xl font-headline font-black text-primary tracking-[0.3em]">{activeOtp}</span>
                   </div>
                 </div>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t py-6 border-dashed">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Audit Timeline</p>
               <div className="space-y-3 bg-muted/20 p-5 rounded-[24px]">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground font-bold uppercase">Report Logged</span>
                    <span className="font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(item.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                  {item.storedAt && (
                    <div className="flex justify-between items-center text-[10px] border-t border-black/5 pt-3">
                      <span className="text-primary font-bold uppercase">Check-In Exact</span>
                      <span className="font-bold flex items-center gap-1.5"><Archive className="h-3 w-3" /> {format(new Date(item.storedAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  )}
                  {isCollected && item.collectedAt && (
                    <div className="flex justify-between items-center text-[10px] border-t border-black/5 pt-3">
                      <span className="text-secondary font-bold uppercase">Check-Out Exact</span>
                      <span className="font-bold flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> {format(new Date(item.collectedAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                  <div className="p-3 sm:p-4 bg-muted/20 rounded-2xl space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Verified By</p>
                    <p className="text-[10px] font-bold truncate">
                       <ShieldCheck className="h-2.5 w-2.5 text-primary inline mr-1" />
                       {item.storedBy || "Staff"}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/20 rounded-2xl space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Returns</p>
                    <p className="text-[10px] font-bold flex items-center gap-1">
                       <Calendar className="h-3 w-3 text-primary" />
                       {item.expectedReturnDate ? format(new Date(item.expectedReturnDate), 'MMM dd') : "N/A"}
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-dashed">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1">Security Answers</p>
               <div className="space-y-4 bg-muted/10 p-4 rounded-2xl italic text-[11px] leading-relaxed text-muted-foreground">
                  <div>
                    <span className="font-bold text-primary uppercase text-[8px] not-italic block mb-1">Unique Marks</span>
                    "{item.brandMarkings}"
                  </div>
                  <div className="border-t border-black/5 pt-3">
                    <span className="font-bold text-primary uppercase text-[8px] not-italic block mb-1">Contents Verification</span>
                    "{item.contentsVerification}"
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 pb-12 text-center space-y-1 opacity-40">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Verified Secure Handover Protocol</p>
          <p className="text-[7px] font-medium">Session UUID: {itemId}</p>
        </div>
      </main>
    </div>
  )
}
