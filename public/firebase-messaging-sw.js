/**
 * firebase-messaging-sw.js — Unified Service Worker
 *
 * Handles BOTH:
 * 1. Firebase Cloud Messaging (FCM) — background messages via onBackgroundMessage
 * 2. Generic Web Push (VAPID) — push events from web-push lib (legacy subscribers)
 *
 * Auto-registered by Firebase SDK OR by notification.ts subscribeToPushNotifications().
 * Runs in background even when tab closed (Android v8+, desktop Chrome/Edge/Firefox).
 *
 * This SW must be in /public so it's served from site root.
 * Config is hardcoded (SW can't access Next.js env vars at runtime).
 */

// Firebase config — project: sim-madin
const firebaseConfig = {
  apiKey: "AIzaSyCX358pCRPAHJrEoZWihJC5zUCZIC0KDCg",
  authDomain: "sim-madin.firebaseapp.com",
  projectId: "sim-madin",
  storageBucket: "sim-madin.firebasestorage.app",
  messagingSenderId: "852941803453",
  appId: "1:852941803453:web:caa08707361ba26ebe4cd4",
}

// ===== Install & Activate (for VAPID SW compat) =====
self.addEventListener('install', (event) => {
  // Skip waiting so new SW activates immediately (replaces old /sw.js)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Claim clients immediately so SW controls the page right away
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old SW registrations if any (e.g. legacy /sw.js)
      self.registration.unregister?.().then(() => {
        // Re-register this SW to take over
        return self.serviceWorker?.register?.('/firebase-messaging-sw.js')
      }).catch(() => {}),
    ])
  )
})

// ===== Initialize Firebase (if config valid) =====
let messaging = null
if (firebaseConfig.apiKey) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
    importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')
    firebase.initializeApp(firebaseConfig)
    messaging = firebase.messaging()
  } catch (e) {
    console.warn('[firebase-messaging-sw.js] Firebase init failed:', e)
  }
}

// ===== Helper: show notification =====
function showPushNotification(title, body, url, tag, icon) {
  const options = {
    body: body || '',
    icon: icon || '/images/logo-madin-warna.png',
    badge: '/images/logo-madin-warna.png',
    tag: tag || 'mdta-update',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false,
    data: {
      url: url || '/',
    },
  }
  return self.registration.showNotification(title || 'MDTA Miftahul Ulum 01', options)
}

// ===== Handler 1: Firebase onBackgroundMessage (FCM push) =====
// Triggered when FCM sends a data message (not a notification message).
// Our server sends notification+data, so onBackgroundMessage may NOT fire
// — Firebase auto-shows the notification. But we handle it as fallback.
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] FCM background message:', payload)

    const title = payload.notification?.title || 'MDTA Miftahul Ulum 01'
    const body = payload.notification?.body || 'Ada update baru'
    const url = payload.data?.url || '/'
    const tag = payload.notification?.tag || payload.data?.tag || 'mdta-fcm'

    return showPushNotification(title, body, url, tag, payload.notification?.icon)
  })
}

// ===== Handler 2: Generic push event (VAPID web-push) =====
// Triggered by web-push lib (server sends via VAPID signing).
// This handler catches ALL push events — including FCM notification messages
// (which Firebase would auto-show) — so we deduplicate via tag.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // Plain text push
    data = { body: event.data ? event.data.text() : 'Update baru tersedia' }
  }

  console.log('[firebase-messaging-sw.js] Push event:', data)

  // Skip if this is an FCM message (Firebase auto-shows it via onBackgroundMessage
  // OR Firebase shows it automatically if notification field is present).
  // We detect FCM messages by 'notification' field in payload + 'from' field (FCM-specific).
  if (data.notification && data.from && messaging) {
    // FCM notification message — Firebase will auto-show, skip our handler
    console.log('[firebase-messaging-sw.js] FCM notification message, skipping (Firebase auto-shows)')
    return
  }

  // VAPID push (from web-push lib) — show notification
  const title = data.title || 'MDTA Miftahul Ulum 01'
  const body = data.body || ''
  const url = data.url || '/'
  const tag = data.tag || 'mdta-vapid-push'

  event.waitUntil(showPushNotification(title, body, url, tag, data.icon))
})

// ===== Notification click handler (open URL) =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if matches
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// ===== Message from page (for SW control) =====
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
