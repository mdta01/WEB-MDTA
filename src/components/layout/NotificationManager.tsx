'use client'

import { NotificationPermission } from '@/components/layout/NotificationPermission'
import { useNotificationPolling } from '@/hooks/useNotificationPolling'
import { useEffect } from 'react'
import { getNotifPermission, ensurePushSubscription } from '@/lib/notification'

/**
 * Manages browser notification lifecycle:
 * 1. Renders the permission prompt (floating bell button)
 * 2. Activates polling hook once permission is granted
 *
 * Mounted in root layout so it runs on every page.
 */
export function NotificationManager() {
  // Poll for updates (hook internally checks permission; no-op if not granted)
  useNotificationPolling()

  // On mount: if permission already granted, ensure push subscription is active
  // This handles browser restarts where SW may have been unregistered
  useEffect(() => {
    if (getNotifPermission() === 'granted') {
      ensurePushSubscription().catch(() => {})
    }
  }, [])

  return <NotificationPermission />
}
