"use client"

import { LiveAlerts } from '@/components/alerts/live-alerts'

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recent Alerts</h1>
          <p className="text-gray-600">Stay informed about earthquake, flood, and cyclone alerts and emergency information</p>
        </div>
        <LiveAlerts />
      </div>
    </div>
  )
}

