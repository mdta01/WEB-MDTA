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
 * — Registers firebase-messaging-sw.js service worker (auto by Firebase)
 * — Sends token to server via /api/notifications/fcm-register
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!isFirebaseConfigured()) return null

  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  try {
    // Request permission first (FCM will fail without it)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[FCM] Permission not granted')
      return null
    }

    // Get FCM token (this also registers the service worker automatically)
    const { getToken } = await import('firebase/messaging')
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    })

    if (!token) {
      console.warn('[FCM] No token received')
      return null
    }

    // Register token with server (so we can send to this device later)
    await registerTokenWithServer(token)

    return token
  } catch (error) {
    console.error('[FCM] Get token failed:', error)
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
