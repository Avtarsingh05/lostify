"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, MapPin, Calendar, Clock, Tag, Send, Package, Loader2, Sparkles, Info, AlertTriangle } from "lucide-react"
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

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUri = reader.result as string
      setPreviewImage(dataUri)
      
      setIsScanning(true)
      try {
        const result = await foundItemAIDetails({ photoDataUri: dataUri })
        setFormData(prev => ({
          ...prev,
          name: result.itemName,
          category: result.category.toLowerCase(),
          description: result.attributes.join(", ")
        }))
        toast({
          title: "AI Analysis Complete",
          description: "Details auto-filled based on your photo.",
        })
      } catch (error) {
        toast({
          title: "AI Analysis Partial",
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
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-headline font-bold">Report Lost Item</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        <Alert className="bg-white/95 border-primary/20 rounded-2xl shadow-lg py-3">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-[10px] text-muted-foreground font-medium">
            AI can help fill the form. Upload a clear photo of the item if you have one.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="rounded-[28px] overflow-hidden shadow-xl border-none">
            <CardContent className="p-6 space-y-5">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Lost item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="font-headline font-bold text-xs">AI Analyzing...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-card p-3 rounded-full shadow-md">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add Item Image</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              {isScanning && (
                <div className="flex items-center gap-2 px-2 animate-pulse">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase">GenAI is filling details...</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="itemName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Item Name</Label>
                <div className="relative">
                  <Input 
                    id="itemName" 
                    placeholder="e.g. Silver Laptop" 
                    className="rounded-xl h-11 pl-9 text-sm" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({...formData, category: val})} 
                  required
                >
                  <SelectTrigger className="rounded-xl h-11 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="wallet">Wallet / Purse</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Distinctive marks, brand, color..." 
                  className="rounded-xl min-h-[80px] text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Last Seen</Label>
                <div className="relative">
                  <Input 
                    id="location" 
                    placeholder="Where did you last see it?" 
                    className="rounded-xl h-11 pl-9 text-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required 
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    className="rounded-xl h-11 text-xs"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    className="rounded-xl h-11 text-xs"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || isScanning} 
            className="w-full rounded-2xl gradient-header h-14 text-sm font-headline font-bold shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit Report
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
