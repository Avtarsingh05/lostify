
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, ShieldCheck, User, Fingerprint, Info, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { foundItemAIDetails, type FoundItemAIDetailsOutput } from "@/ai/flows/found-item-ai-details-flow"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"

export default function ReportFound() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [aiData, setAiData] = useState<FoundItemAIDetailsOutput | null>(null)
  const [step, setStep] = useState(1)
  
  const [location, setLocation] = useState("")
  const [guardName, setGuardName] = useState("")
  const [badgeNumber, setBadgeNumber] = useState("")
  const [securityPost, setSecurityPost] = useState("")
  
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
        const result = await foundItemAIDetails({ photoDataUri: dataUri })
        setAiData(result)
        toast({
          title: "AI Analysis Complete",
          description: "Item details identified automatically.",
        })
      } catch (error) {
        toast({
          title: "AI Scanning Partial",
          description: "Please fill details manually.",
          variant: "destructive"
        })
      } finally {
        setIsScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    
    const itemsRef = collection(db, "items")
    const itemData = {
      ownerId: user.uid,
      name: aiData?.itemName || "Found Item",
      category: aiData?.category || "Other",
      description: aiData?.attributes?.join(", ") || "",
      locationDescription: location,
      eventDate: new Date().toISOString(),
      type: "found",
      status: "In Custody",
      latitude: 0,
      longitude: 0,
      imageUrl: previewImage || "https://picsum.photos/seed/found/600/400",
      storageInfo: `At ${securityPost} (Guard: ${guardName}, Badge: ${badgeNumber})`,
      reportedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    }

    addDocumentNonBlocking(itemsRef, itemData)
      .then(() => {
        setStep(3)
        toast({
          title: "Report Submitted!",
          description: "The handover has been logged securely.",
        })
        setTimeout(() => router.push("/dashboard"), 3000)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10 text-secondary" />
        </div>
        <h2 className="text-2xl font-headline font-bold mb-2">Logged Successfully</h2>
        <p className="text-muted-foreground text-sm mb-8">Redirecting to dashboard...</p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-success pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">Report Found Item</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Alert className="bg-white/95 border-secondary/20 rounded-2xl shadow-lg py-3">
          <Info className="h-4 w-4 text-secondary" />
          <AlertDescription className="text-[10px] text-muted-foreground font-medium">
            Hand over to campus security and log the receipt details below.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="rounded-[28px] overflow-hidden shadow-xl border-none">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Camera className="h-4 w-4 text-secondary" /> 1. Item Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Found item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="font-headline font-bold text-xs">GenAI Scanning...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-card p-3 rounded-full shadow-md">
                      <Camera className="h-6 w-6 text-secondary" />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Snap Photo</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              {aiData && (
                <div className="bg-secondary/5 border border-secondary/10 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-secondary" />
                    <span className="text-[8px] font-bold text-secondary uppercase tracking-tighter">AI Identified</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="bg-white dark:bg-card text-[9px] border-secondary/20">{aiData.itemName}</Badge>
                    <Badge variant="outline" className="bg-white dark:bg-card text-[9px] border-secondary/20">{aiData.category}</Badge>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="foundLocation" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Discovery Spot</Label>
                <div className="relative">
                  <Input 
                    id="foundLocation" 
                    placeholder="e.g. Library Hall" 
                    className="rounded-xl h-11 pl-9 text-sm" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required 
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] overflow-hidden shadow-xl border-none">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> 2. Security Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="guardName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Guard Name</Label>
                  <div className="relative">
                    <Input id="guardName" placeholder="Full name" className="rounded-xl h-11 pl-9 text-sm" value={guardName} onChange={(e) => setGuardName(e.target.value)} required />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guardId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Badge ID</Label>
                  <div className="relative">
                    <Input id="guardId" placeholder="SEC-0000" className="rounded-xl h-11 pl-9 text-sm" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required />
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guardPost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Security Post</Label>
                  <div className="relative">
                    <Input id="guardPost" placeholder="e.g. Main Gate" className="rounded-xl h-11 pl-9 text-sm" value={securityPost} onChange={(e) => setSecurityPost(e.target.value)} required />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || isScanning} 
            className="w-full rounded-2xl gradient-success h-14 text-sm font-headline font-bold shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" /> Log Handover
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
