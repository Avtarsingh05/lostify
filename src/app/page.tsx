"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, Lock, ArrowRight, Sparkles, UserPlus, Fingerprint, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, errorEmitter } from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  // Handle errors from the global emitter
  useEffect(() => {
    const handleAuthError = (error: Error) => {
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Please check your credentials.",
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
        title: "Invalid Domain",
        description: "Only official @gmail.com addresses are permitted.",
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
      })
      return
    }
    
    setIsLoading(true)
    if (isSignup) {
      initiateEmailSignUp(auth, email, password)
      toast({ title: "Registering", description: "Securing your profile..." })
    } else {
      initiateEmailSignIn(auth, email, password)
      toast({ title: "Authenticating", description: "Verifying credentials..." })
    }
  }

  const handlePhoneAuth = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Campus Security Note",
      description: "SMS Verification is currently being upgraded for your region.",
    })
  }

  const toggleAuthMode = () => {
    setIsSignup(!isSignup)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-background">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-[24px] gradient-header shadow-2xl flex items-center justify-center text-white mb-2 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Sparkles className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">Lostify</h1>
            <p className="text-muted-foreground font-medium text-sm mt-1 uppercase tracking-widest">Premium Lost & Found</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-card/90 backdrop-blur-2xl">
          <CardHeader className="pb-2 pt-8">
            <div className="flex justify-center mb-6">
               <h2 className="text-2xl font-headline font-bold">
                 {isSignup ? "Create Account" : "Welcome Back"}
               </h2>
            </div>
            
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted h-12">
                <TabsTrigger value="email" className="rounded-xl font-bold text-xs uppercase tracking-tighter">Email Access</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-xl font-bold text-xs uppercase tracking-tighter">Phone</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-6 space-y-5">
                <form onSubmit={handleEmailAuth} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Gmail Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="username@gmail.com" 
                        className="pl-12 rounded-2xl h-14 bg-muted/30 border-none shadow-sm focus-visible:ring-2"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                      {!isSignup && (
                        <button type="button" className="text-[10px] font-bold text-primary hover:underline">
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        className="pl-12 rounded-2xl h-14 bg-muted/30 border-none shadow-sm focus-visible:ring-2" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl gradient-header font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isLoading}>
                    {isLoading ? (isSignup ? "Creating..." : "Checking...") : (isSignup ? "Start Journey" : "Sign In")} 
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="pt-6 space-y-5">
                <form onSubmit={handlePhoneAuth} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Mobile Number</Label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-4 flex items-center gap-2 text-muted-foreground border-r pr-3 py-1 mr-2">
                        <Fingerprint className="h-4 w-4" />
                        <span className="text-sm font-bold text-foreground">+91</span>
                      </div>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="98765 43210" 
                        className="pl-24 rounded-2xl h-14 bg-muted/30 border-none shadow-sm focus-visible:ring-2"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required 
                      />
                    </div>
                  </div>
                  
                  <Alert className="bg-primary/5 border-none rounded-2xl">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-[10px] font-medium leading-relaxed">
                      Verification code will be sent to your registered campus mobile number.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full h-14 rounded-2xl gradient-header font-bold text-lg shadow-xl" disabled={isLoading}>
                    {isLoading ? "Sending OTP..." : "Get Access OTP"} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
          
          <CardContent className="pb-10 pt-8">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-card px-4 text-muted-foreground/60">New to Lostify?</span></div>
              </div>
              
              <button 
                type="button"
                onClick={toggleAuthMode}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-all group"
              >
                {isSignup ? (
                  <>Already registered? <span className="underline group-hover:no-underline">Sign In</span></>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Don't have an account? <span className="underline group-hover:no-underline">Create One</span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground/60 px-10 leading-relaxed font-medium">
          By continuing, you agree to the <span className="underline cursor-pointer hover:text-primary transition-colors">Campus Community Guidelines</span> and <span className="underline cursor-pointer hover:text-primary transition-colors">Privacy Shield</span>.
        </p>
      </div>
    </div>
  )
}
