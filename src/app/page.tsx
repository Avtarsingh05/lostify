"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  UserIcon, 
  Loader2, 
  Info, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Package, 
  Globe,
  Phone,
  Smartphone,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  useAuth, 
  useUser, 
  initiateEmailSignIn, 
  initiateEmailSignUp, 
  initiateGoogleSignIn,
  errorEmitter, 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  setUpRecaptcha,
  sendOtpToPhone
} from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { doc } from "firebase/firestore"
import Image from "next/image"
import { ConfirmationResult } from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMode] = useState<"phone" | "email">("phone")
  const [isSignup, setIsSignup] = useState(false)
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isOtpSent, setIsOtpSent] = useState(false)

  // Email Auth State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")

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
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Account not found. Please signup.",
        })
        setIsSignup(true)
        return
      }

      toast({
        variant: "destructive",
        title: "Auth Error",
        description: error.message || "Something went wrong.",
      })
    }
    errorEmitter.on('auth-error', handleAuthError)
    return () => errorEmitter.off('auth-error', handleAuthError)
  }, [toast])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return

    if (!isOtpSent) {
      // Step 1: Send OTP
      if (phoneNumber.length < 10) {
        toast({ variant: "destructive", title: "Invalid Number", description: "Enter a valid 10-digit mobile number." })
        return
      }

      setIsLoading(true)
      try {
        const fullPhone = `+91${phoneNumber}`
        const verifier = setUpRecaptcha(auth, 'recaptcha-container')
        const result = await sendOtpToPhone(auth, fullPhone, verifier)
        setConfirmationResult(result)
        setIsOtpSent(true)
        toast({ title: "OTP Dispatched", description: `Sent to ${fullPhone}` })
      } catch (err: any) {
        console.error(err)
        toast({ variant: "destructive", title: "OTP Failed", description: err.message })
      } finally {
        setIsLoading(false)
      }
    } else {
      // Step 2: Verify OTP
      if (!confirmationResult || verificationCode.length < 6) return
      setIsLoading(true)
      try {
        await confirmationResult.confirm(verificationCode)
        toast({ title: "Verified", description: "Login successful!" })
        router.push("/dashboard")
      } catch (err: any) {
        toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect." })
      } finally {
        setIsLoading(false)
      }
    }
  }

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

    if (isSignup && (!nickname || !registrationNumber)) {
        toast({
          variant: "destructive",
          title: "Missing Info",
          description: "All fields are mandatory for registration.",
        })
        return
    }
    
    setIsLoading(true)
    if (isSignup) {
      localStorage.setItem('pending_nickname', nickname)
      localStorage.setItem('pending_regno', registrationNumber)
      initiateEmailSignUp(auth, email, password)
    } else {
      initiateEmailSignIn(auth, email, password)
    }
  }

  const handleGoogleSignIn = () => {
    if (!auth) return
    setIsLoading(true)
    initiateGoogleSignIn(auth)
  }

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-background">
      <div className="hidden lg:flex flex-1 relative overflow-hidden gradient-header items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Zap className="absolute top-10 left-10 h-64 w-64" />
          <ShieldCheck className="absolute bottom-10 right-10 h-80 w-80" />
        </div>
        <div className="relative z-10 max-w-xl space-y-8 text-white">
          <div className="space-y-4">
             <div className="w-24 h-24 rounded-[32px] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/30">
               {systemConfig?.appLogo ? (
                 <Image src={systemConfig.appLogo} alt="Logo" width={80} height={80} className="object-contain" />
               ) : (
                 <Sparkles className="h-12 w-12" />
               )}
             </div>
             <h1 className="text-6xl font-headline font-bold leading-tight">Campus Recovery <br/> Redefined.</h1>
             <p className="text-xl text-white/80 font-medium leading-relaxed">
               Lostify leverages artificial intelligence to reconnect students with their missing belongings instantly. Secure, verified, and community-driven.
             </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-sm lg:max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="w-20 h-20 rounded-[32px] gradient-header shadow-2xl flex items-center justify-center text-white mb-2 rotate-2 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
              {systemConfig?.appLogo ? (
                <Image src={systemConfig.appLogo} alt="University Logo" fill className="object-cover" />
              ) : (
                <Sparkles className="h-10 w-10" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Lostify</h1>
              <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest">Premium Lost & Found</p>
            </div>
          </div>

          <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/95 backdrop-blur-xl lg:border lg:border-border/50">
            <CardHeader className="pb-2 pt-6">
              <Tabs value={loginMethod} className="w-full" onValueChange={(v: any) => setLoginMode(v)}>
                <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-muted h-12">
                  <TabsTrigger value="phone" className="rounded-lg font-bold text-[10px] uppercase tracking-tight gap-2">
                    <Smartphone className="h-3 w-3" /> Mobile OTP
                  </TabsTrigger>
                  <TabsTrigger value="email" className="rounded-lg font-bold text-[10px] uppercase tracking-tight gap-2">
                    <Mail className="h-3 w-3" /> Email
                  </TabsTrigger>
                </TabsList>
                
                <div className="pt-6">
                  {loginMethod === "phone" ? (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          {isOtpSent ? "Verification Code" : "Mobile Number"}
                        </Label>
                        {!isOtpSent ? (
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-bold text-primary">
                              <Smartphone className="h-4 w-4" />
                              <span>+91</span>
                            </div>
                            <Input 
                              placeholder="9876543210" 
                              className="pl-16 rounded-xl h-14 bg-muted/20 border-none shadow-none text-lg font-bold tracking-widest"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              maxLength={10}
                              required 
                            />
                          </div>
                        ) : (
                          <div className="relative group">
                            <Input 
                              placeholder="000000" 
                              className="rounded-xl h-14 bg-muted/20 border-none shadow-none text-center text-3xl font-mono font-black tracking-[0.5em]"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              autoFocus
                              required 
                            />
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full h-14 rounded-xl gradient-header font-bold text-sm shadow-lg active:scale-95 transition-all" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : isOtpSent ? (
                          "Verify Identity"
                        ) : (
                          "Send OTP Code"
                        )}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>

                      {isOtpSent && (
                        <button 
                          type="button" 
                          onClick={() => { setIsOtpSent(false); setVerificationCode(""); }}
                          className="w-full text-[10px] font-bold uppercase text-primary hover:underline"
                        >
                          Change Mobile Number
                        </button>
                      )}
                    </form>
                  ) : (
                    <div className="space-y-4">
                       <Tabs value={isSignup ? "signup" : "signin"} onValueChange={(v) => setIsSignup(v === 'signup')}>
                          <TabsList className="grid w-full grid-cols-2 rounded-lg p-0.5 bg-muted/50 h-8 mb-4">
                             <TabsTrigger value="signin" className="text-[8px] uppercase font-bold">Login</TabsTrigger>
                             <TabsTrigger value="signup" className="text-[8px] uppercase font-bold">Register</TabsTrigger>
                          </TabsList>
                          
                          <form onSubmit={handleEmailAuth} className="space-y-4">
                            {isSignup && (
                              <>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Full Name</Label>
                                <div className="relative group">
                                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Campus Name" className="pl-10 rounded-xl h-12 bg-muted/20 border-none" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Registration No.</Label>
                                <div className="relative group">
                                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="e.g. 12200000" className="pl-10 rounded-xl h-12 bg-muted/20 border-none" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                                </div>
                              </div>
                              </>
                            )}

                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Gmail Address</Label>
                              <Input type="email" placeholder="user@gmail.com" className="rounded-xl h-12 bg-muted/20 border-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                              <Input type="password" placeholder="••••••••" className="rounded-xl h-12 bg-muted/20 border-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>

                            <Button type="submit" className="w-full h-14 rounded-xl gradient-header font-bold text-sm shadow-lg" disabled={isLoading}>
                              {isLoading ? "Working..." : (isSignup ? "Join Now" : "Sign In")} 
                              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                          </form>
                       </Tabs>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardHeader>
            
            <CardContent className="pb-8 pt-4 space-y-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.2em]"><span className="bg-card px-2 text-muted-foreground/60">OR</span></div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleSignIn}
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-3 hover:bg-muted transition-all"
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center justify-center gap-2 animate-pulse">
                   <Globe className="h-3 w-3 text-primary" />
                   <p className="text-[9px] font-bold text-primary uppercase tracking-tight">Login will open in browser for secure authentication</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="pt-4 text-center space-y-1 opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Lostify Recovery Network</p>
          </div>
        </div>
      </div>
      <div id="recaptcha-container" />
    </div>
  )
}
