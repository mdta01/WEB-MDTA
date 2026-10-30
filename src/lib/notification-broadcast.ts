import { broadcastFcm } from '@/lib/firebase-admin'
import { broadcastPushNotification } from '@/lib/webpush'

/**
 * Reusable broadcast helper — sends push notification via BOTH FCM and VAPID
 * in parallel. This ensures maximum reach:
 * — FCM: faster, more reliable, supports iOS Safari 16.4+, background delivery
 * — VAPID: fallback for older browsers / users who haven't migrated yet
 *
 * Why both? Some users may have VAPID subscription (legacy) without FCM token.
 * Sending to both ensures they all receive the notification.
 * The SW's deduplication logic prevents showing 2 notifications on devices
 * that somehow have both.
 *
 * Never throws — push failure is logged but doesn't break the caller (CRUD op).
 */

export interface NotifyPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

/**
 * Broadcast push notification to ALL subscribers (FCM + VAPID) in parallel.
 * Returns combined stats. Never throws.
 */
export async function notifySubscribers(payload: NotifyPayload): Promise<{
  fcmSent: number
  vapidSent: number
  total: number
}> {
  // Truncate to notification display limits
  const title = (payload.title || '').substring(0, 150)
  const body = (payload.body || '').substring(0, 200)
  const url = payload.url || '/'
  const tag = payload.tag || 'mdta-update'
  const icon = payload.icon || '/images/logo-madin-warna.png'

  // Run FCM + VAPID broadcasts in PARALLEL for max speed
  const [fcmResult, vapidResult] = await Promise.allSettled([
    broadcastFcm({ title, body, url, tag, icon }),
    broadcastPushNotification({ title, body, url, tag, icon }),
  ])

  const fcmSent = fcmResult.status === 'fulfilled' ? fcmResult.value : 0
  const vapidSent = vapidResult.status === 'fulfilled' ? vapidResult.value : 0

  if (fcmResult.status === 'rejected') {
    console.error('[notifySubscribers] FCM broadcast rejected:', fcmResult.reason)
  }
  if (vapidResult.status === 'rejected') {
    console.error('[notifySubscribers] VAPID broadcast rejected:', vapidResult.reason)
  }

  console.info(`[notifySubscribers] Sent: FCM=${fcmSent}, VAPID=${vapidSent}, total=${fcmSent + vapidSent}`)

  return {
    fcmSent,
    vapidSent,
    total: fcmSent + vapidSent,
  }
}

// ===== Convenience helpers for common entity types =====

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

