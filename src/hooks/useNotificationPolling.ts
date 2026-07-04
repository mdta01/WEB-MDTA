'use client'

import { useEffect, useRef } from 'react'
import {
  getNotifPermission,
  getLastSeenTimestamp,
  setLastSeenTimestamp,
  showNotification,
} from '@/lib/notification'

const POLL_INTERVAL = 60_000 // 60 seconds

interface LatestUpdate {
  type: string
  title: string
}

interface CheckResponse {
  latestTimestamp: string | null
  latestUpdate: LatestUpdate | null
  checkedAt: string
}

/**
 * Polls /api/notifications/check every 60 seconds.
 * When a new update is detected (timestamp > last seen), shows a browser notification.
 *
 * Only runs on client. Skips polling if permission is not 'granted'.
 * Uses external interval (no React state) to avoid re-renders.
 */
export function useNotificationPolling(): void {
  // Use a ref so we don't trigger re-render on each poll
  const lastSeenRef = useRef<string | null>(null)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return
    // Only poll if user granted notification permission
    if (getNotifPermission() !== 'granted') return

    // Initialize lastSeen from localStorage (so we don't notify on past updates)
    lastSeenRef.current = getLastSeenTimestamp()

    let cancelled = false

    const checkForUpdates = async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/notifications/check', { cache: 'no-store' })
        if (!res.ok) return
        const data: CheckResponse = await res.json()
        if (!data.latestTimestamp) return

        const lastSeen = lastSeenRef.current
        // If we have a lastSeen and current timestamp is newer → notify
        if (lastSeen && data.latestTimestamp > lastSeen && data.latestUpdate) {
          const { type, title } = data.latestUpdate
          showNotification({
            title: `Update ${type} Baru`,
            body: title.length > 80 ? title.substring(0, 80) + '...' : title,
            tag: `mdta-${type}-${data.latestTimestamp}`,
          })
        }
        // Always update lastSeen to current latest (so we only notify future updates)
        lastSeenRef.current = data.latestTimestamp
        setLastSeenTimestamp(data.latestTimestamp)
      } catch {
        // Network error — silently skip, will retry next interval
      }
    }

    // Initial check after 5 seconds (let page settle)
    const initialTimer = setTimeout(checkForUpdates, 5000)
    // Then poll every 60 seconds
    const interval = setInterval(checkForUpdates, POLL_INTERVAL)

    return () => {
      cancelled = true
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])
}
