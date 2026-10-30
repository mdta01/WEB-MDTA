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
 * Config is HARDCODED here because service workers can't access Next.js
 * NEXT_PUBLIC_* env vars (they run in their own scope, not browser window).
 * Update this if Firebase project changes.
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

// Only import Firebase if config is valid (avoid errors in dev before env set)
if (firebaseConfig.apiKey) {
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
  console.warn('[firebase-messaging-sw.js] Firebase config not set.')
}
