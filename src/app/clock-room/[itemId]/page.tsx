
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Download,
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
  Building
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { format } from "date-fns"
import { QRCodeSVG } from "qrcode.react"
import { useToast } from "@/hooks/use-toast"

export default function ItemDetailsPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isCollectOpen, setIsCollectOpen] = useState(false)
  const [otpInput, setOtpInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const docRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "clockRoomItems", itemId)
  }, [db, itemId])

  const { data: item, isLoading } = useDoc(docRef)

  const handleCollect = async () => {
    if (!item || !db) return
    if (otpInput !== item.otp) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please check the OTP on this screen." })
      return
    }

    setIsProcessing(true)
    const itemRef = doc(db, "clockRoomItems", item.id)
    updateDocumentNonBlocking(itemRef, {
      status: "collected",
      collectedAt: new Date().toISOString()
    })

    setTimeout(() => {
      setIsProcessing(false)
      setIsCollectOpen(false)
      toast({ title: "Item Checked-out Successfully" })
      router.push("/clock-room")
    }, 1500)
  }

  if (isLoading || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isStored = item.status === 'stored'
  const isAwaitingRack = item.slotNumber === 'Reception'

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-headline font-bold">Storage Receipt</h1>
          </div>
          <Badge className="bg-white/20 text-white border-none font-bold">
            {item.status.toUpperCase()}
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
                <div className="flex items-center gap-2 mt-1">
                   <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
                     <Building className="h-3.5 w-3.5 text-primary" />
                     <span className={`text-xs font-bold ${isAwaitingRack ? 'text-accent' : 'text-primary'}`}>
                       {isAwaitingRack ? "Uni Mall (Reception)" : `Rack ${item.rackNumber}, Slot ${item.slotNumber}`}
                     </span>
                   </div>
                </div>
                {item.registrationNumber && (
                  <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-3">
                    <CreditCard className="h-3.5 w-3.5" /> Student Reg: {item.registrationNumber}
                  </p>
                )}
              </div>
              <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: item.color }} />
            </div>

            {isAwaitingRack && (
              <div className="bg-accent/10 p-4 rounded-2xl border border-accent/20 flex items-start gap-3">
                 <Info className="h-5 w-5 text-accent shrink-0" />
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   <strong>Processing:</strong> A guard is currently placing your item in a secure rack. Your storage location will update here automatically.
                 </p>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-b py-6 border-dashed">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verification Details</p>
               <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Markings / Brand</p>
                      <p className="text-xs font-bold">{item.brandMarkings || "Standard item"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Archive className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Stored Contents</p>
                      <p className="text-xs font-bold italic">"{item.contentsVerification}"</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-[32px] border-2 border-dashed gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-xl">
                 <QRCodeSVG value={`lostify-luggage-${item.id}`} size={160} />
               </div>
               <div className="text-center space-y-1">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Token ID</p>
                 <p className="text-xs font-mono font-bold">{item.id.substring(0, 12)}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">Check-in Date</p>
                 <p className="text-[10px] font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
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

            {item.collectedAt && (
              <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20 space-y-1">
                <p className="text-[8px] font-bold text-secondary uppercase">Check-out Date</p>
                <p className="text-[10px] font-bold flex items-center gap-1">
                   <UserCheck className="h-3 w-3 text-secondary" />
                   {format(new Date(item.collectedAt), 'MMM dd, HH:mm')}
                </p>
              </div>
            )}

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Lock className="h-5 w-5 text-primary" />
                 <div>
                   <p className="text-xs font-bold">Release OTP</p>
                   <p className="text-[10px] text-muted-foreground">Show this to the guard</p>
                 </div>
               </div>
               <span className="text-2xl font-headline font-bold text-primary tracking-widest">{item.otp}</span>
            </div>

            {isStored && (
              <Button 
                onClick={() => setIsCollectOpen(true)}
                className="w-full h-14 rounded-2xl gradient-header font-bold text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" /> Confirm Check-out
              </Button>
            )}

            {!isStored && (
              <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 flex items-center gap-3">
                 <CheckCircle2 className="h-6 w-6 text-secondary" />
                 <div>
                    <p className="text-xs font-bold text-secondary">Collected & Checked-out</p>
                    <p className="text-[10px] text-muted-foreground">
                      Retrieval logged successfully.
                    </p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCollectOpen} onOpenChange={setIsCollectOpen}>
        <DialogContent className="max-w-[400px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Check-out Verification
            </DialogTitle>
            <DialogDescription className="text-sm">
              Enter the 4-digit OTP shown on your storage receipt to confirm the retrieval and check-out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification OTP</Label>
              <Input 
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="0000"
                maxLength={4}
                className="rounded-xl h-14 text-center text-2xl font-bold tracking-[1em]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCollect}
              disabled={isProcessing || otpInput.length < 4}
              className="w-full h-14 rounded-xl gradient-header font-bold text-sm"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
