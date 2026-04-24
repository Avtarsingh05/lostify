
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Clock, ShieldCheck, Loader2, Package, Tag, Info, AlertTriangle, ShieldAlert, ChevronRight, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params)
  const router = useRouter()
  const db = useFirestore()

  const docRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "items", itemId)
  }, [db, itemId])

  const { data: item, isLoading } = useDoc(docRef)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-headline font-bold">Item Not Found</h2>
        <Button onClick={() => router.back()} variant="ghost">Go Back</Button>
      </div>
    )
  }

  const isResolved = item.status === 'Resolved' || item.status === 'Returned' || item.status === 'Delivered'
  const isFound = item.type === 'found'

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className={`${isFound ? 'gradient-success' : 'gradient-accent'} pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full active:scale-95"><ArrowLeft className="h-5 w-5" /></button>
          <Badge className="bg-white/20 text-white border-none font-bold uppercase tracking-widest text-[10px]">{item.status}</Badge>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-12 space-y-6">
        <Card className="rounded-[40px] overflow-hidden shadow-2xl border-none">
          <div className="aspect-[16/10] relative overflow-hidden bg-muted">
             <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
             <div className="absolute top-4 left-4">
                <Badge className={`${isFound ? 'bg-secondary' : 'bg-accent'} border-none shadow-xl font-bold uppercase tracking-widest`}>{item.type}</Badge>
             </div>
          </div>
          
          <CardContent className="p-8 space-y-8">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.category}</p>
               <h2 className="text-2xl font-headline font-bold leading-tight">{item.name}</h2>
            </div>

            <div className="flex gap-4">
               <div className="flex-1 bg-muted/30 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                  <p className="text-xs font-bold flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {item.locationDescription}</p>
               </div>
               <div className="flex-1 bg-muted/30 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Reported</p>
                  <p className="text-xs font-bold flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {formatDistanceToNow(new Date(item.reportedAt), { addSuffix: true })}</p>
               </div>
            </div>

            {isFound && !isResolved && (
              <div className="space-y-4">
                 <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-2xl"><ShieldCheck className="h-6 w-6 text-primary" /></div>
                    <div>
                       <h4 className="font-bold text-sm">Security Verification Required</h4>
                       <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">This item is held at the <strong>{item.storageOffice}</strong>. You must prove ownership via our quiz to generate a claim code.</p>
                    </div>
                 </div>
                 <Button onClick={() => router.push(`/items/${itemId}/claim`)} className="w-full h-16 rounded-[28px] gradient-header font-bold text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
                    <Zap className="h-6 w-6" /> Prove Ownership
                 </Button>
              </div>
            )}

            <div className="space-y-2">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Description</p>
               <p className="text-sm text-muted-foreground leading-relaxed bg-muted/10 p-4 rounded-2xl italic italic">"{item.description || "No description provided."}"</p>
            </div>

            <Button onClick={() => router.push(`/theft-report?itemId=${itemId}&type=${item.type}`)} variant="outline" className="w-full h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold uppercase text-[10px] gap-2">
               <ShieldAlert className="h-4 w-4" /> Report Suspicious Activity
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
