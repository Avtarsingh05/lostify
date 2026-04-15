
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Shield, Lock, Mail, ChevronRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function SecuritySettings() {
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  const [isReseting, setIsReseting] = useState(false)

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setIsReseting(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      toast({
        title: "Email Sent",
        description: `Password reset instructions sent to ${user.email}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not send reset email. Try again later.",
      })
    } finally {
      setIsReseting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Security</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Login Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div 
              onClick={handlePasswordReset}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">Change Password</p>
                  <p className="text-[10px] text-muted-foreground">Receive reset link via email</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                We recommend using a strong password. If you suspect any unusual activity, please reset your password immediately.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Email Verification</p>
                  <p className="text-[10px] text-muted-foreground">
                    {user?.emailVerified ? "Account is verified" : "Pending verification"}
                  </p>
                </div>
                <div className={`h-2 w-2 rounded-full ${user?.emailVerified ? 'bg-secondary' : 'bg-accent'} shadow-lg`} />
             </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
