// Service Worker untuk Web Push notifications
// Runs in background even when tab is closed

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

      // Try to find an existing window/tab and navigate it
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window + navigate to target URL
          await client.focus()
          await client.navigate(targetUrl)
          return
        }
      }

      // No existing window found — open new one
      const newClient = await self.clients.openWindow(targetUrl)
      if (newClient) {
        await newClient.focus()
      }
    })()
  )
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
