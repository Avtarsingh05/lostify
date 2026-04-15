
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Shield, User, LogOut, ChevronRight, Moon, Globe, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth, useUser } from "@/firebase"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }

  const SettingItem = ({ icon: Icon, label, description, rightElement }: any) => (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold font-headline">{label}</p>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {rightElement || <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-header pt-10 pb-20 px-4 rounded-b-[40px] shadow-2xl text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Settings</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-10 space-y-6">
        {/* Profile Card */}
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-xl text-primary border-2 border-primary/20">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg leading-tight">
                  {user?.displayName || "Campus User"}
                </h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Sections */}
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Account & Security</h3>
            <Card className="border-none shadow-lg rounded-[28px] overflow-hidden">
              <CardContent className="p-1">
                <SettingItem icon={User} label="Profile Information" description="Name, email, and avatar" />
                <SettingItem icon={Shield} label="Privacy & Security" description="Password and authentication" />
                <SettingItem icon={Globe} label="Region" description="Campus location settings" />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Preferences</h3>
            <Card className="border-none shadow-lg rounded-[28px] overflow-hidden">
              <CardContent className="p-1">
                <SettingItem 
                  icon={Bell} 
                  label="Notifications" 
                  description="Item matches and messages" 
                  rightElement={<Switch defaultChecked />}
                />
                <SettingItem 
                  icon={Moon} 
                  label="Dark Mode" 
                  description="Toggle visual theme" 
                  rightElement={<Switch />}
                />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Support</h3>
            <Card className="border-none shadow-lg rounded-[28px] overflow-hidden">
              <CardContent className="p-1">
                <SettingItem icon={HelpCircle} label="Help Center" description="FAQs and documentation" />
              </CardContent>
            </Card>
          </section>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-destructive font-bold text-sm bg-destructive/5 rounded-[28px] hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}
