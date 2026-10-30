import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/fcm-register
 *
 * Register an FCM device token so the server can send push notifications
 * to this device/browser. Called by the client after Firebase getToken().
 *
 * Body:
 * { token: string (required), userAgent?: string, platform?: string, adminId?: string }
 *
 * Idempotent — if token already exists, just updates lastSeen timestamp.
 * Tokens are unique per device/browser — multiple tokens per user is normal.
 *
 * Auth: public (any visitor can subscribe to public notifications).
 * If adminId is provided, caller must be admin-authenticated (TODO).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userAgent, platform, adminId } = body

    // Validate token
    if (!token || typeof token !== 'string' || token.length > 500) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Upsert: if token exists, update lastSeen; else create new
    await db.fcmToken.upsert({
      where: { token },
      create: {
        token,
        userAgent: userAgent?.substring(0, 500) || null,
        platform: platform?.substring(0, 100) || null,
        adminId: adminId || null,
        lastSeen: new Date(),
      },
      update: {
        // Token rotated or re-registered — update metadata
        lastSeen: new Date(),
        userAgent: userAgent?.substring(0, 500) || undefined,
        platform: platform?.substring(0, 100) || undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[fcm-register] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mendaftarkan token' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/fcm-register
 *
 * Unregister an FCM token (called when user disables notifications or logs out).
 * Body: { token: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    await db.fcmToken.deleteMany({ where: { token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[fcm-register] Delete error:', error)
    return NextResponse.json({ error: 'Gagal menghapus token' }, { status: 500 })
  }
}

/**
 * GET /api/notifications/fcm-register
 *
 * Returns total count of registered FCM tokens (for admin stats).
 */
export async function GET() {
  try {
    const count = await db.fcmToken.count()
    return NextResponse.json({ count })
  } catch (error) {
    console.error('[fcm-register] Count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
