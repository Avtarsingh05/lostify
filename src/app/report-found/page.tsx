
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, ShieldCheck, User, Fingerprint, Info, CheckCircle2, FileText, AlertTriangle, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { foundItemAIDetails, type FoundItemAIDetailsOutput } from "@/ai/flows/found-item-ai-details-flow"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"

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
      const rawDataUri = reader.result as string
      
      setIsScanning(true)
      try {
        const compressedUri = await compressImage(rawDataUri)
        const finalSizeMB = getDataUriSizeMB(compressedUri)

        if (finalSizeMB > 1.0) {
          toast({
            variant: "destructive",
            title: "Upload Rejected",
            description: `Image size exceeds 1MB limit. Selected: ${finalSizeMB.toFixed(1)} MB`,
          })
          setIsScanning(false)
          return
        }

        setPreviewImage(compressedUri)

        // 5-SECOND AI TIMEOUT AS REQUESTED
        const aiPromise = foundItemAIDetails({ photoDataUri: compressedUri });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 5000));

        const result = await Promise.race([aiPromise, timeoutPromise]) as FoundItemAIDetailsOutput;
        
        if (!itemName) setItemName(result.itemName)
        if (!category) setCategory(result.category.toLowerCase())
        if (!description) setDescription(result.attributes.join(", "))
        
        toast({
          title: "AI Analysis Complete",
          description: "Details identified automatically.",
        })
      } catch (error: any) {
        toast({
          title: error.message === 'AI Timeout' ? "AI Slow" : "Processing Partial",
          description: error.message === 'AI Timeout' ? "Please fill details manually for faster reporting." : "Could not identify all details. Please fill manually.",
          variant: "default"
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
      name: itemName,
      category: category || "others",
      description: description,
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
        toast({
          title: "Report Submitted!",
          description: "Waiting for guard approval to pin on map.",
        })
        router.push("/dashboard")
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

      <main className="max-w-md lg:max-w-4xl mx-auto px-4 -mt-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-secondary" /> 1. Visual Capture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-[16/10] rounded-[32px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
              >
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Found item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="font-headline font-bold text-sm uppercase tracking-widest text-center px-4">GenAI Extraction...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-white p-5 rounded-full shadow-2xl border border-secondary/10">
                      <Camera className="h-8 w-8 text-secondary" />
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Snap Evidence Photo</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Name</Label>
                  <Input 
                    placeholder="e.g. Blue Umbrella" 
                    className="rounded-xl h-12 bg-muted/20 border-none" 
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
                   <Select 
                     value={category} 
                     onValueChange={(val) => setCategory(val)} 
                     required
                   >
                     <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none shadow-none">
                       <SelectValue placeholder="Select type" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl">
                       <SelectItem value="electronics">Electronics</SelectItem>
                       <SelectItem value="documents">Documents</SelectItem>
                       <SelectItem value="bags">Bags</SelectItem>
                       <SelectItem value="accessories">Accessories</SelectItem>
                       <SelectItem value="others">Others</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Found Location</Label>
                <Input 
                  placeholder="e.g. Block 34 Canteen" 
                  className="rounded-xl h-12 bg-muted/20 border-none" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  placeholder="Identifying marks, brand, or condition..." 
                  className="rounded-xl min-h-[100px] bg-muted/20 border-none p-4 resize-none leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none bg-white dark:bg-card">
            <CardHeader className="pb-0 pt-8 px-8">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> 2. Security Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Guard Name *</Label>
                <Input placeholder="Name on badge" className="rounded-xl h-12 bg-muted/20 border-none" value={guardName} onChange={(e) => setGuardName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Badge Number *</Label>
                  <Input placeholder="SEC-0000" className="rounded-xl h-12 bg-muted/20 border-none" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Post *</Label>
                  <Input placeholder="e.g. Main Gate" className="rounded-xl h-12 bg-muted/20 border-none" value={securityPost} onChange={(e) => setSecurityPost(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting} 
            className="w-full rounded-2xl gradient-success h-16 text-base font-headline font-bold shadow-2xl flex items-center justify-center gap-4"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="h-6 w-6" /> Finalize Handover</>}
          </Button>
        </form>
      </main>
    </div>
  )
}
