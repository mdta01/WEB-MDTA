/**
 * firebase-messaging-sw.js — Unified Service Worker for Push Notifications
 *
 * Handles ALL push notification scenarios:
 * 1. Firebase Cloud Messaging (FCM) — background messages via onBackgroundMessage
 *    (sent by firebase-admin SDK from our API routes)
 * 2. Generic Web Push (VAPID) — push events from web-push lib (legacy subscribers)
 *
 * Auto-registered by Firebase SDK OR by notification.ts subscribeToPushNotifications().
 * Runs in background even when tab closed (Android Chrome, desktop Chrome/Edge/Firefox).
 *
 * On iOS Safari 16.4+: app must be added to Home Screen for background delivery.
 *
 * This SW must be in /public so it's served from site root.
 * Config is hardcoded (SW can't access Next.js env vars at runtime).
 *
 * Firebase compat version 10.12.0 (matches client SDK in package.json).
 */

// ===== Firebase config (project: sim-madin) =====
const firebaseConfig = {
  apiKey: "AIzaSyCX358pCRPAHJrEoZWihJC5zUCZIC0KDCg",
  authDomain: "sim-madin.firebaseapp.com",
  projectId: "sim-madin",
  storageBucket: "sim-madin.firebasestorage.app",
  messagingSenderId: "852941803453",
  appId: "1:852941803453:web:caa08707361ba26ebe4cd4",
}

// ===== Lifecycle: Install & Activate =====
self.addEventListener('install', (event) => {
  // Skip waiting → new SW activates immediately, replacing old one
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Claim all clients immediately (so SW controls open tabs)
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Force-update: unregister any other SWs (e.g. legacy /sw.js)
      // and claim this one
      self.registration.update?.().catch(() => {}),
    ])
  )
})

// ===== Helper: show notification with consistent styling =====
function showPushNotification(title, body, url, tag, icon, badge) {
  const options = {
    body: body || 'Ada update baru dari MDTA Miftahul Ulum 01',
    icon: icon || '/images/logo-madin-warna.png',
    badge: badge || '/images/logo-madin-warna.png',
    tag: tag || 'mdta-update',
    // requireInteraction: false → auto-dismiss after a few seconds
    requireInteraction: false,
    // renotify: true → re-alert user even if notification exists with same tag
    renotify: false,
    // silent: false → play sound + vibrate
    silent: false,
    // vibrate pattern: 200ms on, 100ms off, 200ms on (Android only)
    vibrate: [200, 100, 200],
    // timestamp — when event occurred (for sorting in notification center)
    timestamp: Date.now(),
    // data — accessible in notificationclick event
    data: {
      url: url || '/',
      tag: tag || 'mdta-update',
      timestamp: Date.now(),
    },
    // actions — up to 2 quick actions (Android only)
    actions: [],
  }
  // showNotification returns a Promise
  return self.registration.showNotification(title || 'MDTA Miftahul Ulum 01', options)
}

// ===== Initialize Firebase (compat) =====
let messaging = null
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')
  firebase.initializeApp(firebaseConfig)
  messaging = firebase.messaging()
  console.info('[firebase-messaging-sw.js] Firebase messaging initialized')
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase init failed:', e)
}

// ===== Handler 1: Firebase onBackgroundMessage =====
// Triggered when server sends a "data-only" message OR when app is in background.
// For "notification" messages, Firebase SDK auto-shows the notification —
// onBackgroundMessage is called IN ADDITION to (not instead of) auto-show.
// We handle it here as fallback in case auto-show is suppressed.
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] FCM onBackgroundMessage:', payload)

    // Extract title/body from notification OR data
    const title = payload.notification?.title || payload.data?.title || 'MDTA Miftahul Ulum 01'
    const body = payload.notification?.body || payload.data?.body || 'Ada update baru'
    const url = payload.data?.url || '/'
    const tag = payload.notification?.tag || payload.data?.tag || 'mdta-fcm'
    const icon = payload.notification?.icon
    const badge = payload.notification?.badge

    return showPushNotification(title, body, url, tag, icon, badge)
  })
}

// ===== Handler 2: Generic push event (VAPID web-push OR FCM push) =====
// This fires for ALL push events including FCM (if Firebase SDK doesn't suppress).
// We dedupe by checking if Firebase already handled it.
let lastFcmNotifTime = 0
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event)

  if (!event.data) {
    // Empty push — show generic notification
    event.waitUntil(showPushNotification('MDTA Miftahul Ulum 01', 'Ada update baru', '/', 'mdta-update', null, null))
    return
  }

  // Try to parse as JSON
  let data = {}
  try {
    data = event.data.json()
  } catch {
    // Plain text push
    const text = event.data.text()
    event.waitUntil(showPushNotification('MDTA Miftahul Ulum 01', text || 'Update baru', '/', 'mdta-update', null, null))
    return
  }

  console.log('[firebase-messaging-sw.js] Push data:', data)

  // Detect if this is an FCM push message (has 'notification' field + 'from' field)
  // Firebase auto-shows these, so we skip our handler to prevent duplicates.
  // BUT: if our onBackgroundMessage didn't fire (e.g., data-only message),
  // we show it here.
  if (data.notification && data.from) {
    // FCM notification message — Firebase SDK auto-shows
    console.log('[firebase-messaging-sw.js] FCM notification message, Firebase auto-shows')
    return
  }

  // VAPID push OR FCM data-only message — show notification
  const title = data.title || data.notification?.title || 'MDTA Miftahul Ulum 01'
  const body = data.body || data.notification?.body || 'Ada update baru'
  const url = data.url || '/'
  const tag = data.tag || data.notification?.tag || 'mdta-push'

  event.waitUntil(showPushNotification(title, body, url, tag, data.icon, data.badge))
})

// ===== Notification click — open URL =====
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification)
  event.notification.close()

  // Get target URL from notification data
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      // Try to focus existing window/tab that matches URL
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      // Find a window already showing our site
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }

      // Find any window showing our site (regardless of URL)
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing window to target URL
          if ('navigate' in client) {
            await client.focus()
            // client.navigate is experimental — fall back to openWindow if not available
          }
          return client.focus()
        }
      }

      // No existing window — open new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })()
  )
})

// ===== Message from page (SW control) =====
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0-unified' })
  }
})
