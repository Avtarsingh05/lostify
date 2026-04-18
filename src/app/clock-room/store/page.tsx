
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Camera, 
  Loader2, 
  Send, 
  Calendar,
  Tag,
  Info,
  CheckCircle2,
  Package,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertCircle,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import Image from "next/image"

export default function StoreItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [itemType, setItemType] = useState("")
  const [color, setColor] = useState("")
  const [description, setDescription] = useState("")
  const [returnDate, setReturnDate] = useState("")
  
  const [contentsVerification, setContentsVerification] = useState("")
  const [itemCondition, setItemCondition] = useState("")
  const [brandMarkings, setBrandMarkings] = useState("")
  
  const [isSuccess, setIsSuccess] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userDocRef)

  useEffect(() => {
    if (userData?.registrationNumber) {
      setRegistrationNumber(userData.registrationNumber)
    }
  }, [userData])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUri = reader.result as string
      setPreviewImage(dataUri)
      toast({ title: "Photo Attached", description: "Identity verified via snapshot." })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !previewImage) {
      toast({ variant: "destructive", title: "Missing Photo", description: "Please snap a photo of the luggage first." })
      return
    }

    setIsSubmitting(true)
    
    // Generate unique codes for both stages
    const checkInCode = Math.floor(1000 + Math.random() * 9000).toString()
    const checkOutCode = Math.floor(1000 + Math.random() * 9000).toString()

    const itemData = {
      userId: user.uid,
      registrationNumber,
      itemType,
      color,
      description,
      contentsVerification,
      itemCondition,
      brandMarkings,
      imageUrl: previewImage,
      rackNumber: "Awaiting Assignment",
      slotNumber: "Reception",
      status: "pending_storage", // Initial status
      checkInCode,
      checkOutCode,
      expectedReturnDate: returnDate ? new Date(returnDate).toISOString() : null,
      createdAt: new Date().toISOString(),
    }

    try {
      await addDocumentNonBlocking(collection(db, "clockRoomItems"), itemData)
      setIsSuccess(true)
      toast({ title: "Draft Created", description: "Please show your Check-in Code to the guard." })
      setTimeout(() => router.push("/clock-room"), 2500)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 shadow-xl shadow-primary/20">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-2">Form Submitted</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Your request is logged. Go to the Uni Mall reception and show your digital check-in token to the guard.
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[48px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Secure Check-in</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="rounded-[40px] overflow-hidden shadow-2xl border-none">
          <CardContent className="p-6 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[16/10] rounded-[28px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Luggage" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="bg-white/90 p-3 rounded-2xl shadow-xl text-primary font-bold text-xs">Tap to Change Photo</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-card p-5 rounded-full shadow-xl">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Snapshot Luggage</p>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Student Identity
                </p>
                <div className="relative">
                  <Input 
                    placeholder="University Registration No." 
                    className="rounded-2xl h-14 pl-12 bg-muted/20 border-none focus-visible:ring-1" 
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    required 
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Package className="h-3 w-3" /> Basic Description
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <Input 
                      placeholder="Bag Type (e.g. Suitcase, Duffle)" 
                      className="rounded-2xl h-14 pl-12 bg-muted/20 border-none focus-visible:ring-1" 
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      required 
                    />
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input 
                        placeholder="Color" 
                        className="rounded-2xl h-14 pl-12 bg-muted/20 border-none focus-visible:ring-1" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        required 
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border shadow-sm" style={{ backgroundColor: color || '#ccc' }} />
                    </div>
                    <div className="relative">
                      <Input 
                        type="date" 
                        className="rounded-2xl h-14 pl-12 bg-muted/20 border-none focus-visible:ring-1 text-xs" 
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        required 
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Verification Questions
                </p>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Unique Brand or Markings</Label>
                  <Input 
                    placeholder="e.g. Nike, Red ribbon on handle" 
                    className="rounded-xl h-12 bg-muted/20 border-none shadow-none"
                    value={brandMarkings}
                    onChange={(e) => setBrandMarkings(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Internal Contents (2-3 items)</Label>
                  <Textarea 
                    placeholder="e.g. Blue hoodie, Dell laptop" 
                    className="rounded-xl min-h-[80px] bg-muted/20 border-none resize-none"
                    value={contentsVerification}
                    onChange={(e) => setContentsVerification(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || !previewImage}
                className="w-full h-16 rounded-[28px] gradient-header font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Generate Digital Token</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>Security Notice:</strong> Your items are not "Stored" until a guard validates your Check-in Code and places them in a secure rack.
          </p>
        </div>
      </main>
    </div>
  )
}
