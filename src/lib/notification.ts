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
 *
 * Uses /firebase-messaging-sw.js (unified SW that handles BOTH Firebase
 * messaging AND generic VAPID push). This avoids the previous conflict
 * where /sw.js (VAPID) blocked Firebase SDK from registering its SW.
 *
 * Now both FCM and VAPID subscribers use the same SW file.
 *
 * VAPID key: prefer Firebase VAPID key (so FCM tokens work for this device too).
 * Fall back to legacy VAPID_PUBLIC_KEY env if Firebase not configured.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    // Register unified SW (Firebase compat). updateViaCache ensures browser
    // fetches fresh SW on each load (so updates take effect immediately).
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    // Wait until SW is active
    await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      // Check if subscription has expired
      const isExpired =
        subscription.expirationTime !== null &&
        subscription.expirationTime < Date.now()
      if (isExpired) {
        await subscription.unsubscribe()
        subscription = null
      } else {
        // Re-send to server in case it was lost
        await sendSubscriptionToServer(subscription)
        return true
      }
    }

    // Determine which VAPID key to use:
    // — Prefer Firebase VAPID key (NEXT_PUBLIC_FIREBASE_VAPID_KEY) so that
    //   this device can receive both FCM and VAPID pushes.
    // — Fall back to legacy VAPID_PUBLIC_KEY (older env var) if Firebase not set.
    const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    const legacyVapidKeyEndpoint = '/api/notifications/vapid-public-key'

    let vapidKey: string | null = null
    if (firebaseVapidKey) {
      vapidKey = firebaseVapidKey
    } else {
      // Fetch legacy VAPID key from API
      try {
        const res = await fetch(legacyVapidKeyEndpoint)
        if (res.ok) {
          const data = await res.json()
          vapidKey = data.publicKey
        }
      } catch {}
    }

    if (!vapidKey) {
      console.warn('[Push] No VAPID key available')
      return false
    }

    // Convert VAPID key to Uint8Array
    const convertedKey = urlBase64ToUint8Array(vapidKey)

    // Subscribe to push (using Firebase VAPID key if available)
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

/**
 * Verify push subscription is still active. Re-subscribe if expired.
 * Call this on page load (in NotificationManager) to ensure
 * background notifications work even after browser restart.
 */
export async function ensurePushSubscription(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // No subscription — try to subscribe
      return await subscribeToPushNotifications()
    }

    return true
  } catch (error) {
    console.error('[Push] Ensure subscription failed:', error)
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
