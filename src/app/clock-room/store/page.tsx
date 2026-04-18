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
  AlertCircle
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
  
  // New verification & manual detail fields
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
      toast({ title: "Photo Attached", description: "Please fill in the identification details manually." })
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
    
    // Auto-assign random Rack & Slot for MVP
    const rack = Math.floor(Math.random() * 10) + 1
    const slot = String.fromCharCode(65 + Math.floor(Math.random() * 6)) + (Math.floor(Math.random() * 20) + 1)
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

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
      rackNumber: String(rack),
      slotNumber: slot,
      status: "stored",
      otp,
      expectedReturnDate: returnDate ? new Date(returnDate).toISOString() : null,
      createdAt: new Date().toISOString(),
    }

    try {
      await addDocumentNonBlocking(collection(db, "clockRoomItems"), itemData)
      setIsSuccess(true)
      toast({ title: "Item stored successfully" })
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
        <h2 className="text-3xl font-headline font-bold mb-2">Securely Stored</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Your luggage check-in is complete. Redirecting to your dashboard...
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
          <h1 className="text-2xl font-headline font-bold">New Check-in</h1>
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
              {/* --- Section: Student Identity --- */}
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

              {/* --- Section: Basic Details --- */}
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

              {/* --- Section: Enhanced Details (Manual Questions) --- */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Verification Questions
                </p>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Unique Brand or Markings</Label>
                  <Input 
                    placeholder="e.g. Nike, Red ribbon on handle, Scratched logo" 
                    className="rounded-xl h-12 bg-muted/20 border-none shadow-none"
                    value={brandMarkings}
                    onChange={(e) => setBrandMarkings(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Verification Question: What's inside?</Label>
                  <Textarea 
                    placeholder="List 2-3 items inside for identification (e.g. Blue hoodie, Dell laptop, Math textbook)" 
                    className="rounded-xl min-h-[80px] bg-muted/20 border-none resize-none"
                    value={contentsVerification}
                    onChange={(e) => setContentsVerification(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Bag Condition</Label>
                  <Input 
                    placeholder="e.g. Brand new, Broken zip, Torn side pocket" 
                    className="rounded-xl h-12 bg-muted/20 border-none shadow-none"
                    value={itemCondition}
                    onChange={(e) => setItemCondition(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">General Notes</Label>
                <Textarea 
                  placeholder="Any extra info for the guard..." 
                  className="rounded-xl min-h-[80px] bg-muted/20 border-none resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || !previewImage}
                className="w-full h-16 rounded-[28px] gradient-header font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="h-5 w-5" /> Secure My Luggage</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>Security Notice:</strong> Providing accurate details for the "Verification Question" is critical. You will be asked to identify these contents upon retrieval to confirm ownership.
          </p>
        </div>

        <div className="pt-4 pb-8 text-center space-y-1 opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Secure Storage Protocol v3.1</p>
          <p className="text-[8px] font-medium">Verified by Campus Security</p>
        </div>
      </main>
    </div>
  )
}
