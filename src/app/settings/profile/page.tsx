
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Phone, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useUser, useAuth } from "@/firebase"
import { updateProfile } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function ProfileSettings() {
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const { toast } = useToast()
  
  const [nickname, setNickname] = useState(user?.displayName || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) return

    setIsLoading(true)
    try {
      await updateProfile(auth.currentUser, {
        displayName: nickname
      })
      toast({
        title: "Profile Updated",
        description: "Your nickname has been successfully changed.",
      })
      router.back()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Profile</h1>
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

              <div className="space-y-1.5 opacity-60">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email (Immutable)</Label>
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

              <div className="space-y-1.5 opacity-60">
                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Recovery Phone</Label>
                <div className="relative">
                  <Input 
                    id="phone" 
                    value={user?.phoneNumber || "Not set"} 
                    disabled 
                    className="rounded-xl h-12 pl-10 bg-muted/30"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={isLoading || nickname === user?.displayName}
            className="w-full h-14 rounded-2xl gradient-header font-bold text-md shadow-xl flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </Button>
        </form>
      </main>
    </div>
  )
}
