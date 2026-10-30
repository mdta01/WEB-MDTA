/**
 * admin-sw.js — Service Worker for Admin Panel PWA
 *
 * Provides:
 * — Offline caching for admin shell (HTML, CSS, JS, fonts)
 * — Network-first strategy for API calls (always fresh data)
 * — Cache-first for static assets (icons, images)
 * — Enables "Add to Home Screen" / installable PWA
 * — Works with Trusted Web Activity (TWA) for APK packaging
 *
 * NOTE: This SW is separate from /firebase-messaging-sw.js (which handles
 * push notifications). They can coexist on the same origin because they
 * have different scopes:
 * — /firebase-messaging-sw.js → scope: "/" (handles push for all pages)
 * — /admin-sw.js → scope: "/admin/" (handles admin PWA offline caching)
 *
 * Wait, that's wrong — service workers can only have ONE per scope.
 * Since admin is under "/", the root SW (/firebase-messaging-sw.js)
 * already controls it. So this admin-sw.js is registered with a more
 * specific scope "/admin/" to take precedence for admin pages.
 *
 * Actually, browser only allows 1 SW per scope. The most specific
 * registered SW wins. So /admin-sw.js with scope "/admin/" will
 * handle /admin/* requests, while /firebase-messaging-sw.js with
 * scope "/" handles everything else.
 */

const ADMIN_CACHE = 'mdta-admin-v1'
const STATIC_CACHE = 'mdta-admin-static-v1'

// Assets to pre-cache on install (admin shell)
const PRECACHE_URLS = [
  '/admin',
  '/admin-manifest.webmanifest',
  '/icons/admin/icon-192.png',
  '/icons/admin/icon-512.png',
  '/icons/admin/apple-touch-icon.png',
]

// ===== Install: pre-cache admin shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(ADMIN_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// ===== Activate: clean up old caches, claim clients =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== ADMIN_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ===== Fetch: strategy based on request type =====
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests (POST, PUT, DELETE — never cache)
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip cross-origin requests (Cloudinary, Firebase, Google Fonts)
  if (url.origin !== self.location.origin) return

  // Skip Next.js HMR & dev requests
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // === Strategy 1: API calls → network-first (always fresh) ===
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses for offline fallback
          if (response.ok) {
            const clone = response.clone()
            caches.open(ADMIN_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Network failed → try cache
          return caches.match(request).then((cached) => cached || Response.error())
        })
    )
    return
  }

  // === Strategy 2: Static assets (icons, images, _next/static) → cache-first ===
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // === Strategy 3: Navigation (HTML pages) → network-first, fallback to cache ===
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(ADMIN_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline → serve cached admin page
          return caches.match('/admin') || caches.match(request) || Response.error()
        })
    )
    return
  }

  // === Default: try cache, then network ===
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  )
})

// ===== Message handler (for skipWaiting from page) =====
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
