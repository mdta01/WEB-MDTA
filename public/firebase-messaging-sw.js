/**
 * firebase-messaging-sw.js — Service worker for Firebase Cloud Messaging.
 *
 * Auto-registered by Firebase SDK when getMessaging() is called.
 * Handles push notifications when:
 * — The page is in background (tab not active)
 * — The browser is closed entirely (mobile)
 * — The device is locked (mobile)
 *
 * This SW must be in /public so it's served from site root.
 * It imports Firebase messaging compat lib from gstatic (Google CDN).
 *
 * Config is injected from env via build-time replacement. In dev (local),
 * the env values are read from window.__FIREBASE_CONFIG__ if available.
 */

// Try to read config from window (injected by client lib) — fallback to hardcoded env
const firebaseConfig = (typeof self !== 'undefined' && self.__FIREBASE_CONFIG__)
  ? self.__FIREBASE_CONFIG__
  : {
      apiKey: "REPLACE_ME",
      authDomain: "REPLACE_ME",
      projectId: "REPLACE_ME",
      storageBucket: "REPLACE_ME",
      messagingSenderId: "REPLACE_ME",
      appId: "REPLACE_ME",
    }

// Only import Firebase if config is valid (avoid errors in dev before env set)
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'REPLACE_ME') {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  // Handle background messages (when app closed or in background)
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload)

    const notificationTitle = payload.notification?.title || 'MDTA Miftahul Ulum 01'
    const notificationBody = payload.notification?.body || 'Ada update baru'
    const notificationOptions = {
      body: notificationBody,
      icon: '/images/logo-madin-warna.png',
      badge: '/images/logo-madin-warna.png',
      tag: payload.notification?.tag || 'mdta-update',
      requireInteraction: false,
      data: {
        url: payload.data?.url || '/',
        ...payload.data,
      },
    }

    // Show notification (this is required — background messages MUST show a notification)
    self.registration.showNotification(notificationTitle, notificationOptions)
  })

  // Handle notification click — open the URL
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const targetUrl = event.notification.data?.url || '/'

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window/tab is already open with the target URL, focus it
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
    )
  })
} else {
  console.warn('[firebase-messaging-sw.js] Firebase config not set. Set NEXT_PUBLIC_FIREBASE_* env vars.')
}
