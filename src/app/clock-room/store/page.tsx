
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Camera, 
  Sparkles, 
  Loader2, 
  Send, 
  Calendar,
  Tag,
  Info,
  CheckCircle2,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { analyzeLuggage } from "@/ai/flows/clock-room-ai-flow"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"
import Image from "next/image"

export default function StoreItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const [itemType, setItemType] = useState("")
  const [color, setColor] = useState("")
  const [description, setDescription] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUri = reader.result as string
      setPreviewImage(dataUri)
      
      setIsScanning(true)
      try {
        const result = await analyzeLuggage({ photoDataUri: dataUri })
        setItemType(result.itemType)
        setColor(result.color)
        setDescription(result.description)
        toast({ title: "AI Analysis Complete", description: `Identified a ${result.color} ${result.itemType}.` })
      } catch (error) {
        toast({ variant: "destructive", title: "AI Scan Partial", description: "Could not auto-detect details." })
      } finally {
        setIsScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !previewImage) return

    setIsSubmitting(true)
    
    // Auto-assign random Rack & Slot for MVP
    const rack = Math.floor(Math.random() * 10) + 1
    const slot = String.fromCharCode(65 + Math.floor(Math.random() * 6)) + (Math.floor(Math.random() * 20) + 1)
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    const itemData = {
      userId: user.uid,
      itemType,
      color,
      description,
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
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-headline font-bold mb-2">Check-in Complete</h2>
        <p className="text-muted-foreground text-sm mb-8">Your luggage is securely stored.</p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
          <h1 className="text-2xl font-headline font-bold">Check-in Luggage</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <CardContent className="p-6 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-square rounded-[24px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {previewImage ? (
                <>
                  <Image src={previewImage} alt="Luggage" fill className="object-cover" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white z-10">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p className="font-headline font-bold text-xs uppercase tracking-widest">AI Scanning...</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-card p-4 rounded-full shadow-lg">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Snap Luggage Photo</p>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Type</Label>
                <div className="relative">
                  <Input 
                    placeholder={isScanning ? "Detecting..." : "e.g. Red Suitcase"} 
                    className="rounded-xl h-12 pl-10" 
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    required 
                  />
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Color</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Color" 
                      className="rounded-xl h-12 pl-10" 
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required 
                    />
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Return Date</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      className="rounded-xl h-12 pl-10" 
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required 
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Notes (Optional)</Label>
                <Textarea 
                  placeholder="Fragile, side handle broken, etc." 
                  className="rounded-xl min-h-[100px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || isScanning || !previewImage}
                className="w-full h-14 rounded-2xl gradient-header font-bold shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Secure My Luggage</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            By storing your luggage, you agree to campus clock room policies. Maximum storage period is 7 days.
          </p>
        </div>
      </main>
    </div>
  )
}
