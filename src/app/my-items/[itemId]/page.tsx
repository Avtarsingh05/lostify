
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Package, 
  User, 
  Calendar,
  Building,
  CheckCircle2,
  Info,
  ShieldAlert
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"

export default function ItemDetailsPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params)
  const router = useRouter()
  const db = useFirestore()

  const docRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "items", itemId)
  }, [db, itemId])

  const { data: item, isLoading } = useDoc(docRef)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-headline font-bold">Item Not Found</h2>
        <button onClick={() => router.back()} className="text-primary font-bold uppercase text-[10px] tracking-widest">Go Back</button>
      </div>
    )
  }

  const isResolved = item.status === 'Resolved' || item.status === 'Returned' || item.status === 'Claimed'
  const isInvestigating = item.status === 'Under Investigation'

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Audit Tracker</h1>
          </div>
          <Badge className={`${isInvestigating ? 'bg-destructive' : 'bg-white/20'} text-white border-none font-bold uppercase tracking-widest text-[10px]`}>
            {item.status}
          </Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-12 space-y-4">
        <Card className="rounded-[40px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-[16/10] relative overflow-hidden bg-muted">
             <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
             <div className="absolute top-4 left-4">
                <Badge className={`${item.type === 'lost' ? 'bg-accent' : 'bg-secondary'} border-none shadow-xl font-bold uppercase tracking-widest`}>
                   {item.type} Item
                </Badge>
             </div>
          </div>
          
          <CardContent className="p-8 space-y-8">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.category}</p>
               <h2 className="text-2xl font-headline font-bold leading-tight">{item.name}</h2>
            </div>

            {!isResolved && !isInvestigating && (
               <Button onClick={() => router.push(`/theft-report?itemId=${itemId}&type=lost`)} variant="outline" className="w-full h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] gap-2">
                 <ShieldAlert className="h-4 w-4" /> Report Suspicious Listing
               </Button>
            )}

            <div className="bg-muted/30 p-5 rounded-[24px] space-y-3">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Report Context</p>
               <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{item.locationDescription}</p>
                    <p className="text-[10px] text-muted-foreground">Original report site</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Security Audit</h3>
               <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl"><ShieldCheck className="h-4 w-4 text-primary" /></div>
                    <div>
                       <p className="text-[8px] font-bold uppercase text-muted-foreground">Verified By</p>
                       <p className="text-xs font-bold">{item.verifiedBy || "Campus Personnel"}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Description</p>
               <p className="text-sm text-muted-foreground leading-relaxed bg-muted/10 p-4 rounded-2xl italic">
                 "{item.description || "No metadata provided."}"
               </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
