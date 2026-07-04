// Browser notification utilities — permission request + display helpers.

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

    // Auto-close after 8 seconds
    setTimeout(() => notif.close(), 8000)

    // Click notification → focus window
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
