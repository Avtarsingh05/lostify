
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
  CheckCircle2,
  User as UserIconLucide
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
  errorEmitter, 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  setUpRecaptcha,
  sendOtpToPhone,
  setDocumentNonBlocking
} from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"
import { ConfirmationResult, User } from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMode] = useState<"phone" | "email">("phone")
  const [isSignup, setIsSignup] = useState(false)
  
  // Onboarding State
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [tempUser, setTempUser] = useState<User | null>(null)
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isOtpSent, setIsOtpSent] = useState(false)

  // Email Auth State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Onboarding Form State
  const [nickname, setNickname] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), [db])
  const { data: systemConfig } = useDoc(configRef)

  useEffect(() => {
    if (!isUserLoading && user && !isOnboarding) {
      // Check if user has profile data
      const checkProfile = async () => {
        const docSnap = await getDoc(doc(db, "users", user.uid))
        if (!docSnap.exists() || !docSnap.data().username) {
          setIsOnboarding(true)
          setTempUser(user)
        } else {
          router.push("/dashboard")
        }
      }
      checkProfile()
    }
  }, [user, isUserLoading, router, db, isOnboarding])

  useEffect(() => {
    const handleAuthError = (error: any) => {
      setIsLoading(false)
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Account not found. Please register.",
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
      if (phoneNumber.length < 10) {
        toast({ variant: "destructive", title: "Invalid Number", description: "Enter a valid 10-digit mobile number." })
        return
      }

      setIsLoading(true)
      try {
        const fullPhone = `+91${phoneNumber}`
        // Use standard Invisible reCAPTCHA
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
      if (!confirmationResult || verificationCode.length < 6) return
      setIsLoading(true)
      try {
        const result = await confirmationResult.confirm(verificationCode)
        const loggedUser = result.user
        
        // Check if profile exists
        const docSnap = await getDoc(doc(db, "users", loggedUser.uid))
        if (!docSnap.exists() || !docSnap.data().username) {
          setIsOnboarding(true)
          setTempUser(loggedUser)
          setIsLoading(false)
        } else {
          toast({ title: "Verified", description: "Login successful!" })
          router.push("/dashboard")
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect." })
        setIsLoading(false)
      }
    }
  }

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname || !registrationNumber || (!user && !tempUser) || !db) {
      toast({ variant: "destructive", title: "Incomplete Info", description: "All fields are mandatory." })
      return
    }

    const activeUser = user || tempUser
    if (!activeUser) return

    setIsLoading(true)
    try {
      const userRef = doc(db, "users", activeUser.uid)
      await setDocumentNonBlocking(userRef, {
        id: activeUser.uid,
        email: activeUser.email || "",
        phoneNumber: activeUser.phoneNumber || "",
        username: nickname,
        registrationNumber: registrationNumber,
        photoURL: activeUser.photoURL || "",
        role: "USER",
        points: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true })

      toast({ title: "Welcome!", description: "Profile setup complete." })
      setIsOnboarding(false)
      router.push("/dashboard")
    } catch (err) {
      toast({ variant: "destructive", title: "Setup Error", description: "Could not save profile details." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.endsWith("@gmail.com")) {
      toast({ variant: "destructive", title: "Domain Error", description: "Only @gmail.com is allowed." })
      return
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password Error", description: "Use at least 6 characters." })
      return
    }

    if (isSignup && (!nickname || !registrationNumber)) {
        toast({ variant: "destructive", title: "Missing Info", description: "All fields are mandatory for registration." })
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

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-background">
      {/* Sidebar Illustration */}
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
          
          {/* Header Mobile */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="w-20 h-20 rounded-[32px] gradient-header shadow-2xl flex items-center justify-center text-white mb-2 rotate-2 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
              {systemConfig?.appLogo ? (
                <Image src={systemConfig.appLogo} alt="Logo" fill className="object-cover" />
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
              {isOnboarding ? (
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                      <UserIconLucide className="h-6 w-6" />
                   </div>
                   <h2 className="text-xl font-headline font-bold">Profile Setup</h2>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Help us identify you for secure handovers</p>
                </div>
              ) : (
                <Tabs value={loginMethod} className="w-full" onValueChange={(v: any) => setLoginMode(v)}>
                  <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-muted h-12">
                    <TabsTrigger value="phone" className="rounded-lg font-bold text-[10px] uppercase tracking-tight gap-2">
                      <Smartphone className="h-3 w-3" /> Mobile OTP
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-lg font-bold text-[10px] uppercase tracking-tight gap-2">
                      <Mail className="h-3 w-3" /> Email
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>
            
            <CardContent className="pb-8 pt-4">
              {isOnboarding ? (
                <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Campus Nickname</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                          <Input placeholder="How should we call you?" className="pl-10 rounded-xl h-12 bg-muted/20 border-none shadow-none" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-muted-foreground">Registration Number</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                          <Input placeholder="e.g. 12200000" className="pl-10 rounded-xl h-12 bg-muted/20 border-none shadow-none" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                        </div>
                      </div>
                   </div>
                   <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-xl gradient-header font-bold shadow-xl">
                      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Profile"}
                   </Button>
                </form>
              ) : (
                <div className="space-y-6">
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
                              <span className="ml-1 tracking-widest">+91 </span>
                            </div>
                            <Input 
                              placeholder="9876543210" 
                              className="pl-28 rounded-xl h-14 bg-muted/20 border-none shadow-none text-lg font-bold tracking-widest"
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
              )}
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
