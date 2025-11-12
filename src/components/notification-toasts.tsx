"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { subscribeToNotifications, type NotificationRecord } from "@/services/notifications"
import { toastInfo, toastWarning } from "@/lib/toast"

/**
 * Subscribes to realtime notifications and shows toasts for tracker-relevant events.
 * Currently: displays a toast when a new pin is reported (type: pin_reported).
 */
export function NotificationToasts() {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const channel = subscribeToNotifications(
      user.id,
      (n: NotificationRecord) => {
        try {
          if (n.type === "pin_reported") {
            const payload = typeof n.payload === "string" ? JSON.parse(n.payload) : (n.payload || {})
            const isDamaged = payload?.type === "damaged"

            const title = n.title || (isDamaged ? "Damaged Location Reported" : "Safe Zone Reported")
            const descBase = n.body || payload?.description || "A new pin has been reported."
            const desc = typeof descBase === "string" ? descBase : JSON.stringify(descBase)

            if (isDamaged) {
              toastWarning(title, desc)
            } else {
              toastInfo(title, desc)
            }
          }
        } catch (err) {
          // Avoid breaking subscription on any parse errors
          console.warn("[NotificationToasts] handler error", err)
        }
      }
    )

    return () => {
      try { (channel as any)?.unsubscribe?.() } catch {}
    }
  }, [isAuthenticated, user?.id])

  return null
}
