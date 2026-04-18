
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
  ArrowRightCircle
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
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Digital Token</h1>
          </div>
          <Badge className="bg-white/20 text-white border-none font-bold">
            {item.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-video relative overflow-hidden">
            <Image src={item.imageUrl} alt={item.itemType} fill className="object-cover" />
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-headline font-bold">{item.itemType}</h2>
                <div className="flex items-center gap-2 mt-2">
                   <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
                     <Building className="h-3.5 w-3.5 text-primary" />
                     <span className={`text-xs font-bold ${isPending ? 'text-accent' : 'text-primary'}`}>
                       {isPending ? "Uni Mall (Reception)" : `Rack ${item.rackNumber}, Slot ${item.slotNumber}`}
                     </span>
                   </div>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: item.color }} />
            </div>

            {/* Instruction Logic */}
            <div className="bg-muted/30 p-5 rounded-3xl border border-dashed flex items-start gap-4">
               {isPending ? <QrCode className="h-6 w-6 text-accent shrink-0" /> : <ShieldCheck className="h-6 w-6 text-primary shrink-0" />}
               <div className="space-y-1">
                 <p className="text-xs font-bold leading-tight">
                   {isPending ? "Step 1: Check-in Handshake" : isStored ? "Step 2: Retrieval Handshake" : "Process Complete"}
                 </p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   {isPending 
                     ? "Show this code to the guard at Uni Mall to confirm physical storage and assign your rack." 
                     : isStored 
                     ? "Show this code to retrieval when you want your bag back. The guard will verify your contents list." 
                     : "This item has been returned and the token is now expired."}
                 </p>
               </div>
            </div>

            {!isCollected && (
              <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-[32px] border-2 border-dashed border-primary/20 gap-4">
                 <div className="bg-white p-4 rounded-2xl shadow-xl">
                   <QRCodeSVG value={activeOtp} size={160} />
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Verification Token</p>
                   <div className="bg-white px-8 py-3 rounded-2xl border shadow-sm">
                      <span className="text-3xl font-headline font-black text-primary tracking-[0.3em]">{activeOtp}</span>
                   </div>
                 </div>
              </div>
            )}

            {isCollected && (
              <div className="py-12 text-center space-y-4">
                 <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="h-10 w-10 text-secondary" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-lg font-headline font-bold">Successfully Collected</p>
                    <p className="text-xs text-muted-foreground">Logged at: {format(new Date(item.collectedAt), 'MMM dd, HH:mm')}</p>
                 </div>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t py-6 border-dashed">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Storage Record</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Check-in</p>
                    <p className="text-[10px] font-bold flex items-center gap-1">
                       <Calendar className="h-3 w-3 text-primary" />
                       {format(new Date(item.createdAt), 'MMM dd')}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Expected Return</p>
                    <p className="text-[10px] font-bold flex items-center gap-1">
                       <Clock className="h-3 w-3 text-primary" />
                       {item.expectedReturnDate ? format(new Date(item.expectedReturnDate), 'MMM dd') : "N/A"}
                    </p>
                  </div>
               </div>
               {item.registrationNumber && (
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 px-1">
                    <CreditCard className="h-3 w-3" /> Reg: {item.registrationNumber}
                  </p>
               )}
            </div>
          </CardContent>
        </Card>

        <div className="pt-8 pb-8 text-center space-y-1 opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Lostify Protocol v4.0</p>
          <p className="text-[8px] font-medium">Digital Signature: {itemId.substring(0, 10)}</p>
        </div>
      </main>
    </div>
  )
}
