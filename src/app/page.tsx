"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, Lock, ArrowRight, Sparkles, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/firebase"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.endsWith("@gmail.com")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Only @gmail.com addresses are allowed.",
      })
      return
    }
    
    setIsLoading(true)
    // Simulate auth action
    setTimeout(() => {
      toast({
        title: isSignup ? "Account Created!" : "Welcome Back!",
        description: isSignup ? "Your account has been successfully set up." : "Successfully signed in.",
      })
      router.push("/dashboard")
      setIsLoading(false)
    }, 1500)
  }

  const handlePhoneAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      })
      router.push("/dashboard")
      setIsLoading(false)
    }, 1200)
  }

  const handleForgotPassword = () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your Gmail address to reset your password.",
      })
      return
    }
    toast({
      title: "Reset Link Sent",
      description: "Check your inbox for password recovery instructions.",
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-background">
      <div className="w-full max-w-[380px] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-header shadow-2xl flex items-center justify-center text-white mb-2">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">Lostify</h1>
          <p className="text-muted-foreground font-medium">Find what matters most.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-6">
               <h2 className="text-xl font-headline font-bold">
                 {isSignup ? "Create Account" : "Sign In"}
               </h2>
            </div>
            
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted">
                <TabsTrigger value="email" className="rounded-xl font-bold py-2">Email</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-xl font-bold py-2">Phone</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-4 space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Gmail Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="yourname@gmail.com" 
                        className="pl-10 rounded-xl h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="password">Password</Label>
                      {!isSignup && (
                        <button 
                          type="button" 
                          onClick={handleForgotPassword}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="password" type="password" className="pl-10 rounded-xl h-12" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl gradient-header font-bold text-lg" disabled={isLoading}>
                    {isLoading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Sign Up" : "Continue")} 
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="pt-4 space-y-4">
                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-2 text-muted-foreground border-r pr-2 py-1">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm font-bold">+91</span>
                      </div>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="9876543210" 
                        className="pl-20 rounded-xl h-12"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl gradient-header font-bold text-lg" disabled={isLoading}>
                    {isLoading ? "Sending OTP..." : "Get OTP"} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent className="pb-8 pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-card px-3 text-muted-foreground">New to Lostify?</span></div>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
              >
                {isSignup ? (
                  <>Already have an account? Sign In</>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Don't have an account? Sign Up
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground px-8 leading-relaxed">
          By continuing, you agree to Lostify's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
