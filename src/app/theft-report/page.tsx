
"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldAlert, 
  Camera, 
  MapPin, 
  Clock, 
  Send, 
  Loader2, 
  Info, 
  AlertTriangle, 
  ShieldCheck,
  User,
  Fingerprint,
  CheckCircle2,
  Lock,
  X,
  LayoutGrid,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import Image from "next/image"
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function TheftReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const itemId = searchParams.get('itemId')
  const itemType = searchParams.get('type') || 'lost' 

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingMedia, setIsProcessingMedia] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<string | null>(null)
  const [location, setLocation] = useState<any>(null)
  
  const [description, setDescription] = useState("")
  const [suspectDetails, setSuspectDetails] = useState("")
  const [locationName, setLocationName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")

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

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS Access Denied:", err)
      )
    }
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
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Permissions denied.' });
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
        handleMediaProcessing(dataUri);
        stopCamera();
      }
    }
  }

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => handleMediaProcessing(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleMediaProcessing = async (dataUri: string) => {
    setIsProcessingMedia(true)
    try {
      const compressed = await compressImage(dataUri)
      setPreviewMedia(compressed)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Media failed." });
    } finally {
      setIsProcessingMedia(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !registrationNumber) {
      toast({ variant: "destructive", title: "Registration ID Required", description: "Please enter your campus registration number." });
      return
    }
    if (!previewMedia) {
      toast({ variant: "destructive", title: "Proof Required", description: "Mandatory visual proof required." });
      return
    }

    setIsSubmitting(true)
    const reportData = {
      reporterId: user.uid,
      reporterName: user.displayName || user.email,
      reporterRegNo: registrationNumber,
      itemId: itemId || null,
      itemType: itemType,
      description,
      suspectDetails,
      locationName,
      locationCoords: location || null,
      mediaUrl: previewMedia,
      timestamp: new Date().toISOString(),
      status: "pending",
      rewardGiven: false
    }

    try {
      await addDocumentNonBlocking(collection(db, "theftReports"), reportData)
      if (itemId && itemType === 'clock') {
        updateDocumentNonBlocking(doc(db, "clockRoomItems", itemId), { 
          status: "under_investigation",
          lockReason: "Theft Report Filed",
          lockedAt: new Date().toISOString()
        })
      } else if (itemId && itemType === 'lost') {
        updateDocumentNonBlocking(doc(db, "items", itemId), { status: "Under Investigation" })
      }
      toast({ title: "Report Live", description: "Security dispatching..." })
      router.push("/dashboard")
    } catch (err) {
      toast({ variant: "destructive", title: "System Error", description: "Could not file report." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <div className="bg-destructive pt-12 pb-24 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-headline font-bold">Theft Report Protocol</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <CardContent className="p-6 space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl flex flex-col gap-2">
               <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider leading-relaxed">
                    Mandatory proof required for reward eligibility.
                  </p>
               </div>
               <div className="bg-destructive/10 p-3 rounded-xl">
                  <p className="text-[11px] font-bold text-destructive uppercase tracking-widest text-center">Your identity will remain secret</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Registration ID *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. 12200000" 
                      className="rounded-xl h-12 pl-10 bg-muted/20 border-none" 
                      value={registrationNumber} 
                      onChange={(e) => setRegistrationNumber(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button type="button" onClick={startCamera} variant="outline" className="rounded-xl h-14 border-destructive/20 text-destructive flex flex-col items-center justify-center gap-1">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Evidence Cam</span>
                  </Button>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl h-14 border-dashed border-2 flex flex-col items-center justify-center gap-1">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase">Attach Media</span>
                  </Button>
                </div>
              </div>

              <div className="relative w-full aspect-video rounded-2xl border-4 border-dashed border-destructive/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30">
                {previewMedia ? (
                  <Image src={previewMedia} alt="Proof" fill className="object-cover" />
                ) : (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visual Evidence Required</p>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Event Coordinates *</Label><Input placeholder="e.g. Block 34, 1st Floor Hallway" className="rounded-xl h-12 bg-muted/20 border-none" value={locationName} onChange={(e) => setLocationName(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Theft Narrative *</Label><Textarea placeholder="Explain what happened in detail..." className="rounded-xl min-h-[120px] bg-muted/20 border-none p-4 resize-none leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Suspect Details (Optional)</Label><Input placeholder="Appearance, clothing, direction of flight" className="rounded-xl h-12 bg-muted/20 border-none" value={suspectDetails} onChange={(e) => setSuspectDetails(e.target.value)} /></div>
              </div>

              <Button type="submit" disabled={isSubmitting || isProcessingMedia} className="w-full h-14 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold shadow-xl shadow-destructive/20 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldAlert className="h-5 w-5" /> Deploy Emergency Alert</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Theft Evidence Camera</DialogTitle>
            <DialogDescription>Snapshot proof of incident or suspect to assist security audit.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[3/4] w-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute top-4 right-4 z-20"><Button variant="ghost" size="icon" onClick={stopCamera} className="text-white bg-black/20 rounded-full"><X className="h-6 w-6" /></Button></div>
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
                <Alert variant="destructive"><AlertTitle>Camera Locked</AlertTitle><AlertDescription>Check browser permissions.</AlertDescription></Alert>
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

export default function TheftReport() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <TheftReportForm />
    </Suspense>
  )
}
