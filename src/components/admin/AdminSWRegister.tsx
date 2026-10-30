'use client'

import { useEffect } from 'react'

/**
 * AdminSWRegister — Registers /admin-sw.js service worker for admin panel.
 *
 * Mount once in admin/layout.tsx (only runs on /admin/* routes).
 *
 * The SW provides:
 * — Offline caching of admin shell (HTML, CSS, JS, icons)
 * — Network-first strategy for API calls (fresh data, offline fallback)
 * — Cache-first for static assets (fast loads, save bandwidth)
 * — PWA installability (required by Chrome for "Add to Home Screen")
 * — Coexists with /firebase-messaging-sw.js (different scopes)
 *
 * Does NOT throw or block rendering if SW registration fails (e.g., in
 * development without HTTPS, or in browsers that don't support SW).
 */
export default function AdminSWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Skip in development (Next.js dev server interferes with SW caching)
    if (process.env.NODE_ENV !== 'production') return

    async function registerAdminSW() {
      try {
        const registration = await navigator.serviceWorker.register('/admin-sw.js', {
          scope: '/admin/',
          updateViaCache: 'none',
        })

        // Check for updates every hour
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)

        // Listen for new SW waiting to activate
        if (registration.waiting) {
          // Force activate new SW immediately (skip waiting)
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // New SW took control — reload to pick up changes
          // Only reload if user is on admin page (avoid disrupting public site)
          if (window.location.pathname.startsWith('/admin')) {
            window.location.reload()
          }
        })
      } catch (error) {
        console.warn('[AdminSW] Registration failed:', error)
      }
    }

    registerAdminSW()
  }, [])

  return null // renders nothing — invisible component
}
