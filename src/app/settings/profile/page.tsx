"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Phone, Save, Loader2, Camera, UserCircle, UploadCloud, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { updateProfile } from "firebase/auth"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ProfileSettings() {
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [nickname, setNickname] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current user data from Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (user) {
      setNickname(user.displayName || "")
      setPreviewUrl(user.photoURL || "")
    }
  }, [user])

  useEffect(() => {
    if (userData) {
      setPhoneNumber(userData.phoneNumber || "")
      setRegistrationNumber(userData.registrationNumber || "")
      if (userData.photoURL) setPreviewUrl(userData.photoURL)
    }
  }, [userData])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser || !db) return

    setIsLoading(true)
    try {
      let photoURL = userData?.photoURL || auth.currentUser.photoURL || ""

      // Upload to Cloudinary if a new image is selected
      if (imageFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", imageFile)
        formData.append("upload_preset", "admin_banner_upload")
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/dian1nfyk/image/upload`, {
          method: "POST",
          body: formData,
        })
        
        if (!res.ok) throw new Error("Image upload failed")
        const data = await res.json()
        photoURL = data.secure_url
        setIsUploading(false)
      }

      // 1. Update Firestore User Document (Primary for our UI)
      const userRef = doc(db, "users", auth.currentUser.uid)
      updateDocumentNonBlocking(userRef, {
        username: nickname,
        phoneNumber: phoneNumber,
        registrationNumber: registrationNumber,
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      })

      // 2. Update Firebase Auth Profile (Secondary, non-critical)
      updateProfile(auth.currentUser, {
        displayName: nickname,
        photoURL: photoURL
      }).catch(err => console.error("Auth profile update failed:", err))

      toast({
        title: "Profile Saved",
        description: "Your details have been updated instantly.",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      })
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white text-center">
        <div className="max-w-md mx-auto flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Edit Profile</h1>
          <div className="w-9" />
        </div>

        <div className="relative inline-block">
          <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
            <AvatarImage src={previewUrl} />
            <AvatarFallback className="bg-primary text-white text-2xl">
              {nickname?.charAt(0).toUpperCase() || <UserCircle className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageChange} 
          />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10">
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
            <CardHeader className="pb-0 pt-8 px-8">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Nickname</Label>
                <Input 
                  id="nickname" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your campus nickname" 
                  className="rounded-xl h-12"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registrationNumber" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Registration Number</Label>
                <div className="relative">
                  <Input 
                    id="registrationNumber" 
                    value={registrationNumber} 
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. 12200000"
                    className="rounded-xl h-12 pl-10"
                    required
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
                <div className="relative">
                  <Input 
                    id="phone" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="rounded-xl h-12 pl-10"
                    required
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5 opacity-60">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email (Official)</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="rounded-xl h-12 pl-10 bg-muted/30"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={isLoading || isDocLoading}
            className="w-full h-14 rounded-2xl gradient-header font-bold text-md shadow-xl flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <UploadCloud className="h-5 w-5 animate-bounce" />
                Uploading Photo...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
