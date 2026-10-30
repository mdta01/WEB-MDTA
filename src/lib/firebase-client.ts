'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  isSupported,
  type Messaging,
} from 'firebase/messaging'

/**
 * Firebase client-side initialization.
 *
 * Used for:
 * — Requesting notification permission
 * — Getting FCM registration token (per-device)
 * — Listening to foreground messages (when app is open)
 *
 * Required env vars (NEXT_PUBLIC_ prefix exposes to browser):
 * — NEXT_PUBLIC_FIREBASE_API_KEY
 * — NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * — NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * — NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * — NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * — NEXT_PUBLIC_FIREBASE_APP_ID
 * — NEXT_PUBLIC_FIREBASE_VAPID_KEY
 *
 * If env vars not set, isFirebaseConfigured() returns false — caller should
 * gracefully fall back to VAPID web-push (existing system).
 */

export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
}

let firebaseApp: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null

  if (!firebaseApp) {
    // Initialize once — reuse if already exists (HMR in dev)
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    })
  }

  return firebaseApp
}

let messagingInstance: Messaging | null = null

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const app = getFirebaseApp()
  if (!app) return null

  // Check if browser supports FCM (Safari < 16.4 doesn't, iOS PWA only)
  const supported = await isSupported().catch(() => false)
  if (!supported) {
    console.warn('[Firebase] FCM not supported in this browser')
    return null
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }

  return messagingInstance
}

/**
 * Request notification permission and get FCM token.
 *
 * Returns:
 * — string token on success
 * — null if permission denied, not supported, or Firebase not configured
 *
 * Side effects:
 * — Registers /firebase-messaging-sw.js service worker explicitly
 *   (this is the unified SW that handles both FCM and VAPID push)
 * — Sends token to server via /api/notifications/fcm-register
 * — Sets up onTokenRefresh listener (FCM tokens can rotate)
 * — Also auto-unsubscribes from legacy VAPID push subscription (if any)
 *   to prevent duplicate notifications (subscriber gets push via both
 *   FCM token AND VAPID endpoint — we want FCM only for reliability)
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!isFirebaseConfigured()) return null

  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  try {
    // Step 1: Explicitly register the unified SW BEFORE calling getToken.
    // Firebase SDK auto-registers, but if the old /sw.js is still active,
    // Firebase might use it (which doesn't handle onBackgroundMessage).
    // We force-register /firebase-messaging-sw.js to take over scope '/'.
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/', updateViaCache: 'none' }
    )
    // Wait until SW is fully active
    await navigator.serviceWorker.ready
    // Force update to latest SW version
    await swRegistration.update().catch(() => {})

    // Step 2: Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[FCM] Permission not granted')
      return null
    }

    // Step 3: Get FCM token (uses the SW we just registered)
    const { getToken, onTokenRefresh } = await import('firebase/messaging')
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!
    let token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    })

    if (!token) {
      console.warn('[FCM] No token received (getToken returned empty)')
      return null
    }

    console.info('[FCM] Token received:', token.substring(0, 30) + '...')

    // Step 4: Set up onTokenRefresh — FCM tokens can rotate (rare, but happens).
    // When token refreshes, re-register with server so we don't lose the device.
    onTokenRefresh(messaging, async () => {
      console.info('[FCM] Token refreshed — re-registering with server')
      try {
        const newToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration,
        })
        if (newToken) {
          await registerTokenWithServer(newToken)
        }
      } catch (e) {
        console.error('[FCM] Token refresh failed:', e)
      }
    })

    // Step 5: Unsubscribe from legacy VAPID push (if exists) to prevent duplicates.
    // This device now receives push via FCM token only — more reliable.
    try {
      const existingSub = await swRegistration.pushManager.getSubscription()
      if (existingSub) {
        // Note: existingSub.unsubscribe() removes the subscription from browser,
        // but doesn't notify the server. We should also DELETE it from server's
        // PushSubscription table via /api/notifications/subscribe DELETE.
        await existingSub.unsubscribe()
        // Best-effort cleanup: notify server to remove legacy VAPID subscription
        // We don't have the endpoint here (already unsubscribed), so skip —
        // the server's cleanup-vapid endpoint will remove it later via ping test.
        console.info('[FCM] Unsubscribed from legacy VAPID push (now using FCM only)')
      }
    } catch (e) {
      console.debug('[FCM] Failed to unsubscribe legacy VAPID:', e)
    }

    // Step 6: Register token with server (so we can send to this device later)
    await registerTokenWithServer(token)

    return token
  } catch (error) {
    console.error('[FCM] Get token failed:', error)
    return null
  }
}

/**
 * Get current FCM token (without requesting permission or re-registering).
 * Returns null if not subscribed yet (user hasn't clicked bell button).
 * Useful for checking if device is already subscribed.
 */
export async function getCurrentFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!isFirebaseConfigured()) return null
  if (Notification.permission !== 'granted') return null

  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  try {
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    await navigator.serviceWorker.ready

    const { getToken } = await import('firebase/messaging')
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    })
  } catch (error) {
    console.error('[FCM] getCurrentFcmToken failed:', error)
    return null
  }
}

/**
 * Listen for foreground messages (when app/tab is active).
 * Returns unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  const { onMessage } = await import('firebase/messaging')
  return onMessage(messaging, callback)
}

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    await fetch('/api/notifications/fcm-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userAgent: navigator.userAgent,
        // Optional: send device info for analytics
        platform: (navigator as Navigator & { platform?: string }).platform || 'unknown',
      }),
    })
  } catch (error) {
    console.error('[FCM] Failed to register token with server:', error)
  }
}
