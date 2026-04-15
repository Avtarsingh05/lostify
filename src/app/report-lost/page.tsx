"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, MapPin, Calendar, Clock, Tag, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function ReportLost() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "Lost item reported successfully. We'll notify you if we find matches.",
        variant: "default",
      })
      router.push("/")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-accent pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-headline font-bold">Report Lost Item</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 -mt-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card className="rounded-[32px] overflow-hidden shadow-2xl border-none">
            <CardContent className="p-8 flex flex-col gap-8">
              {/* Image Upload Area */}
              <div className="w-full aspect-video rounded-3xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                <div className="bg-white dark:bg-card p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-4 font-medium text-muted-foreground">Upload Item Image (Optional)</p>
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Item Name
                  </Label>
                  <Input id="itemName" placeholder="e.g. Leather Wallet" className="rounded-xl" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Category
                  </Label>
                  <Select required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  Description
                </Label>
                <Textarea id="description" placeholder="Describe unique features, brand, or contents..." className="rounded-xl min-h-[120px]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Last Seen Location
                </Label>
                <Input id="location" placeholder="Address, venue or landmark" className="rounded-xl" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date Lost
                  </Label>
                  <Input id="date" type="date" className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Approx. Time
                  </Label>
                  <Input id="time" type="time" className="rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-2xl gradient-accent h-16 text-lg font-headline font-bold shadow-xl flex items-center gap-3">
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="h-6 w-6" /> Submit Report
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
