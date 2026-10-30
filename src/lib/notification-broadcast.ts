import { broadcastFcm } from '@/lib/firebase-admin'
import { broadcastPushNotification } from '@/lib/webpush'

/**
 * Reusable broadcast helper — sends push notification via both FCM and VAPID.
 *
 * Why this helper exists:
 * — Centralizes the "FCM first, VAPID fallback" logic so all admin CRUD routes
 *   get the same reliable delivery without duplicating code.
 * — Auto-truncates title/body to respect notification display limits.
 * — Never throws (push failure should NOT break the CRUD operation).
 *
 * Usage:
 *   import { notifySubscribers } from '@/lib/notification-broadcast'
 *   await notifySubscribers({
 *     title: '📰 Berita Baru',
 *     body: news.title,
 *     url: '/?page=berita',
 *     tag: `news-${news.id}`,
 *   })
 */

export interface NotifyPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

/**
 * Broadcast push notification to all subscribers (FCM + VAPID).
 * Returns combined stats. Never throws — push failure is logged but doesn't break caller.
 */
export async function notifySubscribers(payload: NotifyPayload): Promise<{
  fcmSent: number
  vapidSent: number
  total: number
}> {
  // Truncate to notification display limits (FCM/VAPID have ~150 char title, ~200 body)
  const title = (payload.title || '').substring(0, 150)
  const body = (payload.body || '').substring(0, 200)
  const url = payload.url || '/'
  const tag = payload.tag || 'mdta-update'
  const icon = payload.icon || '/images/logo-madin-warna.png'

  let fcmSent = 0
  let vapidSent = 0

  // Try FCM first (more reliable, supports iOS Safari, background delivery)
  try {
    fcmSent = await broadcastFcm({ title, body, url, tag, icon })
  } catch (error) {
    console.error('[notifySubscribers] FCM broadcast failed:', error)
  }

  // Also send via VAPID web-push as fallback (covers older browsers)
  try {
    vapidSent = await broadcastPushNotification({ title, body, url, tag, icon })
  } catch (error) {
    console.error('[notifySubscribers] VAPID broadcast failed:', error)
  }

  return {
    fcmSent,
    vapidSent,
    total: fcmSent + vapidSent,
  }
}

// ===== Convenience helpers for common entity types =====
// These produce properly formatted payloads with emoji prefixes and truncation.

/** Notify on news create/update (only if isPublished=true) */
export async function notifyNewsUpdate(
  news: { id: string; title: string; isPublished: boolean },
  action: 'created' | 'updated'
): Promise<void> {
  if (!news.isPublished) return // don't notify for drafts
  await notifySubscribers({
    title: `📰 ${action === 'created' ? 'Berita Baru' : 'Berita Diperbarui'}`,
    body: news.title,
    url: `/?page=berita`,
    tag: `mdta-news-${news.id}`,
  })
}

/** Notify on dakwah create/update (only if isPublished=true) */
export async function notifyDakwahUpdate(
  dakwah: { id: string; title: string; isPublished: boolean },
  action: 'created' | 'updated'
): Promise<void> {
  if (!dakwah.isPublished) return
  await notifySubscribers({
    title: `📖 ${action === 'created' ? 'Dakwah Baru' : 'Dakwah Diperbarui'}`,
    body: dakwah.title,
    url: `/?page=dakwah`,
    tag: `mdta-dakwah-${dakwah.id}`,
  })
}

/** Notify on announcement create/update (only if isActive=true) */
export async function notifyAnnouncementUpdate(
  announcement: { id: string; title: string; isActive: boolean },
  action: 'created' | 'updated'
): Promise<void> {
  if (!announcement.isActive) return
  await notifySubscribers({
    title: `📢 ${action === 'created' ? 'Pengumuman Baru' : 'Pengumuman Diperbarui'}`,
    body: announcement.title,
    url: `/?page=pengumuman`,
    tag: `mdta-announcement-${announcement.id}`,
  })
}

/** Notify on event create/update */
export async function notifyEventUpdate(
  event: { id: string; title: string },
  action: 'created' | 'updated'
): Promise<void> {
  await notifySubscribers({
    title: `📅 ${action === 'created' ? 'Agenda Baru' : 'Agenda Diperbarui'}`,
    body: event.title,
    url: `/?page=berita`,
    tag: `mdta-event-${event.id}`,
  })
}

/** Notify on achievement create/update */
export async function notifyAchievementUpdate(
  achievement: { id: string; title: string; achiever?: string },
  action: 'created' | 'updated'
): Promise<void> {
  await notifySubscribers({
    title: `🏆 Prestasi Baru!`,
    body: achievement.achiever
      ? `${achievement.achiever} — ${achievement.title}`
      : achievement.title,
    url: `/?page=prestasi`,
    tag: `mdta-achievement-${achievement.id}`,
  })
}

/** Notify on gallery create (new photo/video) */
export async function notifyGalleryUpdate(
  gallery: { id: string; title: string; type?: string },
  action: 'created' | 'updated'
): Promise<void> {
  await notifySubscribers({
    title: `🖼️ ${gallery.type === 'video' ? 'Video' : 'Foto'} Baru di Galeri`,
    body: gallery.title,
    url: `/?page=galeri`,
    tag: `mdta-gallery-${gallery.id}`,
  })
}
