
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Phone, Save, Loader2, Camera, UserCircle, UploadCloud, CreditCard, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
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
  const [isInitialized, setIsInitialized] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef)

  useEffect(() => {
    if (userData && !isInitialized) {
      setNickname(userData.username || user?.displayName || "")
      setPhoneNumber(userData.phoneNumber || "")
      setRegistrationNumber(userData.registrationNumber || "")
      if (userData.photoURL) setPreviewUrl(userData.photoURL)
      setIsInitialized(true)
    } else if (user && !isInitialized && !userData) {
      setNickname(user.displayName || "")
      setPreviewUrl(user.photoURL || "")
    }
  }, [userData, user, isInitialized])

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

    if (!nickname.trim() || !phoneNumber.trim() || !registrationNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Incomplete Profile",
        description: "Nickname, Registration Number, and Phone Number are mandatory.",
      })
      return
    }

    setIsLoading(true)
    try {
      let photoURL = previewUrl || userData?.photoURL || auth.currentUser.photoURL || ""

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

      const userRef = doc(db, "users", auth.currentUser.uid)
      setDocumentNonBlocking(userRef, {
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
        username: nickname,
        phoneNumber: phoneNumber,
        registrationNumber: registrationNumber,
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      updateProfile(auth.currentUser, {
        displayName: nickname,
        photoURL: photoURL
      }).catch(err => console.error("Auth profile update failed:", err))

      toast({
        title: "Profile Saved",
        description: "Your details have been updated instantly.",
      })
      
      setTimeout(() => router.push("/dashboard"), 500)
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
      {/* MOBILE HEADER */}
      <div className="lg:hidden gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white text-center">
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
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
                <h1 className="text-6xl font-headline font-bold">Account Registry</h1>
                <p className="text-xl text-white/70 mt-2">Manage your verified campus identity and profile metadata</p>
              </div>
           </div>
           <div className="bg-white/20 p-8 rounded-[40px] shadow-2xl border border-white/10"><UserCircle className="h-12 w-12 text-white" /></div>
        </div>
      </div>

      <main className="max-w-md lg:max-w-5xl mx-auto px-4 lg:px-10 -mt-10 lg:-mt-24">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Avatar Section for Web (Sidebar-like) */}
          <div className="hidden lg:block lg:col-span-4">
             <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-card/80 backdrop-blur-xl p-10 text-center space-y-8 sticky top-32">
                <div className="relative inline-block mx-auto group">
                   <Avatar className="h-48 w-48 border-8 border-primary/10 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                      <AvatarImage src={previewUrl} />
                      <AvatarFallback className="bg-primary/5 text-primary text-6xl font-bold">{nickname?.charAt(0).toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <button 
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="absolute -bottom-4 -right-4 bg-white text-primary p-5 rounded-[24px] shadow-2xl border border-primary/10 hover:scale-110 transition-all"
                   >
                     <Camera className="h-8 w-8" />
                   </button>
                </div>
                <div>
                   <h3 className="text-2xl font-headline font-bold">{nickname || "New Student"}</h3>
                   <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1 font-bold">{userData?.registrationNumber || "Unverified ID"}</p>
                </div>
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] space-y-3">
                   <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
                   <p className="text-[11px] text-muted-foreground leading-relaxed">Verified identity ensures secure handovers within the university recovery system.</p>
                </div>
             </Card>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-xl rounded-[32px] lg:rounded-[48px] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="pb-0 pt-8 px-8 lg:p-12">
                <CardTitle className="text-xl lg:text-3xl font-headline font-bold flex items-center gap-4">
                  <User className="h-6 w-6 lg:h-10 lg:w-10 text-primary" /> Profile Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 lg:p-12 space-y-8">
                <div className="space-y-1.5 lg:space-y-3">
                  <Label htmlFor="nickname" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nickname *</Label>
                  <Input 
                    id="nickname" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Your campus nickname" 
                    className="rounded-xl lg:rounded-2xl h-12 lg:h-16 text-sm lg:text-lg lg:px-6"
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5 lg:space-y-3">
                    <Label htmlFor="registrationNumber" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Registration ID *</Label>
                    <div className="relative">
                      <Input 
                        id="registrationNumber" 
                        value={registrationNumber} 
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="e.g. 12200000"
                        className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg"
                        required
                      />
                      <CreditCard className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-3">
                    <Label htmlFor="phone" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number *</Label>
                    <div className="relative">
                      <Input 
                        id="phone" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9876543210"
                        className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 text-sm lg:text-lg"
                        required
                      />
                      <Phone className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 lg:space-y-3 opacity-60">
                  <Label htmlFor="email" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Official Registry Email</Label>
                  <div className="relative">
                    <Input id="email" value={user?.email || ""} disabled className="rounded-xl lg:rounded-2xl h-12 lg:h-16 pl-10 lg:pl-14 bg-muted/20" />
                    <Mail className="absolute left-3.5 lg:left-5 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground/40" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || isDocLoading}
                  className="w-full h-14 lg:h-20 rounded-2xl lg:rounded-3xl gradient-header font-bold text-base lg:text-xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-6"
                >
                  {isUploading ? (
                    <><UploadCloud className="h-6 w-6 animate-bounce" /> Syncing Visuals...</>
                  ) : isLoading ? (
                    <><Loader2 className="h-6 w-6 animate-spin" /> Finalizing Registry...</>
                  ) : (
                    <><Save className="h-6 w-6" /> Commit Changes</>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <p className="text-[10px] lg:text-xs text-center text-muted-foreground uppercase tracking-[0.2em] font-bold py-4">
              * MANDATORY REGISTRY FIELDS FOR CAMPUS PROTOCOL COMPLIANCE
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
