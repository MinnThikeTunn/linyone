"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

type Variant = "default" | "destructive" | "success" | "warning" | "info"

function pickVariant(message: string): Variant {
  const msg = message.toLowerCase()
  if (/(error|failed|fail|unable|cannot|can't|denied|invalid)/i.test(message)) return "destructive"
  if (/(success|saved|sent|created|updated|done|completed)/i.test(message)) return "success"
  if (/(warn|heads up|caution|careful|attention)/i.test(message)) return "warning"
  if (/(info|notice|fyi|tip)/i.test(message)) return "info"
  return "info"
}

export function AlertToToastBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const originalAlert = window.alert
    window.alert = function (message?: string | number | boolean | object) {
      try {
        const text = typeof message === "string" ? message : String(message)
        const variant = pickVariant(text)
        toast({ title: "Alert", description: text, variant })
      } catch {
        // Fallback to original alert in case of any unexpected runtime issue
        originalAlert(message as any)
      }
    }

    return () => {
      window.alert = originalAlert
    }
  }, [])

  return null
}
