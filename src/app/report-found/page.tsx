
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, ShieldCheck, User, Fingerprint, Info, CheckCircle2, FileText, AlertTriangle, LayoutGrid, X, Plus, Trash2 } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"

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

  // Verification Questions
  const [vQuestions, setVQuestions] = useState([{ question: "", answer: "" }])

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCompleteProfile = userData?.registrationNumber && userData?.phoneNumber;

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
  }, [user, isUserLoading, router])

  const startCamera = async () => {
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        processPhoto(dataUri);
        stopCamera();
      }
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => processPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const processPhoto = async (rawDataUri: string) => {
    setIsScanning(true)
    try {
      const compressedUri = await compressImage(rawDataUri)
      const finalSizeMB = getDataUriSizeMB(compressedUri)

      if (finalSizeMB > 1.0) {
        toast({
          variant: "destructive",
          title: "Upload Rejected",
          description: `Image size exceeds 1MB. Selected: ${finalSizeMB.toFixed(1)} MB`,
        })
        setIsScanning(false)
        return
      }

      setPreviewImage(compressedUri)

      const aiPromise = foundItemAIDetails({ photoDataUri: compressedUri });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 5000));

      const result = await Promise.race([aiPromise, timeoutPromise]) as FoundItemAIDetailsOutput;
      
      if (!itemName) setItemName(result.itemName)
      if (!category) setCategory(result.category.toLowerCase())
      if (!description) setDescription(result.attributes.join(", "))
      
      toast({ title: "AI Analysis Complete", description: "Details identified automatically." })
    } catch (error: any) {
      toast({
        title: error.message === 'AI Timeout' ? "AI Slow" : "Processing Partial",
        description: error.message === 'AI Timeout' ? "Please fill details manually." : "Could not identify all details.",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const addQuestion = () => setVQuestions([...vQuestions, { question: "", answer: "" }])
  const removeQuestion = (idx: number) => setVQuestions(vQuestions.filter((_, i) => i !== idx))
  const updateQuestion = (idx: number, field: 'question' | 'answer', val: string) => {
    const newQs = [...vQuestions]
    newQs[idx][field] = val
    setVQuestions(newQs)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !hasCompleteProfile) return
    if (vQuestions.some(q => !q.question || !q.answer)) {
      toast({ variant: "destructive", title: "Incomplete Questions", description: "All verification questions must have an answer." })
      return
    }

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
      status: "In Custody",
      latitude: 0,
      longitude: 0,
      imageUrl: previewImage || "https://picsum.photos/seed/found/600/400",
      storageOffice: securityPost,
      storageInfo: `Guard: ${guardName}, Badge: ${badgeNumber}`,
      verificationQuestions: vQuestions,
      reportedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    }
    addDocumentNonBlocking(itemsRef, itemData)
      .then(() => {
        toast({ title: "Report Submitted!", description: "Item is now live in the gallery." })
        router.push("/dashboard")
      })
      .finally(() => setIsSubmitting(false))
  }

  if (isUserLoading || isDocLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  if (!hasCompleteProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center"><AlertTriangle className="h-10 w-10 text-accent" /></div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">Profile Incomplete</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">You must provide your <strong>Registration Number</strong> and <strong>Phone Number</strong> first.</p>
        </div>
        <Button onClick={() => router.push("/settings/profile")} className="rounded-xl h-12 px-8 gradient-header font-bold">Complete Profile</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-success pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-headline font-bold">Report Found Item</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8"><CardTitle className="text-lg font-headline font-bold flex items-center gap-2"><Camera className="h-5 w-5 text-secondary" /> 1. Visual Capture</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button type="button" onClick={startCamera} variant="outline" className="rounded-xl h-14 border-dashed border-2 flex flex-col items-center justify-center gap-1">
                  <Camera className="h-5 w-5 text-secondary" />
                  <span className="text-[10px] font-bold uppercase">Live Camera</span>
                </Button>
                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl h-14 border-dashed border-2 flex flex-col items-center justify-center gap-1">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase">Upload File</span>
                </Button>
              </div>

              <div className="relative w-full aspect-[16/10] rounded-[32px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30">
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
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Snap Evidence Photo</p>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Name</Label>
                  <Input placeholder="e.g. Blue Umbrella" className="rounded-xl h-12 bg-muted/20 border-none" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
                   <Select value={category} onValueChange={(val) => setCategory(val)} required>
                     <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none shadow-none"><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <Input placeholder="e.g. Block 34 Canteen" className="rounded-xl h-12 bg-muted/20 border-none" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea placeholder="Identifying marks, brand, or condition..." className="rounded-xl min-h-[100px] bg-muted/20 border-none p-4 resize-none leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8"><CardTitle className="text-lg font-headline font-bold flex items-center gap-2"><Fingerprint className="h-5 w-5 text-accent" /> 2. Security Questions</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
               <p className="text-[10px] text-muted-foreground leading-relaxed italic">Set questions that only the real owner can answer. These will be used for automated identity verification.</p>
               
               <div className="space-y-4">
                  {vQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10 space-y-3 relative">
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-bold uppercase text-muted-foreground">Question {idx + 1}</Label>
                         <Input placeholder="e.g. What is written on the handle?" value={q.question} onChange={(e) => updateQuestion(idx, 'question', e.target.value)} className="h-10 rounded-xl bg-background border-none text-xs" required />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-bold uppercase text-muted-foreground">Correct Answer</Label>
                         <Input placeholder="e.g. Red ribbon and name tag" value={q.answer} onChange={(e) => updateQuestion(idx, 'answer', e.target.value)} className="h-10 rounded-xl bg-background border-none text-xs" required />
                       </div>
                       {vQuestions.length > 1 && (
                         <button type="button" onClick={() => removeQuestion(idx)} className="absolute top-2 right-2 text-destructive opacity-40 hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                       )}
                    </div>
                  ))}
                  <Button type="button" onClick={addQuestion} variant="ghost" className="w-full h-10 rounded-xl border-2 border-dashed border-muted-foreground/20 text-[10px] font-bold uppercase gap-2 hover:bg-muted/50"><Plus className="h-4 w-4" /> Add Another Question</Button>
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8"><CardTitle className="text-lg font-headline font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> 3. Security Registry</CardTitle></CardHeader>
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

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-2xl gradient-success h-16 text-base font-headline font-bold shadow-2xl flex items-center justify-center gap-4">
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="h-6 w-6" /> Finalize Handover</>}
          </Button>
        </form>
      </main>

      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Found Item Proof Cam</DialogTitle>
            <DialogDescription>Snapshot the item to enable AI analysis and logging.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[3/4] w-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute top-4 right-4 z-20"><Button variant="ghost" size="icon" onClick={stopCamera} className="text-white bg-black/20 rounded-full"><X className="h-6 w-6" /></Button></div>
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10"><Alert variant="destructive"><AlertTitle>Camera Required</AlertTitle><AlertDescription>Access denied. Check browser settings.</AlertDescription></Alert></div>
            )}
          </div>
          <div className="p-8 bg-black flex justify-center"><button onClick={capturePhoto} disabled={!hasCameraPermission} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"><div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform" /></button></div>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
