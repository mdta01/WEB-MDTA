import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendFcmToDevice, getMessaging } from '@/lib/firebase-admin'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/notifications/send-test
 *
 * Debug endpoint to send a test push notification to a SPECIFIC FCM token
 * (or all FCM tokens if no token specified). Useful for verifying that
 * FCM delivery works end-to-end.
 *
 * Body:
 * { token?: string (specific device token, omit to send to all), title?, body?, url? }
 *
 * Response:
 * — 200: { success, message, sentTo, fcmResult }
 * — 401: Unauthorized
 * — 500: { error, details }
 *
 * Auth: admin session required.
 */
export async function POST(request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First, check if Firebase Admin is even configured
  const messaging = getMessaging()
  if (!messaging) {
    // Try to get more info about why
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
    const app = getFirebaseAdmin()
    const fa = await import('firebase-admin')
    const apps = fa.getApps()

    // Try to manually init to capture the EXACT error
    let initError: string | null = null
    let initErrorStack: string | null = null
    try {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''

      // Same processing as firebase-admin.ts
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim()

      // Try creating credential directly to isolate error
      const cred = fa.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      })
      console.log('[debug] credential.cert succeeded, trying initializeApp...')

      // Try init with a unique name so we can see if conflict
      try {
        const testApp = fa.initializeApp(
          { credential: cred, projectId },
          'test-' + Date.now()
        )
        console.log('[debug] initializeApp succeeded!', testApp.name)
        // Clean up test app
        await testApp.delete()
      } catch (e) {
        initError = e instanceof Error ? e.message : String(e)
        initErrorStack = e instanceof Error ? e.stack : null
      }
    } catch (e) {
      initError = e instanceof Error ? e.message : String(e)
      initErrorStack = e instanceof Error ? e.stack : null
    }

    return NextResponse.json({
      success: false,
      error: 'Firebase Admin SDK not configured (getMessaging returned null)',
      envCheck: {
        hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || null,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
        privateKeyStartsWithBegin: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.startsWith('-----BEGIN') || false,
        privateKeyHasEscapedNewlines: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes('\\n') || false,
        privateKeyFirst80: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 80) || null,
        privateKeyLast80: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(
          (process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0) - 80
        ) || null,
      },
      debug: {
        appIsNull: app === null,
        existingAppsCount: apps.length,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        initError,
        initErrorStack: initErrorStack?.substring(0, 1000),
      },
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { token, title, body: message, url } = body

    const payload = {
      title: title || '🔔 Test Push Notification',
      body: message || 'Verifikasi FCM delivery berfungsi',
      url: url || '/',
      tag: 'test-push-' + Date.now(),
      icon: '/images/logo-madin-warna.png',
    }

    // If specific token provided → send to that one device
    if (token) {
      try {
        const ok = await sendFcmToDevice(token, payload)
        return NextResponse.json({
          success: ok,
          message: ok ? 'Push sent to specific device' : 'Push failed (see logs)',
          sentTo: 'specific:' + token.substring(0, 30) + '...',
          token: token.substring(0, 50) + '...',
          payload,
        })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
          success: false,
          error: errMsg,
          tokenInvalid: errMsg === 'TOKEN_INVALID',
        }, { status: 500 })
      }
    }

    // No specific token → send to ALL registered FCM tokens
    const tokens = await db.fcmToken.findMany({ select: { token: true, id: true } })

    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No FCM tokens registered. User must click bell button & grant permission first.',
        fcmTokenCount: 0,
      }, { status: 200 })
    }

    const results = await Promise.allSettled(
      tokens.map((t) => sendFcmToDevice(t.token, payload))
    )

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length
    const failureCount = results.length - successCount
    const invalidTokenIds: string[] = []

    results.forEach((r, idx) => {
      if (r.status === 'rejected' && r.reason instanceof Error && r.reason.message === 'TOKEN_INVALID') {
        invalidTokenIds.push(tokens[idx].id)
      }
    })

    // Clean up invalid tokens
    if (invalidTokenIds.length > 0) {
      await db.fcmToken.deleteMany({ where: { id: { in: invalidTokenIds } } })
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent to ${successCount}/${tokens.length} devices`,
      fcmTokenCount: tokens.length,
      sentTo: 'all',
      successCount,
      failureCount,
      invalidTokensRemoved: invalidTokenIds.length,
      payload,
    })
  } catch (error) {
    console.error('[send-test] Error:', error)
    return NextResponse.json({
      error: 'Failed to send test push',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

/**
 * GET /api/notifications/send-test
 * Returns FCM config status & token count (for admin debugging).
 */
export async function GET() {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messaging = getMessaging()
  let tokenCount = 0
  try {
    tokenCount = await db.fcmToken.count()
  } catch {}

  return NextResponse.json({
    fcmConfigured: !!messaging,
    envCheck: {
      hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || null,
    },
    fcmTokenCount: tokenCount,
    vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  })
}
