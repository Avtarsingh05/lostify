"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, ShieldCheck, User, Fingerprint, Info, CheckCircle2, FileText, AlertTriangle, LayoutGrid } from "lucide-react"
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
            description: `Image size exceeds 1MB limit after optimization. Selected: ${finalSizeMB.toFixed(1)} MB`,
          })
          setIsScanning(false)
          return
        }

        setPreviewImage(compressedUri)

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
      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-success pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">Report Found Item</h1>
        </div>
      </div>

      {/* WEB HEADER */}
      <div className="hidden lg:flex gradient-success pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Handover Protocol</h1>
                <p className="text-xl text-white/70 mt-2">Professional digital verification for campus security custody</p>
              </div>
           </div>
           <div className="bg-white/20 p-8 rounded-[40px] shadow-2xl border border-white/10"><LayoutGrid className="h-12 w-12 text-white" /></div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
           {/* Sidebar Widget for Web */}
           <div className="hidden lg:flex lg:col-span-4 flex-col gap-8">
              <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl p-10 space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Handover Security</h3>
                    <div className="flex items-start gap-4">
                       <div className="bg-secondary/10 p-3 rounded-2xl"><ShieldCheck className="h-6 w-6 text-secondary" /></div>
                       <p className="text-sm text-muted-foreground leading-relaxed">This report creates a legal digital receipt. Ensure the guard confirms physical receipt of the item.</p>
                    </div>
                 </div>
              </Card>

              <Alert className="bg-secondary/5 border-secondary/20 rounded-[32px] p-8 shadow-xl py-6">
                <Info className="h-6 w-6 text-secondary" />
                <AlertDescription className="text-sm font-medium text-secondary/80 mt-2 leading-relaxed">
                   Reports verified by security personnel are prioritized in the Campus Gallery.
                </AlertDescription>
              </Alert>
           </div>

           {/* Main Form Area */}
           <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl border-none bg-white dark:bg-card">
                  <CardHeader className="pb-0 pt-8 px-8 lg:p-12">
                    <CardTitle className="text-xl lg:text-3xl font-headline font-bold flex items-center gap-4">
                      <Camera className="h-6 w-6 lg:h-10 lg:w-10 text-secondary" /> 1. Visual Capture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 lg:p-12 space-y-8">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full aspect-[16/10] rounded-[32px] border-4 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                      {previewImage ? (
                        <>
                          <Image src={previewImage} alt="Found item" fill className="object-cover" />
                          {isScanning && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                              <Loader2 className="h-10 w-10 animate-spin mb-4" />
                              <p className="font-headline font-bold text-sm uppercase tracking-widest">GenAI Extraction...</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="bg-white dark:bg-card p-6 rounded-full shadow-2xl border border-secondary/10 group-hover:scale-110 transition-transform">
                            <Camera className="h-10 w-10 text-secondary" />
                          </div>
                          <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Snap Evidence Photo</p>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="itemName" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Name</Label>
                        <div className="relative">
                          <Input 
                            id="itemName" 
                            placeholder={isScanning ? "AI Analyzing..." : "e.g. Blue Umbrella"} 
                            className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none" 
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            required 
                          />
                          <Sparkles className={`absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 transition-colors ${isScanning ? 'text-secondary animate-pulse' : 'text-muted-foreground/40'}`} />
                        </div>
                      </div>

                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="foundLocation" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Found Location</Label>
                        <div className="relative">
                          <Input 
                            id="foundLocation" 
                            placeholder="e.g. Block 34 Canteen" 
                            className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required 
                          />
                          <MapPin className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 lg:space-y-3">
                      <Label htmlFor="description" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Physical Description</Label>
                      <div className="relative">
                        <Textarea 
                          id="description" 
                          placeholder="Identifying marks, brand, or condition..." 
                          className="rounded-xl lg:rounded-2xl min-h-[100px] pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none p-5 resize-none leading-relaxed"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        <FileText className="absolute left-3.5 lg:left-5 top-6 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl border-none bg-white dark:bg-card">
                  <CardHeader className="pb-0 pt-8 px-8 lg:p-12">
                    <CardTitle className="text-xl lg:text-3xl font-headline font-bold flex items-center gap-4">
                      <ShieldCheck className="h-6 w-6 lg:h-10 lg:w-10 text-primary" /> 2. Security Registry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 lg:p-12 space-y-8">
                    <div className="space-y-1.5 lg:space-y-3">
                      <Label htmlFor="guardName" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Guard Name *</Label>
                      <div className="relative">
                        <Input id="guardName" placeholder="Name on badge" className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none" value={guardName} onChange={(e) => setGuardName(e.target.value)} required />
                        <User className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="guardId" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Badge Number *</Label>
                        <div className="relative">
                          <Input id="guardId" placeholder="SEC-0000" className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required />
                          <Fingerprint className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                        </div>
                      </div>
                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="guardPost" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Post *</Label>
                        <div className="relative">
                          <Input id="guardPost" placeholder="e.g. Main Gate" className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none" value={securityPost} onChange={(e) => setSecurityPost(e.target.value)} required />
                          <MapPin className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting} 
                  className="w-full rounded-3xl lg:rounded-[40px] gradient-success h-16 lg:h-24 text-base lg:text-2xl font-headline font-bold shadow-2xl flex items-center justify-center gap-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 lg:h-10 lg:w-10 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-6 w-6 lg:h-8 lg:w-8" /> Finalize Digital Handover
                    </>
                  )}
                </Button>
                
                <p className="text-[10px] lg:text-xs text-center text-muted-foreground uppercase tracking-[0.2em] font-bold py-6 opacity-60">
                   OFFICIAL CAMPUS SECURITY HANDOVER RECORD v1.0
                </p>
              </form>
           </div>
        </div>
      </main>
    </div>
  )
}
