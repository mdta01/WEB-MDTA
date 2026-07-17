// Browser notification utilities — permission request + push subscription + display helpers.

const STORAGE_KEY = 'mdta_notif_last_seen'
const PERMISSION_DISMISSED_KEY = 'mdta_notif_dismissed'

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function getNotifPermission(): NotifPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotifPermission
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    return result as NotifPermission
  } catch {
    return 'denied'
  }
}

export function isNotifDismissed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PERMISSION_DISMISSED_KEY) === '1'
}

export function dismissNotifPrompt(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PERMISSION_DISMISSED_KEY, '1')
}

export function getLastSeenTimestamp(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setLastSeenTimestamp(ts: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, ts)
}

export interface NotifPayload {
  title: string
  body: string
  tag?: string
  icon?: string
}

export function showNotification(payload: NotifPayload): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    const notif = new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag || 'mdta-update',
      icon: payload.icon || '/images/logo-madin-warna.png',
      badge: '/images/logo-madin-warna.png',
    })

    setTimeout(() => notif.close(), 8000)

    notif.onclick = () => {
      window.focus()
      notif.close()
    }

    return true
  } catch (error) {
    console.error('Failed to show notification:', error)
    return false
  }
}

// ===== Web Push API (background notifications) =====

/**
 * Register service worker and subscribe to push notifications.
 * Called after user grants notification permission.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      // Re-send to server in case it was lost
      await sendSubscriptionToServer(subscription)
      return true
    }

    // Get VAPID public key from server
    const vapidResponse = await fetch('/api/notifications/vapid-public-key')
    if (!vapidResponse.ok) return false
    const { publicKey } = await vapidResponse.json()
    if (!publicKey) return false

    // Convert VAPID key to Uint8Array
    const convertedKey = urlBase64ToUint8Array(publicKey)

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    })

    // Send subscription to server
    await sendSubscriptionToServer(subscription)
    return true
  } catch (error) {
    console.error('[Push] Subscribe failed:', error)
    return false
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const subData = subscription.toJSON()
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subData),
  })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
