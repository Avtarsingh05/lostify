"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { foundItemAIDetails, type FoundItemAIDetailsOutput } from "@/ai/flows/found-item-ai-details-flow"
import Image from "next/image"

export default function ReportFound() {
  const router = useRouter()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [aiData, setAiData] = useState<FoundItemAIDetailsOutput | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUri = reader.result as string
      setPreviewImage(dataUri)
      
      // Trigger AI scanning
      setIsScanning(true)
      try {
        const result = await foundItemAIDetails({ photoDataUri: dataUri })
        setAiData(result)
        toast({
          title: "AI Analysis Complete",
          description: "Details have been auto-filled based on your photo.",
        })
      } catch (error) {
        console.error(error)
        toast({
          title: "AI Scanning Failed",
          description: "Could not analyze image. Please fill details manually.",
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
      toast({
        title: "Report Received!",
        description: "Found item reported. Thank you for being a good citizen!",
      })
      router.push("/")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-success pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-headline font-bold">Report Found Item</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 -mt-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardContent className="p-8 flex flex-col gap-8">
              {/* Image Upload/Preview */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-video rounded-3xl border-2 border-dashed border-muted-foreground/20 overflow-hidden flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                {previewImage ? (
                  <>
                    <Image src={previewImage} alt="Found item" fill className="object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="font-headline font-semibold text-lg">AI is identifying your item...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-card p-4 rounded-full shadow-lg">
                      <Camera className="h-8 w-8 text-secondary" />
                    </div>
                    <p className="mt-4 font-medium text-muted-foreground">Tap to take photo or upload</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>

              {/* AI Badge */}
              {aiData && (
                <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up">
                  <div className="bg-secondary p-2 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary">AI Enhanced</p>
                    <p className="text-xs text-muted-foreground">Information auto-extracted from image</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <div className="relative">
                    <Input 
                      id="itemName" 
                      defaultValue={aiData?.itemName || ""} 
                      placeholder="e.g. Black Backpack" 
                      className={`rounded-xl ${aiData ? 'border-secondary/50 bg-secondary/5' : ''}`}
                      required 
                    />
                    {aiData && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    defaultValue={aiData?.category || ""} 
                    placeholder="e.g. Electronics" 
                    className={`rounded-xl ${aiData ? 'border-secondary/50 bg-secondary/5' : ''}`}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attributes">Attributes</Label>
                  <div className="flex flex-wrap gap-2">
                    {aiData?.attributes.map((attr, i) => (
                      <span key={i} className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full border border-secondary/20">
                        {attr}
                      </span>
                    ))}
                    {!aiData && <p className="text-sm text-muted-foreground italic">Attributes will appear after photo upload</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage">Storage Info / Current Location</Label>
                  <div className="relative">
                    <Input 
                      id="storage" 
                      placeholder="e.g. Held at Information Desk" 
                      className="rounded-xl pr-10" 
                      required 
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" placeholder="Any extra details for identification..." className="rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSubmitting || isScanning} className="rounded-2xl gradient-success h-16 text-lg font-headline font-bold shadow-xl flex items-center gap-3">
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="h-6 w-6" /> Report Found Item
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
