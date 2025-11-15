import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { AlertToToastBridge } from "@/components/alert-to-toast-bridge";
import { NotificationToasts } from "@/components/notification-toasts";
import { LiveAlerts } from "@/components/alerts/live-alerts";
import DisasterToasts from "@/components/alerts/disaster-toasts";
import LastSeenUpdater from "@/components/last-seen-updater";
import AIChatWrapper from "@/components/ai-chat-wrapper";

// Google font downloads disabled for local/dev to avoid network/timeouts
// Use system/fallback fonts defined in globals.css

export const metadata: Metadata = {
  // ... your existing metadata ...
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased bg-background text-foreground`}>
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              {/* Global compact alerts feed (can be hidden or styled differently) */}
              {/* <div className="px-4 py-2 bg-gray-50 border-b">
                <LiveAlerts className="hidden lg:block" />
              </div> */}
              <main className="flex-1">
                {/* Background task: update user's last seen location periodically */}
                <LastSeenUpdater />
                {children}
              </main>
            </div>
            <Toaster />

            {/* Single floating assistant with Assistant/Mental tabs */}
            <AIChatWrapper />
            <AlertToToastBridge />
            <NotificationToasts />
            <DisasterToasts />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
