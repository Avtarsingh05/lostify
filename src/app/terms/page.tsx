
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-headline font-bold">Terms of Service</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10">
        <div className="bg-card rounded-[32px] shadow-2xl overflow-hidden border-none p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Agreement</p>
              <h2 className="text-lg font-headline font-bold">Lostify Platform Rules</h2>
            </div>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">1. Introduction</h3>
                <p>
                  Welcome to Lostify. These Terms and Conditions govern your use of the Lostify mobile application, a dedicated campus platform designed to facilitate the recovery of lost items and the return of found property through AI-assisted detection, secure messaging, and community auctions.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">2. Acceptance of Terms</h3>
                <p>
                  By accessing or using Lostify, you confirm your agreement to be bound by these Terms and Conditions. If you do not agree to these terms, you must immediately cease all use of the application.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">3. User Accounts</h3>
                <p>
                  To ensure a secure campus environment, registration is restricted to users with valid @gmail.com email addresses. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide a valid nickname and accurate information during registration.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">4. User Responsibilities</h3>
                <p>
                  Users must provide truthful and accurate descriptions when reporting lost or found items. When handing over found items, students must follow official campus protocol by delivering items to designated security personnel and recording the handover details within the app.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">5. Lost and Found Listings Disclaimer</h3>
                <p>
                  Lostify acts as a neutral facilitator. We do not guarantee the recovery of any lost item, nor do we verify the ownership of reported items. Users interact with others at their own risk. Lostify is not responsible for any disputes, lost items, or damages arising from the use of the platform.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">6. Chat and Communication Rules</h3>
                <p>
                  The integrated chat system is provided solely for coordinating item recovery. Users must remain professional and respectful. Harassment, spamming, or the exchange of illegal content is strictly prohibited and will result in immediate account termination.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">7. Auction System Terms</h3>
                <p>
                  Unclaimed items may be placed in the Auction module after a designated period. Auctions are managed exclusively by campus administrators. All bids are binding, and all sales are final. Proceeds from auctions are utilized for community rewards and local campus initiatives as determined by the administration.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">8. Prohibited Activities</h3>
                <p>
                  You may not: post fraudulent reports; use AI detection for illegal purposes; scrape data from the application; or attempt to bypass any security measures or administrative controls.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">9. Intellectual Property</h3>
                <p>
                  All content, including the Lostify name, logo, AI models, and software architecture, is the exclusive property of the application developers and protected by intellectual property laws.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">10. Privacy Reference</h3>
                <p>
                  Your privacy is important to us. Data collection, including GPS location for item tracking, is handled in accordance with our Privacy Policy. By using the app, you consent to such data processing.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">11. Limitation of Liability</h3>
                <p>
                  In no event shall Lostify, its developers, or campus administrators be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the service or the loss of any physical property.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">12. Termination of Use</h3>
                <p>
                  We reserve the right to suspend or terminate access to Lostify for any user who violates these terms or engages in conduct that we deem harmful to the campus community.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">13. Changes to Terms</h3>
                <p>
                  Lostify may update these Terms and Conditions at any time. Significant changes will be communicated through in-app notifications. Continued use of the app after such changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">14. Contact Information</h3>
                <p>
                  For legal inquiries or reporting violations, please contact the administrative team at: <strong>forigloohelp@gmail.com</strong> or via WhatsApp at <strong>+91 9013618694</strong>.
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  )
}
