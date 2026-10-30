import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/cleanup-vapid
 *
 * Cleans up orphan VAPID push subscriptions that can no longer receive push
 * (because the device either:
 * — Has been migrated to FCM (recommended path)
 * — Has uninstalled the browser
 * — Has cleared site data
 * — Subscription expired naturally after 30+ days of no interaction)
 *
 * Strategy: try sending a tiny "ping" push to each subscription. If the
 * push service returns 404/410 Gone, the subscription is dead → delete it.
 * This reduces DB bloat and makes future broadcasts faster (no wasted
 * HTTP requests to dead endpoints).
 *
 * Auth: admin session required (this is a maintenance operation).
 *
 * Returns: { success, totalChecked, deleted, kept }
 */
export async function POST(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Skip if VAPID keys not configured (no way to ping)
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    // Just delete all VAPID subscriptions — they can't receive push anyway
    try {
      const count = await db.pushSubscription.deleteMany({})
      return NextResponse.json({
        success: true,
        message: 'VAPID keys not configured — cleared all legacy VAPID subscriptions',
        deleted: count.count,
        totalChecked: count.count,
        kept: 0,
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to clean up' }, { status: 500 })
    }
  }

  // Dynamic import web-push (heavy)
  const { webpush } = await import('@/lib/webpush')

  const subscriptions = await db.pushSubscription.findMany()
  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No VAPID subscriptions to clean up',
      totalChecked: 0,
      deleted: 0,
      kept: 0,
    })
  }

  const deadEndpoints: string[] = []
  const liveCount = { count: 0 }

  // Ping each subscription with a tiny no-op push
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys),
          },
          JSON.stringify({ title: '⏰ Ping', body: 'Checking subscription health', tag: 'mdta-ping' })
        )
        liveCount.count++
      } catch (error) {
        const err = error as { statusCode?: number }
        // 404/410 Gone = subscription expired/unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
          deadEndpoints.push(sub.endpoint)
        } else {
          // Other errors (network, 429 rate limit, etc) — keep the subscription
          liveCount.count++
        }
      }
    })
  )

  // Delete dead subscriptions
  if (deadEndpoints.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: deadEndpoints } },
    })
  }

  return NextResponse.json({
    success: true,
    message: `Cleanup complete. Removed ${deadEndpoints.length} dead VAPID subscriptions.`,
    totalChecked: subscriptions.length,
    deleted: deadEndpoints.length,
    kept: liveCount.count,
  })
}

/**
 * GET /api/notifications/cleanup-vapid
 * Returns VAPID subscriber count (for admin stats dashboard).
 */
export async function GET() {
  try {
    const count = await db.pushSubscription.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
