import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { AlertToToastBridge } from "@/components/alert-to-toast-bridge";
import { NotificationToasts } from "@/components/notification-toasts";
import { LiveAlerts } from "@/components/alerts/live-alerts";
import DisasterToasts from "@/components/alerts/disaster-toasts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lin Yone Tech - Earthquake Response Platform",
  description: "Real-time earthquake alerts, coordination, and recovery tools for communities before, during, and after earthquakes.",
  keywords: ["earthquake", "emergency response", "safety", "volunteer", "disaster relief", "Myanmar", "Burmese"],
  authors: [{ name: "Lin Yone Tech Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Lin Yone Tech - Earthquake Response Platform",
    description: "Real-time earthquake alerts, coordination, and recovery tools for communities",
    url: "https://linyonetech.com",
    siteName: "Lin Yone Tech",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lin Yone Tech - Earthquake Response Platform",
    description: "Real-time earthquake alerts, coordination, and recovery tools for communities",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              {/* Global compact alerts feed (can be hidden or styled differently) */}
              {/* <div className="px-4 py-2 bg-gray-50 border-b">
                <LiveAlerts className="hidden lg:block" />
              </div> */}
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Toaster />
            <AlertToToastBridge />
            <NotificationToasts />
            <DisasterToasts />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
