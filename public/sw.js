// Service Worker untuk Web Push notifications
// Runs in background even when tab is closed (Android v8+ compatible)

// Install — skip waiting so new SW activates immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate — claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push event — show notification (Android v8+ compatible)
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'MDTA Miftahul Ulum 01', body: 'Update baru tersedia' }
  }

  const title = data.title || 'MDTA Miftahul Ulum 01'
  const options = {
    body: data.body || '',
    icon: data.icon || '/images/logo-madin-warna.png',
    badge: '/images/logo-madin-warna.png',
    tag: data.tag || 'mdta-push',
    data: {
      url: data.url || '/',
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
    // Android Chrome specific
    silent: false,
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Click notification → open/focus the website at specific URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          await client.focus()
          await client.navigate(targetUrl)
          return
        }
      }

      const newClient = await self.clients.openWindow(targetUrl)
      if (newClient) {
        await newClient.focus()
      }
    })()
  )
})

// Notification close — analytics (optional)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics here in future
})

// Push subscription expired — re-subscribe automatically
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const registration = await self.registration
        const oldSubscription = await registration.pushManager.getSubscription()
        if (oldSubscription) {
          await oldSubscription.unsubscribe()
        }

        // Get VAPID key from server
        const response = await fetch('/api/notifications/vapid-public-key')
        const { publicKey } = await response.json()

        // Convert key
        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4)
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = atob(base64)
        const convertedKey = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          convertedKey[i] = rawData.charCodeAt(i)
        }

        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        })

        // Send new subscription to server
        const subData = newSubscription.toJSON()
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subData),
        })
      } catch (error) {
        console.error('[SW] Re-subscribe failed:', error)
      }
    })()
  )
})
