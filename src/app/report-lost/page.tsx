"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, MapPin, Calendar, Clock, Tag, Send, Package, Loader2, Sparkles, Info, AlertTriangle, LayoutGrid, ShieldCheck } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compressImage, getDataUriSizeMB } from "@/lib/image-utils"

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
        setFormData(prev => ({
          ...prev,
          name: result.itemName,
          category: result.category.toLowerCase(),
          description: result.attributes.join(", ")
        }))
        toast({
          title: "Photo Optimized",
          description: "AI identified item details automatically.",
        })
      } catch (error) {
        toast({
          title: "Processing Partial",
          description: "Could not identify all details. Please fill manually.",
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
        toast({
          title: "Success!",
          description: "Lost report active. We'll monitor for matches.",
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
      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">Report Lost Item</h1>
        </div>
      </div>

      {/* WEB HEADER */}
      <div className="hidden lg:flex gradient-header pt-24 pb-48 px-10 rounded-b-[80px] shadow-2xl text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
           <div className="flex items-center gap-8">
              <button onClick={() => router.back()} className="bg-white/20 p-4 rounded-full hover:bg-white/30 transition-all">
                <ArrowLeft className="h-8 w-8" />
              </button>
              <div>
                <h1 className="text-6xl font-headline font-bold">Reporting Portal</h1>
                <p className="text-xl text-white/70 mt-2">Log details of your missing property for campus-wide radar monitoring</p>
              </div>
           </div>
           <div className="bg-white/20 p-8 rounded-[40px] shadow-2xl border border-white/10"><LayoutGrid className="h-12 w-12 text-white" /></div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24 space-y-6 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
           {/* Sidebar Info for Web */}
           <div className="hidden lg:flex lg:col-span-4 flex-col gap-8">
              <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl p-10 space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Protocol Rules</h3>
                    <div className="flex items-start gap-4">
                       <div className="bg-primary/10 p-3 rounded-2xl"><ShieldCheck className="h-6 w-6 text-primary" /></div>
                       <p className="text-sm text-muted-foreground leading-relaxed">Your registration number is automatically tagged to ensure verified ownership during recovery.</p>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="bg-accent/10 p-3 rounded-2xl"><Sparkles className="h-6 w-6 text-accent" /></div>
                       <p className="text-sm text-muted-foreground leading-relaxed">AI analyzes your image to extract metadata, making your item 4x more likely to be matched.</p>
                    </div>
                 </div>
              </Card>

              <Alert className="bg-primary/5 border-primary/20 rounded-[32px] p-8 shadow-xl">
                <Info className="h-6 w-6 text-primary" />
                <AlertDescription className="text-sm font-medium text-primary/80 mt-2 leading-relaxed">
                  Lost reports remain active on the campus gallery for 30 days. You will receive a push notification the moment a guard verifies a match.
                </AlertDescription>
              </Alert>
           </div>

           {/* Main Form Area */}
           <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl border-none bg-white dark:bg-card">
                  <CardContent className="p-6 lg:p-12 space-y-8">
                    <div className="lg:hidden">
                       <Alert className="bg-white/95 border-primary/20 rounded-2xl shadow-lg py-3 mb-6">
                         <Info className="h-4 w-4 text-primary" />
                         <AlertDescription className="text-[10px] text-muted-foreground font-medium">
                           AI can help fill the form. Upload a clear photo if available.
                         </AlertDescription>
                       </Alert>
                    </div>

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full aspect-[16/10] rounded-[32px] border-4 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                      {previewImage ? (
                        <>
                          <Image src={previewImage} alt="Lost item" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          {isScanning && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                              <Loader2 className="h-10 w-10 animate-spin mb-4" />
                              <p className="font-headline font-bold text-sm uppercase tracking-widest">GenAI Extracting Details...</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-2xl text-primary font-bold text-xs uppercase tracking-widest">Replace Snapshot</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white dark:bg-card p-6 rounded-full shadow-2xl border border-primary/10 group-hover:scale-110 transition-transform">
                            <Camera className="h-10 w-10 text-primary" />
                          </div>
                          <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Capture Item Visual</p>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-1.5 lg:space-y-3">
                         <Label htmlFor="itemName" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Item Headline *</Label>
                         <div className="relative group">
                           <Input 
                             id="itemName" 
                             placeholder="e.g. Silver Dell Laptop" 
                             className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20" 
                             value={formData.name}
                             onChange={(e) => setFormData({...formData, name: e.target.value})}
                             required 
                           />
                           <Tag className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                         </div>
                       </div>

                       <div className="space-y-1.5 lg:space-y-3">
                         <Label htmlFor="category" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
                         <Select 
                           value={formData.category} 
                           onValueChange={(val) => setFormData({...formData, category: val})} 
                           required
                         >
                           <SelectTrigger className="rounded-xl lg:rounded-2xl h-12 lg:h-16 text-sm lg:text-lg bg-muted/20 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                             <SelectValue placeholder="Select type" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl">
                             <SelectItem value="electronics">Electronics</SelectItem>
                             <SelectItem value="documents">Documents</SelectItem>
                             <SelectItem value="bags">Bags</SelectItem>
                             <SelectItem value="accessories">Accessories</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                    </div>

                    <div className="space-y-1.5 lg:space-y-3">
                      <Label htmlFor="description" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Specific Details</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Distinctive marks, brand names, color shades, or stickers..." 
                        className="rounded-xl lg:rounded-2xl min-h-[120px] text-sm lg:text-lg bg-muted/20 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 p-5 resize-none leading-relaxed"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5 lg:space-y-3">
                      <Label htmlFor="location" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Observed Location *</Label>
                      <div className="relative group">
                        <Input 
                          id="location" 
                          placeholder="e.g. Block 34 Library, 2nd Floor" 
                          className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg bg-muted/20 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          required 
                        />
                        <MapPin className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="date" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Incident Date *</Label>
                        <div className="relative">
                          <Input 
                            id="date" 
                            type="date" 
                            className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-xs lg:text-lg bg-muted/20 border-none"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            required 
                          />
                          <Calendar className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                        </div>
                      </div>
                      <div className="space-y-1.5 lg:space-y-3">
                        <Label htmlFor="time" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Approx. Time</Label>
                        <div className="relative">
                          <Input 
                            id="time" 
                            type="time" 
                            className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-xs lg:text-lg bg-muted/20 border-none"
                            value={formData.time}
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                          />
                          <Clock className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting || isScanning} 
                  className="w-full rounded-3xl lg:rounded-[40px] gradient-header h-16 lg:h-24 text-base lg:text-2xl font-headline font-bold shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 lg:h-10 lg:w-10 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-6 w-6 lg:h-8 lg:w-8" /> Broadcast Lost Alert
                    </>
                  )}
                </Button>

                <p className="text-[10px] lg:text-xs text-center text-muted-foreground uppercase tracking-[0.2em] font-bold py-6 opacity-60">
                   * MANDATORY FIELD FOR PROTOCOL COMPLIANCE
                </p>
              </form>
           </div>
        </div>
      </main>
    </div>
  )
}
