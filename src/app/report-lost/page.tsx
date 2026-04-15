
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, MapPin, Calendar, Clock, Tag, Send, Package, Loader2 } from "lucide-react"
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
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"

export default function ReportLost() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    date: "",
    time: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

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
      latitude: 0, // Placeholder
      longitude: 0, // Placeholder
      imageUrl: "https://picsum.photos/seed/lost/600/400",
      reportedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    }

    addDocumentNonBlocking(itemsRef, itemData)
      .then(() => {
        toast({
          title: "Success!",
          description: "Lost item reported successfully. We'll notify you if we find matches.",
        })
        router.push("/dashboard")
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
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
                  <Input 
                    id="itemName" 
                    placeholder="e.g. Leather Wallet" 
                    className="rounded-xl" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Category
                  </Label>
                  <Select onValueChange={(val) => setFormData({...formData, category: val})} required>
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
                <Textarea 
                  id="description" 
                  placeholder="Describe unique features..." 
                  className="rounded-xl min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Last Seen Location
                </Label>
                <Input 
                  id="location" 
                  placeholder="Address, venue or landmark" 
                  className="rounded-xl"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date Lost
                  </Label>
                  <Input 
                    id="date" 
                    type="date" 
                    className="rounded-xl"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Approx. Time
                  </Label>
                  <Input 
                    id="time" 
                    type="time" 
                    className="rounded-xl"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-2xl gradient-header h-16 text-lg font-headline font-bold shadow-xl flex items-center gap-3">
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
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
