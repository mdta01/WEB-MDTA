import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { broadcastPushNotification } from '@/lib/webpush'
import { broadcastFcm } from '@/lib/firebase-admin'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/push
 *
 * Admin broadcasts a push notification to ALL subscribers.
 * Tries Firebase Cloud Messaging first (more reliable, supports iOS Safari,
 * background delivery even when browser is closed). Falls back to VAPID
 * web-push for older browsers / if FCM not configured.
 *
 * Body:
 * { title: string, body: string, url?: string, tag?: string, adminId?: string }
 *
 * Response:
 * { success: true, fcmSent: N, vapidSent: M, total: N+M }
 *
 * Auth: admin session cookie required.
 */
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: message, url, tag, adminId } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title dan body harus diisi' },
        { status: 400 }
      )
    }

    // Prepare payload (shared between FCM and VAPID)
    const icon = '/images/logo-madin-warna.png'
    const targetUrl = url || '/'

    // ===== Strategy: try FCM first, fall back to VAPID =====
    let fcmSent = 0
    let vapidSent = 0
    const errors: string[] = []

    // Try FCM broadcast (only if Firebase Admin is configured & tokens exist)
    try {
      const fcmPayload = {
        title,
        body: message,
        url: targetUrl,
        tag: tag || 'mdta-push',
        icon,
        data: adminId ? { adminId } : undefined,
      }

      // If adminId provided, send only to that admin's tokens
      if (adminId) {
        const adminTokens = await db.fcmToken
          .findMany({ where: { adminId }, select: { token: true } })
          .catch(() => [])
        if (adminTokens.length > 0) {
          const { sendFcmMulticast } = await import('@/lib/firebase-admin')
          const result = await sendFcmMulticast(
            adminTokens.map((t) => t.token),
            fcmPayload
          )
          fcmSent = result.success

          // Clean up invalid tokens
          if (result.invalidTokens.length > 0) {
            await db.fcmToken
              .deleteMany({ where: { token: { in: result.invalidTokens } } })
              .catch(() => {})
          }
        }
      } else {
        // Broadcast to ALL tokens
        fcmSent = await broadcastFcm(fcmPayload)
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('[push] FCM broadcast failed:', errMsg)
      errors.push(`FCM: ${errMsg}`)
    }

    // Fall back to VAPID web-push (covers browsers without FCM token)
    try {
      vapidSent = await broadcastPushNotification({
        title,
        body: message,
        url: targetUrl,
        tag: tag || 'mdta-push',
        icon,
      })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('[push] VAPID broadcast failed:', errMsg)
      errors.push(`VAPID: ${errMsg}`)
    }

    const totalSent = fcmSent + vapidSent

    // If both failed, return error
    if (totalSent === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal mengirim push notification ke semua channel',
          details: errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fcmSent,
      vapidSent,
      total: totalSent,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    })
  } catch (error) {
    console.error('[push] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim push notification' },
      { status: 500 }
    )
  }
}

