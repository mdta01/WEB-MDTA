import webpush from 'web-push'

// Configure web-push with VAPID keys
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('[WebPush] Missing VAPID keys. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT')
} else {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@mdta-miftahululum01.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export { webpush }

export interface PushSubscriptionData {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface PushPayload {
  title: string
  body: string
  url?: string  // URL to navigate when clicked
  tag?: string
  icon?: string
}

/**
 * Send push notification to a single subscription.
 *
 * Returns false (not error) if VAPID keys not configured — caller should
 * treat as "skipped" rather than "failed".
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.debug('[WebPush] VAPID keys not configured, skipping push')
    return false
  }

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    )
    return true
  } catch (error) {
    console.error('[WebPush] Failed to send:', error)
    return false
  }
}

/**
 * Send push notification to all stored subscriptions.
 * Returns count of successful sends.
 *
 * Note: VAPID subscribers use the LEGACY VAPID key (VAPID_PUBLIC_KEY env).
 * New subscribers are encouraged to use FCM (firebase-admin SDK).
 * This function only reaches VAPID subscribers — for new subscribers,
 * use broadcastFcm() from lib/firebase-admin.ts instead.
 *
 * If VAPID_PUBLIC_KEY env is not set (orphan subscribers from old system),
 * this function will gracefully return 0 without sending.
 */
export async function broadcastPushNotification(payload: PushPayload): Promise<number> {
  // Skip if VAPID keys not configured (Firebase-only setup)
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.debug('[WebPush] VAPID keys not configured — skipping VAPID broadcast (FCM only)')
    return 0
  }

  // Dynamic import to avoid circular dependency
  const { db } = await import('@/lib/db')

  let subscriptions: Array<{ endpoint: string; keys: string }>
  try {
    subscriptions = await db.pushSubscription.findMany()
  } catch {
    // Table not available — silently skip
    return 0
  }

  if (subscriptions.length === 0) return 0

  let successCount = 0
  const failedEndpoints: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        const subData: PushSubscriptionData = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys),
        }
        const ok = await sendPushNotification(subData, payload)
        if (ok) successCount++
      } catch {
        // Subscription expired or invalid — mark for deletion
        failedEndpoints.push(sub.endpoint)
      }
    })
  )

  // Clean up expired subscriptions
  if (failedEndpoints.length > 0) {
    try {
      await db.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      })
      console.info(`[WebPush] Cleaned up ${failedEndpoints.length} invalid VAPID subscriptions`)
    } catch {}
  }

  return successCount
}
