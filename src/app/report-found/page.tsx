
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

export default function ReportFound() {
  const router = useRouter()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [aiData, setAiData] = useState<FoundItemAIDetailsOutput | null>(null)
  const [step, setStep] = useState(1)
  
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
          title: "AI Scanning Failed",
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
    setIsSubmitting(true)
    
    setTimeout(() => {
      setStep(3)
      toast({
        title: "Report Submitted!",
        description: "The handover has been logged securely.",
      })
      setTimeout(() => router.push("/dashboard"), 2000)
    }, 1500)
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-12 w-12 text-secondary" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-2">Thank You!</h2>
        <p className="text-muted-foreground mb-8">Your honest deed has been recorded. Redirecting you to dashboard...</p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-success pt-10 pb-24 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Report Found Item</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-12 space-y-6">
        <Alert className="bg-white/90 backdrop-blur-md border-secondary/20 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4">
          <Info className="h-4 w-4 text-secondary" />
          <AlertTitle className="font-bold text-secondary">Campus Protocol</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Hand over the item to a **Security Guard** and record their details for verification.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-secondary" /> 1. Item Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-square rounded-3xl border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
              >
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Found item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="font-headline font-semibold text-sm">AI identifying item...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-card p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="h-8 w-8 text-secondary" />
                    </div>
                    <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center px-4">
                      Snap item photo
                    </p>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              {aiData && (
                <div className="bg-secondary/5 border border-secondary/10 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">AI Identified</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-card text-[10px] border-secondary/20">{aiData.itemName}</Badge>
                    <Badge variant="outline" className="bg-white dark:bg-card text-[10px] border-secondary/20">{aiData.category}</Badge>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="foundLocation" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Discovery Location
                </Label>
                <div className="relative">
                  <Input id="foundLocation" placeholder="e.g. Canteen Table #4" className="rounded-xl pl-10 h-12" required />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardHeader className="pb-0 pt-8 px-8">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> 2. Handover Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guardName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Guard Name</Label>
                  <div className="relative">
                    <Input id="guardName" placeholder="Full name" className="rounded-xl pl-10 h-12" required />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guardId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Badge Number</Label>
                  <div className="relative">
                    <Input id="guardId" placeholder="e.g. SEC-1042" className="rounded-xl pl-10 h-12" required />
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guardPost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Security Post</Label>
                  <div className="relative">
                    <Input id="guardPost" placeholder="e.g. Main Gate Desk" className="rounded-xl pl-10 h-12" required />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || isScanning} 
            className="w-full rounded-2xl gradient-success h-16 text-lg font-headline font-bold shadow-xl flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" /> Logging...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" /> Submit Handover
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
