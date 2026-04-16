
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { BottomNav } from "@/components/bottom-nav"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Lostify - Premium Lost & Found',
  description: 'AI-powered lost and found platform with premium UI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <Script 
          src="https://sdk.cashfree.com/js/v3/cashfree.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen relative overflow-x-hidden">
        <ThemeProvider>
          <FirebaseClientProvider>
            <div className="pb-24 lg:pb-0">
              {children}
            </div>
            <BottomNav />
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
