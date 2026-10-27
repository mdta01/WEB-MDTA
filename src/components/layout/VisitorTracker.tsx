'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * VisitorTracker — invisible component mounted once at root.
 *
 * On every route change (and once on initial mount), it sends a fire-and-forget
 * POST to /api/track-visitor with the current path + referrer. The server
 * records the visitor (hashed IP) + pageview (for realtime count + daily
 * aggregation).
 *
 * Privacy:
 * — Server never stores raw IP. SHA-256 hash with salt.
 * — No cookies, no localStorage. Pure server-side dedup.
 * — Fire-and-forget: doesn't block page render, doesn't fail UI on error.
 *
 * Uses `navigator.sendBeacon` when available (more reliable on page unload),
 * falls back to `fetch` with keepalive.
 */
export default function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip tracking for admin pages (don't count admin's own visits in stats)
    if (pathname?.startsWith('/admin')) return

    // Skip on localhost (dev) — uncomment to test in dev
    // if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return

    const payload = JSON.stringify({
      path: pathname || '/',
      referrer: typeof document !== 'undefined' ? document.referrer : null,
    })

    // sendBeacon is ideal for fire-and-forget (survives page unload)
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      try {
        const blob = new Blob([payload], { type: 'application/json' })
        // sendBeacon returns false if queue is full — fall back to fetch
        if (navigator.sendBeacon('/api/track-visitor', blob)) return
      } catch {
        // fall through to fetch
      }
    }

    // Fallback: fetch with keepalive (allows request to complete even if page unmounts)
    fetch('/api/track-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Silently fail — never break the UI
    })
  }, [pathname])

  return null // renders nothing — invisible tracker
}
