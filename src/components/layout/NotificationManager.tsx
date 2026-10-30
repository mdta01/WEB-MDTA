'use client'

import { NotificationPermission } from '@/components/layout/NotificationPermission'
import { useNotificationPolling } from '@/hooks/useNotificationPolling'
import { useEffect } from 'react'
import { getNotifPermission, ensurePushSubscription } from '@/lib/notification'
import { isFirebaseConfigured, requestFcmToken } from '@/lib/firebase-client'

/**
 * Manages browser notification lifecycle:
 * 1. Renders the permission prompt (floating bell button)
 * 2. Activates polling hook once permission is granted
 * 3. On mount: if permission already granted, ensure FCM subscription is active
 *    (this auto-migrates legacy VAPID subscribers to FCM for faster delivery)
 *
 * Mounted in root layout so it runs on every page.
 */
export function NotificationManager() {
  // Poll for updates (hook internally checks permission; no-op if not granted)
  useNotificationPolling()

  useEffect(() => {
    if (getNotifPermission() !== 'granted') return

    // If Firebase is configured, prefer FCM (faster, more reliable).
    // This auto-migrates legacy VAPID subscribers to FCM the next time they
    // visit the site. FCM token registration also unsubscribes the legacy
    // VAPID subscription (to prevent duplicate notifications).
    if (isFirebaseConfigured()) {
      requestFcmToken()
        .then((token) => {
          if (token) {
            console.info('[Notifications] FCM token registered successfully')
          } else {
            // FCM failed — fall back to VAPID (legacy web-push)
            console.info('[Notifications] FCM failed, falling back to VAPID')
            ensurePushSubscription().catch(() => {})
          }
        })
        .catch((err) => {
          console.error('[Notifications] FCM init error:', err)
          // Fall back to VAPID on error
          ensurePushSubscription().catch(() => {})
        })
    } else {
      // Firebase not configured — use VAPID only (legacy)
      ensurePushSubscription().catch(() => {})
    }
  }, [])

  return <NotificationPermission />
}
