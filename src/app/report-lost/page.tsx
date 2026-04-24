
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, MapPin, Calendar, Clock, Tag, Send, Package, Loader2, Sparkles, Info, AlertTriangle, LayoutGrid, ShieldCheck, X } from "lucide-react"
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
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { foundItemAIDetails, type FoundItemAIDetailsOutput } from "@/ai/flows/found-item-ai-details-flow"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"

export default function ReportLost() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    date: "",
    time: ""
  })

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
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Camera permissions required.' });
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
        toast({ variant: "destructive", title: "File Too Large", description: "Max 1MB limit." })
        setIsScanning(false)
        return
      }

      setPreviewImage(compressedUri)
      
      const aiPromise = foundItemAIDetails({ photoDataUri: compressedUri });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 5000));

      const result = await Promise.race([aiPromise, timeoutPromise]) as FoundItemAIDetailsOutput;

      setFormData(prev => ({
        ...prev,
        name: result.itemName,
        category: result.category.toLowerCase(),
        description: result.attributes.join(", ")
      }))
      toast({ title: "Analysis Complete", description: "AI identified your item." })
    } catch (error: any) {
      toast({
        title: error.message === 'AI Timeout' ? "AI Timed Out" : "Partial Sync",
        description: "Please confirm details manually.",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !hasCompleteProfile) return
    setIsSubmitting(true)
    const itemsRef = collection(db, "items")
    const itemData = {
      ownerId: user.uid,
      reporterRegNo: userData?.registrationNumber || "N/A",
      name: formData.name,
      category: formData.category,
      description: formData.description,
      locationDescription: formData.location,
      eventDate: formData.date ? new Date(`${formData.date}T${formData.time || '00:00'}`).toISOString() : new Date().toISOString(),
      type: "lost",
      status: "Active",
      latitude: 0,
      longitude: 0,
      imageUrl: previewImage || "https://picsum.photos/seed/lost/600/400",
      reportedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    }
    addDocumentNonBlocking(itemsRef, itemData)
      .then(() => {
        toast({ title: "Success!", description: "Lost report active." })
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
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">Fill in your <strong>Registration ID</strong> to proceed.</p>
        </div>
        <Button onClick={() => router.push("/settings/profile")} className="rounded-xl h-12 px-8 gradient-header font-bold">Complete Profile</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-headline font-bold">Report Lost Item</h1>
        </div>
      </div>

      <main className="max-w-md lg:max-w-4xl mx-auto px-4 -mt-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" onClick={startCamera} variant="outline" className="rounded-xl h-14 border-dashed border-2 flex flex-col items-center justify-center gap-1">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase">Live Camera</span>
                </Button>
                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl h-14 border-dashed border-2 flex flex-col items-center justify-center gap-1">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase">Gallery</span>
                </Button>
              </div>

              <div className="relative w-full aspect-[16/10] rounded-[24px] border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30">
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Lost item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="font-headline font-bold text-sm uppercase tracking-widest text-center px-4">GenAI Identifying...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Capture Item Visual</p>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-6">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Name *</Label>
                   <Input placeholder="e.g. Silver Dell Laptop" className="rounded-xl h-12 bg-muted/20 border-none shadow-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})} required>
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
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Seen *</Label>
                      <Input placeholder="e.g. Block 34 Library" className="rounded-xl h-12 bg-muted/20 border-none shadow-none" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Specific Details</Label>
                   <Textarea placeholder="Color, brand, unique stickers..." className="rounded-xl min-h-[100px] bg-muted/20 border-none shadow-none p-4 resize-none leading-relaxed" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Date *</Label>
                     <Input type="date" className="rounded-xl h-12 bg-muted/20 border-none" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Approx. Time</Label>
                     <Input type="time" className="rounded-xl h-12 bg-muted/20 border-none" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSubmitting || isScanning} className="w-full rounded-2xl gradient-header h-14 text-sm font-bold shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Broadcast Lost Alert</>}
          </Button>
        </form>
      </main>

      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Lost Item Reference Cam</DialogTitle>
            <DialogDescription>Snapshot your lost item to help guards identify it better.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[3/4] w-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute top-4 right-4 z-20"><Button variant="ghost" size="icon" onClick={stopCamera} className="text-white bg-black/20 rounded-full"><X className="h-6 w-6" /></Button></div>
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
                <Alert variant="destructive"><AlertTitle>Camera Access</AlertTitle><AlertDescription>Access denied. Allow in settings.</AlertDescription></Alert>
              </div>
            )}
          </div>
          <div className="p-8 bg-black flex justify-center"><button onClick={capturePhoto} disabled={!hasCameraPermission} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"><div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform" /></button></div>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
