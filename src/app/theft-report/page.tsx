
"use client"

import { useState, useRef, useEffect } from "react"
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
  Lock
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

export default function TheftReport() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const itemId = searchParams.get('itemId')
  const itemType = searchParams.get('type') || 'lost' // 'lost' or 'clock'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingMedia, setIsProcessingMedia] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<string | null>(null)
  const [location, setLocation] = useState<any>(null)
  
  const [description, setDescription] = useState("")
  const [suspectDetails, setSuspectDetails] = useState("")
  const [locationName, setLocationName] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/")
    
    // Auto-get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS Access Denied:", err)
      )
    }
  }, [user, isUserLoading, router])

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const initialSizeMB = file.size / (1024 * 1024);
    if (initialSizeMB > 15) {
      toast({ variant: "destructive", title: "File Too Large", description: "Max 15MB allowed." });
      return;
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUri = reader.result as string
      setIsProcessingMedia(true)
      try {
        const compressed = await compressImage(dataUri)
        setPreviewMedia(compressed)
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Could not process media." });
      } finally {
        setIsProcessingMedia(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return
    if (!previewMedia) {
      toast({ variant: "destructive", title: "Proof Required", description: "Mandatory photo/video proof for security verify." });
      return
    }

    setIsSubmitting(true)
    const reportData = {
      reporterId: user.uid,
      reporterName: user.displayName || user.email,
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
      
      // IF CLOCK ROOM ITEM, LOCK IT
      if (itemId && itemType === 'clock') {
        const itemRef = doc(db, "clockRoomItems", itemId)
        updateDocumentNonBlocking(itemRef, { 
          status: "under_investigation",
          lockReason: "Theft Report Filed",
          lockedAt: new Date().toISOString()
        })
      } else if (itemId && itemType === 'lost') {
        const itemRef = doc(db, "items", itemId)
        updateDocumentNonBlocking(itemRef, { status: "Under Investigation" })
      }

      toast({ title: "Report Submitted", description: "Security notified. Checking proof..." })
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
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">Theft Report Protocol</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
          <CardContent className="p-6 space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl flex items-start gap-3">
               <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
               <p className="text-[10px] text-destructive font-bold uppercase tracking-wider leading-relaxed">
                 Warning: False reporting is a campus offense. Mandatory proof required for +100 point reward.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-video rounded-2xl border-4 border-dashed border-destructive/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 group cursor-pointer"
              >
                {previewMedia ? (
                  <Image src={previewMedia} alt="Proof" fill className="object-cover" />
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-destructive/40 group-hover:scale-110 transition-transform" />
                    <p className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mandatory Evidence</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Event Coordinates *</Label>
                  <Input 
                    placeholder="e.g. Block 34, 1st Floor Hallway" 
                    className="rounded-xl h-12 bg-muted/20 border-none" 
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Theft Narrative *</Label>
                  <Textarea 
                    placeholder="Explain what happened in detail..." 
                    className="rounded-xl min-h-[120px] bg-muted/20 border-none p-4 resize-none leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Suspect Details (Optional)</Label>
                  <Input 
                    placeholder="Clothes, appearance, direction of flight" 
                    className="rounded-xl h-12 bg-muted/20 border-none"
                    value={suspectDetails}
                    onChange={(e) => setSuspectDetails(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || isProcessingMedia}
                className="w-full h-14 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold shadow-xl shadow-destructive/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldAlert className="h-5 w-5" /> Deploy Emergency Alert</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-muted/10 p-5 rounded-2xl text-center opacity-40">
           <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Lostify Security Response Layer v1.0</p>
        </div>
      </main>
    </div>
  )
}
