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
  Hash,
  User,
  Phone,
  Sparkles
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
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"

export default function StoreItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const [studentName, setStudentName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
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
    if (userData) {
      if (userData.username) setStudentName(userData.username)
      if (userData.registrationNumber) setRegistrationNumber(userData.registrationNumber)
      if (userData.phoneNumber) setPhoneNumber(userData.phoneNumber)
    }
  }, [userData])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const initialSizeMB = file.size / (1024 * 1024);
    if (initialSizeMB > 15) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: `Image size exceeds upload limit. Selected: ${initialSizeMB.toFixed(1)} MB`,
      });
      return;
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUri = reader.result as string
      setIsProcessingImage(true)
      try {
        const compressed = await compressImage(dataUri)
        const finalSizeMB = getDataUriSizeMB(compressed)

        if (finalSizeMB > 1.0) {
          toast({
            variant: "destructive",
            title: "Quality Error",
            description: `Image size exceeds 1MB limit. Selected: ${finalSizeMB.toFixed(1)} MB`,
          })
          setIsProcessingImage(false)
          return
        }

        setPreviewImage(compressed)
        toast({ title: "Image Optimized", description: "Storage space secured." })
      } catch (err) {
        toast({ variant: "destructive", title: "Image Error", description: "Could not process photo." })
      } finally {
        setIsProcessingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !previewImage) {
      toast({ variant: "destructive", title: "Photo Required", description: "Take a snapshot of your luggage first." })
      return
    }

    setIsSubmitting(true)
    const checkInCode = Math.floor(1000 + Math.random() * 9000).toString()
    const checkOutCode = Math.floor(1000 + Math.random() * 9000).toString()

    const itemData = {
      userId: user.uid,
      studentName,
      phoneNumber,
      registrationNumber,
      itemType,
      color,
      description,
      contentsVerification,
      itemCondition,
      brandMarkings,
      imageUrl: previewImage,
      rackNumber: "Staging",
      slotNumber: "Reception",
      status: "pending_storage",
      checkInCode,
      checkOutCode,
      expectedReturnDate: returnDate ? new Date(returnDate).toISOString() : null,
      createdAt: new Date().toISOString(),
    }

    try {
      await addDocumentNonBlocking(collection(db, "clockRoomItems"), itemData)
      setIsSuccess(true)
      toast({ title: "Request Logged", description: "Proceed to Uni Mall Reception." })
      setTimeout(() => router.push("/clock-room"), 2500)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-x-hidden">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 shadow-xl shadow-primary/10">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-headline font-bold mb-2">Check-in Ready</h2>
        <p className="text-muted-foreground text-[11px] sm:text-sm mb-8 max-w-xs px-4">
          Handover your bag at Uni Mall Reception and show your digital token to the guard.
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="gradient-header pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-headline font-bold">Secure Storage</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <CardContent className="p-5 sm:p-6 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[16/10] rounded-[24px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
            >
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Luggage Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="bg-white/95 px-4 py-2 rounded-xl shadow-xl text-primary font-bold text-[10px] uppercase tracking-widest">Retake Photo</div>
                  </div>
                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                       <Loader2 className="h-8 w-8 animate-spin mb-2" />
                       <p className="text-[10px] font-bold uppercase">Compressing...</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-card p-4 rounded-full shadow-lg border border-primary/10">
                    <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <p className="mt-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Snapshot Luggage</p>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Block */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                   <div className="h-6 w-1 bg-primary rounded-full" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Student Identity</p>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Input 
                      placeholder="Display Name" 
                      className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-xs" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required 
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Input 
                        placeholder="Registration ID" 
                        className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-xs" 
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        required 
                      />
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <div className="relative">
                      <Input 
                        placeholder="Phone Number" 
                        className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-xs" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required 
                      />
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details Block */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                   <div className="h-6 w-1 bg-accent rounded-full" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Bag Details</p>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Input 
                      placeholder="Type (e.g. Suitcase, Duffle)" 
                      className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-xs" 
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      required 
                    />
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input 
                        placeholder="Primary Color" 
                        className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-xs" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        required 
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border shadow-sm" style={{ backgroundColor: color || '#ddd' }} />
                    </div>
                    <div className="relative">
                      <Input 
                        type="date" 
                        className="rounded-xl h-12 pl-10 bg-muted/30 border-none shadow-none text-[10px]" 
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        required 
                      />
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Block */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                   <div className="h-6 w-1 bg-secondary rounded-full" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Verification Info</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Brand or Distinctive Marks</Label>
                  <Input 
                    placeholder="e.g. Nike, Red ribbon on handle" 
                    className="rounded-xl h-12 bg-muted/30 border-none shadow-none text-xs"
                    value={brandMarkings}
                    onChange={(e) => setBrandMarkings(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Key Internal Contents (2-3 items)</Label>
                  <Textarea 
                    placeholder="e.g. Blue hoodie, Dell laptop" 
                    className="rounded-xl min-h-[90px] bg-muted/30 border-none resize-none text-xs leading-relaxed"
                    value={contentsVerification}
                    onChange={(e) => setContentsVerification(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || !previewImage || isProcessingImage}
                className="w-full h-14 rounded-2xl gradient-header font-bold shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> Generate Token</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-4 mb-10">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed italic">
            <strong>Disclaimer:</strong> Physical storage is confirmed only after a guard scans your Check-in Code and places the item in a designated rack.
          </p>
        </div>
      </main>
    </div>
  )
}
