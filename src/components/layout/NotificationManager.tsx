'use client'

import { NotificationPermission } from '@/components/layout/NotificationPermission'
import { useNotificationPolling } from '@/hooks/useNotificationPolling'

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

  return <NotificationPermission />
}
