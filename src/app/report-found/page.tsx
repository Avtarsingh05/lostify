"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, ShieldCheck, User, Fingerprint, Info, CheckCircle2, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { foundItemAIDetails, type FoundItemAIDetailsOutput } from "@/ai/flows/found-item-ai-details-flow"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { compressImage } from "@/lib/image-utils"

export default function ReportFound() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef)

  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [aiData, setAiData] = useState<FoundItemAIDetailsOutput | null>(null)
  const [step, setStep] = useState(1)
  
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [guardName, setGuardName] = useState("")
  const [badgeNumber, setBadgeNumber] = useState("")
  const [securityPost, setSecurityPost] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCompleteProfile = userData?.registrationNumber && userData?.phoneNumber;

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
  }, [user, isUserLoading, router])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const rawDataUri = reader.result as string
      
      setIsScanning(true)
      try {
        // Step 1: Compress the image to avoid Firestore limit and Permission errors
        const compressedUri = await compressImage(rawDataUri)
        setPreviewImage(compressedUri)

        // Step 2: Send compressed image to AI
        const result = await foundItemAIDetails({ photoDataUri: compressedUri })
        setAiData(result)
        if (!itemName) setItemName(result.itemName)
        if (!category) setCategory(result.category)
        if (!description) setDescription(result.attributes.join(", "))
        
        toast({
          title: "AI Analysis Complete",
          description: "Details identified automatically.",
        })
      } catch (error) {
        toast({
          title: "Processing Partial",
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
    if (!user || !db || !hasCompleteProfile) return

    setIsSubmitting(true)
    
    const itemsRef = collection(db, "items")
    const itemData = {
      ownerId: user.uid,
      reporterRegNo: userData?.registrationNumber || "N/A",
      name: itemName || aiData?.itemName || "Found Item",
      category: category || aiData?.category || "Other",
      description: description || aiData?.attributes?.join(", ") || "",
      locationDescription: location,
      eventDate: new Date().toISOString(),
      type: "found",
      status: "Pending Verification",
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
          description: "Waiting for guard approval to pin on map.",
        })
        setTimeout(() => router.push("/dashboard"), 2500)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  if (isUserLoading || isDocLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  if (!hasCompleteProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">Profile Incomplete</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            You must provide your <strong>Registration Number</strong> and <strong>Phone Number</strong> in your profile before filing a report.
          </p>
        </div>
        <Button onClick={() => router.push("/settings/profile")} className="rounded-xl h-12 px-8 gradient-header font-bold">
          Complete Profile
        </Button>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10 text-secondary" />
        </div>
        <h2 className="text-2xl font-headline font-bold mb-2">Report Logged</h2>
        <p className="text-muted-foreground text-sm mb-8">Waiting for guard verification...</p>
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
            Hand over to campus security. The item will appear on the map once verified by a guard.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="rounded-[28px] overflow-hidden shadow-xl border-none">
            <CardHeader className="pb-0 pt-6 px-6">
              <CardTitle className="text-sm font-headline font-bold flex items-center gap-2">
                <Camera className="h-4 w-4 text-secondary" /> 1. Item Details
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
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="font-headline font-bold text-[10px] uppercase tracking-widest">Optimizing...</p>
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

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="itemName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Item Name</Label>
                  <div className="relative">
                    <Input 
                      id="itemName" 
                      placeholder={isScanning ? "AI Analyzing..." : "e.g. Blue Umbrella"} 
                      className="rounded-xl h-11 pl-9 text-sm" 
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required 
                    />
                    <Sparkles className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isScanning ? 'text-secondary animate-pulse' : 'text-muted-foreground'}`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Physical Description</Label>
                  <div className="relative">
                    <Textarea 
                      id="description" 
                      placeholder="Add identifying marks or type manually..." 
                      className="rounded-xl min-h-[80px] pl-9 text-sm resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="foundLocation" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Found At</Label>
                  <div className="relative">
                    <Input 
                      id="foundLocation" 
                      placeholder="e.g. Block 34 Canteen" 
                      className="rounded-xl h-11 pl-9 text-sm" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required 
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
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
                    <Input id="guardName" placeholder="Guard's full name" className="rounded-xl h-11 pl-9 text-sm" value={guardName} onChange={(e) => setGuardName(e.target.value)} required />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="guardId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Badge ID</Label>
                    <div className="relative">
                      <Input id="guardId" placeholder="SEC-0000" className="rounded-xl h-11 pl-9 text-xs" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required />
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guardPost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Post Location</Label>
                    <div className="relative">
                      <Input id="guardPost" placeholder="e.g. Main Gate" className="rounded-xl h-11 pl-9 text-xs" value={securityPost} onChange={(e) => setSecurityPost(e.target.value)} required />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting} 
            className="w-full rounded-2xl gradient-success h-14 text-sm font-headline font-bold shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" /> Log Secure Handover
              </>
            )}
          </Button>

          <div className="pt-8 pb-4 text-center space-y-1 opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
            <p className="text-[9px] font-medium">Powered by Igloo Enterprises</p>
          </div>
        </form>
      </main>
    </div>
  )
}
