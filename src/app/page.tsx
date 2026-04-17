
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, ArrowRight, Sparkles, UserIcon, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, errorEmitter, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { doc } from "firebase/firestore"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")

  // Branding Integration
  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    const handleAuthError = (error: any) => {
      setIsLoading(false)
      let message = "Something went wrong."
      
      if (error.code === 'auth/user-not-found') {
        message = "Account not found. Register now?"
        setIsSignup(true)
      } else if (error.code === 'auth/wrong-password') {
        message = "Wrong password."
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Email already used. Log in?"
        setIsSignup(false)
      } else if (error.code === 'auth/weak-password') {
        message = "Password is too short."
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email format."
      }

      toast({
        variant: "destructive",
        title: "Access Denied",
        description: message,
      })
    }
    errorEmitter.on('auth-error', handleAuthError)
    return () => errorEmitter.off('auth-error', handleAuthError)
  }, [toast])

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.endsWith("@gmail.com")) {
      toast({
        variant: "destructive",
        title: "Domain Error",
        description: "Only @gmail.com is allowed.",
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Error",
        description: "Use at least 6 characters.",
      })
      return
    }
    
    setIsLoading(true)
    if (isSignup) {
      initiateEmailSignUp(auth, email, password, nickname)
    } else {
      initiateEmailSignIn(auth, email, password)
    }
  }

  // Robust loading state to prevent flicker
  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-background">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[32px] gradient-header shadow-2xl flex items-center justify-center text-white mb-2 rotate-2 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
            {systemConfig?.appLogo ? (
              <Image 
                src={systemConfig.appLogo} 
                alt="University Logo" 
                fill 
                className="object-cover"
              />
            ) : (
              <Sparkles className="h-10 w-10 lg:h-12 lg:w-12" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Lostify</h1>
            <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest">Premium Lost & Found</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-6">
            <div className="flex justify-center mb-4">
               <h2 className="text-xl font-headline font-bold">
                 {isSignup ? "Create Account" : "Welcome Back"}
               </h2>
            </div>
            
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-muted h-10">
                <TabsTrigger value="email" className="rounded-lg font-bold text-[10px] uppercase tracking-tight">Email</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-lg font-bold text-[10px] uppercase tracking-tight">Phone</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-4 space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {isSignup && (
                    <div className="space-y-1">
                      <Label htmlFor="nickname" className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Nickname</Label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          id="nickname" 
                          placeholder="What should we call you?" 
                          className="pl-10 rounded-xl h-12 bg-muted/20 border-none shadow-none focus-visible:ring-1"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Gmail Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="user@gmail.com" 
                        className="pl-10 rounded-xl h-12 bg-muted/20 border-none shadow-none focus-visible:ring-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        className="pl-10 rounded-xl h-12 bg-muted/20 border-none shadow-none focus-visible:ring-1" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl gradient-header font-bold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={isLoading}>
                    {isLoading ? "Working..." : (isSignup ? "Join Now" : "Sign In")} 
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="pt-4 space-y-4">
                <div className="text-center p-4">
                   <p className="text-xs text-muted-foreground">Phone authentication is temporarily restricted to staff.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
          
          <CardContent className="pb-8 pt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.2em]"><span className="bg-card px-2 text-muted-foreground/60">OR</span></div>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-xs font-bold text-primary hover:opacity-80 transition-all underline decoration-primary/30 underline-offset-4"
              >
                {isSignup ? "Already have an account? Log In" : "New here? Register Now"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 text-center space-y-1 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Made with Love ❤️ Lostify</p>
          <p className="text-[9px] font-medium">Powered by Igloo Enterprises</p>
        </div>
      </div>
    </div>
  )
}
