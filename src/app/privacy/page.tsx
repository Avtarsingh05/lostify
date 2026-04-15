"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, Lock, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="gradient-header pt-12 pb-20 px-6 rounded-b-[40px] shadow-xl text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-headline font-bold">Privacy Policy</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-10">
        <div className="bg-card rounded-[32px] shadow-2xl overflow-hidden border-none p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Protection</p>
              <h2 className="text-lg font-headline font-bold">Privacy Standards</h2>
            </div>
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">1. Introduction</h3>
                <p>
                  Lostify ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our campus-based lost and found mobile application. By using Lostify, you consent to the data practices described in this policy.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">2. Information We Collect</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Personal Data</h4>
                    <p>We collect information you provide directly to us, including your nickname, @gmail.com email address, and phone number during account registration.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Location Data</h4>
                    <p>To facilitate item recovery, we collect precise GPS location data when you report a lost or found item. This data is used solely to pin the item's location on our interactive map.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Images Uploaded</h4>
                    <p>When you report items, you may upload photos. These images are stored securely and processed to identify item characteristics.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Chat Messages</h4>
                    <p>We store the content of your communications within our in-app chat to allow you and other users to coordinate the return of items.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">3. How We Use Information</h3>
                <p>
                  We use the collected information to:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Facilitate the reporting and recovery of lost property.</li>
                  <li>Verify user identity and maintain campus security.</li>
                  <li>Enable communication between users regarding specific items.</li>
                  <li>Send notifications about potential item matches.</li>
                  <li>Manage administrative auctions for unclaimed property.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">4. AI Data Processing Explanation</h3>
                <p>
                  Lostify utilizes Artificial Intelligence (AI) to analyze images of found items. This processing automatically extracts item names, categories, and descriptive attributes to improve search accuracy. Image analysis is performed locally or via secure cloud-based AI providers and is never used for facial recognition or personal identification.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">5. Data Sharing Policy</h3>
                <p>
                  We do not sell, rent, or lease your personal data to third parties. Information is shared only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>With other users (only nicknames and item details) to facilitate recovery.</li>
                  <li>With campus security personnel during the official handover process.</li>
                  <li>If required by law or to protect the safety of the campus community.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">6. Data Security</h3>
                <p>
                  We implement robust security measures, including industry-standard encryption for data at rest and in transit. Access to personal information is restricted to authorized personnel who require the data to perform their campus duties.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">7. User Rights</h3>
                <p>
                  You have the right to access, correct, or request the deletion of your personal data. You can manage your profile details directly within the app settings or contact us for assistance with account closure.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">8. Data Retention</h3>
                <p>
                  We retain personal data for as long as your account is active. To maintain platform efficiency, lost and found listings may be subject to a 30-day automatic expiry logic, after which unclaimed items may be archived or transitioned to the auction module.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">9. Third-Party Services</h3>
                <p>
                  Lostify integrates with third-party services for essential functionality:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Firebase:</strong> For secure authentication and real-time database management.</li>
                  <li><strong>Google Maps:</strong> For location services and interactive map displays.</li>
                  <li><strong>AI APIs:</strong> For automated item detail extraction from images.</li>
                </ul>
                <p className="mt-2">These providers have their own privacy policies governing how they handle data.</p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">10. Children's Privacy</h3>
                <p>
                  Lostify is intended for use by university students and staff. We do not knowingly collect information from children under the age of 13.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">11. Changes to Policy</h3>
                <p>
                  We may update our Privacy Policy periodically. We will notify you of any significant changes by posting the new policy within the app. You are advised to review this policy regularly for any updates.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-bold font-headline mb-2 uppercase text-xs tracking-wider">12. Contact Information</h3>
                <p>
                  If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact our privacy officer at: privacy@lostify.campus.edu
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  )
}
