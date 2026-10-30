// Use require() (CommonJS) instead of import to avoid Next.js Turbopack
// tree-shaking issues that cause admin.credential to be undefined.
// firebase-admin v14 exposes credential functions directly at module root.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin') as typeof import('firebase-admin')

/**
 * Firebase Admin SDK - server-side initialization for FCM push notifications.
 *
 * Required env vars:
 * - FIREBASE_ADMIN_PROJECT_ID
 * - FIREBASE_ADMIN_CLIENT_EMAIL
 * - FIREBASE_ADMIN_PRIVATE_KEY
 *
 * If env vars not set, returns null - callers should fall back to VAPID.
 */

let adminApp: typeof import('firebase-admin').default.app.App | null = null

/**
 * Get or initialize the Firebase Admin app.
 *
 * IMPORTANT: We do NOT cache failure (no initAttempted flag).
 * In Vercel serverless, env vars might not be loaded on the very first
 * call (cold start race condition). Each call re-checks env vars and
 * tries to init if not yet done successfully.
 *
 * If already initialized successfully, returns cached app (fast path).
 * If env vars missing OR init fails, returns null (caller falls back to VAPID).
 */
export function getFirebaseAdmin() {
  // Fast path: already initialized successfully
  if (adminApp) return adminApp

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKeyRaw) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      console.debug('[Firebase Admin] Env vars not yet loaded. Will retry on next call.')
    }
    return null
  }

  try {
    // Handle different private key formats:
    // - Vercel: keeps \n as literal characters, replace with real newlines
    // - Local .env: may have actual newlines, use as-is
    let privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim()

    // Some env var systems wrap the key in quotes — strip them
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).trim()
    }

    // Reuse existing app if already initialized (HMR in dev, repeated calls in lambda)
    const existingApps = (admin as typeof import('firebase-admin')).getApps()
    if (existingApps.length > 0) {
      adminApp = existingApps[0]
      console.info('[Firebase Admin] Reusing existing app for project:', projectId)
      return adminApp
    }

    // Detailed credential validation before initApp
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error(
        `Private key format invalid. Expected "-----BEGIN PRIVATE KEY-----" header. ` +
          `Got first 50 chars: "${privateKey.substring(0, 50)}". ` +
          `Raw length: ${privateKeyRaw.length}, processed length: ${privateKey.length}`
      )
    }

    // firebase-admin v14+ exposes `cert` directly (not admin.credential.cert)
    const cred = (admin as typeof import('firebase-admin')).cert({
      projectId,
      clientEmail,
      privateKey,
    })

    adminApp = (admin as typeof import('firebase-admin')).initializeApp({
      credential: cred,
      projectId,
    })

    console.info('[Firebase Admin] Initialized successfully for project:', projectId)
    return adminApp
  } catch (error) {
    // Log the FULL error so we can see what went wrong
    console.error('[Firebase Admin] Init FAILED:', error)
    if (error instanceof Error) {
      console.error('[Firebase Admin] Error message:', error.message)
      console.error('[Firebase Admin] Error stack:', error.stack)
    }
    // Reset so next call retries (do not cache failure)
    adminApp = null
    return null
  }
}

export function getMessaging() {
  const app = getFirebaseAdmin()
  if (!app) return null
  try {
    return app.messaging()
  } catch (error) {
    console.error('[Firebase Admin] getMessaging failed:', error)
    return null
  }
}

export interface FcmPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, string>
}

/**
 * Build a complete FCM Message for a single device token.
 *
 * Includes:
 * - notification (auto-displayed by browser/OS)
 * - webpush (webpush-specific options: click_action, icon, badge, Urgency high)
 * - android (high priority, notification channel, click action)
 * - apns (iOS-specific: alert, sound, priority 10, push-type alert)
 * - data (custom data for onBackgroundMessage handler)
 */
function buildMessage(token: string, payload: FcmPayload) {
  const icon = payload.icon || '/images/logo-madin-warna.png'
  const badge = payload.badge || '/images/logo-madin-warna.png'
  const tag = payload.tag || 'mdta-update'
  const url = payload.url || '/'

  return {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      fcmOptions: {
        link: url,
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon,
        badge,
        tag,
        requireInteraction: false,
        actions: [],
        data: {
          url,
          ...(payload.data || {}),
        },
      },
      headers: {
        Urgency: 'high',
        Topic: tag,
      },
    },
    android: {
      priority: 'high' as const,
      notification: {
        title: payload.title,
        body: payload.body,
        icon,
        tag,
        color: '#003527',
        channelId: 'mdta-notifications',
        priority: 'high' as const,
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public' as const,
        clickAction: url,
      },
      data: {
        url,
        ...(payload.data || {}),
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
          badge: 0,
          'thread-id': tag,
          mutableContent: 1,
        },
        url,
        ...(payload.data || {}),
      },
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
    },
    data: {
      url,
      title: payload.title,
      body: payload.body,
      tag,
      ...(payload.data || {}),
    },
  }
}

/**
 * Send FCM push notification to a single device token.
 * Returns true on success, false on failure (or throws 'TOKEN_INVALID' for dead tokens).
 */
export async function sendFcmToDevice(token: string, payload: FcmPayload): Promise<boolean> {
  const messaging = getMessaging()
  if (!messaging) return false

  try {
    const message = buildMessage(token, payload)
    const response = await messaging.send(message)
    console.info('[FCM] Sent to device:', response, 'token:', token.substring(0, 20) + '...')
    return true
  } catch (error) {
    console.error('[FCM] Send failed:', error)

    const errMsg = error instanceof Error ? error.message : String(error)
    const errCode = (error as { code?: string })?.code || ''

    if (
      errMsg.includes('UNREGISTERED') ||
      errMsg.includes('invalid-registration-token') ||
      errMsg.includes('registration-token-not-registered') ||
      errCode === 'messaging/registration-token-not-registered'
    ) {
      throw new Error('TOKEN_INVALID')
    }

    return false
  }
}

/**
 * Send FCM push notification to multiple device tokens.
 * Sends per-token in parallel batches for maximum reliability & detailed error reporting.
 *
 * Returns: { success, failure, invalidTokens }
 */
export async function sendFcmMulticast(
  tokens: string[],
  payload: FcmPayload
): Promise<{ success: number; failure: number; invalidTokens: string[] }> {
  const messaging = getMessaging()
  if (!messaging || tokens.length === 0) {
    return { success: 0, failure: 0, invalidTokens: [] }
  }

  const BATCH_SIZE = 100
  let totalSuccess = 0
  let totalFailure = 0
  const invalidTokens: string[] = []

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map((token) => messaging.send(buildMessage(token, payload)))
    )

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        totalSuccess++
      } else {
        const reason = result.reason
        const errMsg = reason instanceof Error ? reason.message : String(reason)
        const errCode = (reason as { code?: string })?.code || ''

        if (
          errMsg.includes('UNREGISTERED') ||
          errMsg.includes('invalid-registration-token') ||
          errMsg.includes('registration-token-not-registered') ||
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(batch[idx])
        } else {
          console.error(`[FCM] Send failed for token ${batch[idx].substring(0, 20)}...:`, errMsg)
        }
        totalFailure++
      }
    })
  }

  return {
    success: totalSuccess,
    failure: totalFailure,
    invalidTokens,
  }
}

/**
 * Broadcast push notification to ALL registered FCM tokens.
 * Returns count of successful sends.
 * Auto-cleans up invalid tokens (unregistered/expired).
 */
export async function broadcastFcm(payload: FcmPayload): Promise<number> {
  const { db } = await import('@/lib/db')

  try {
    const tokens = await db.fcmToken.findMany({ select: { token: true } })
    if (tokens.length === 0) {
      console.info('[FCM] Broadcast: 0 tokens registered')
      return 0
    }

    console.info(`[FCM] Broadcasting to ${tokens.length} devices...`)

    const result = await sendFcmMulticast(
      tokens.map((t) => t.token),
      payload
    )

    if (result.invalidTokens.length > 0) {
      try {
        await db.fcmToken.deleteMany({
          where: { token: { in: result.invalidTokens } },
        })
        console.info(`[FCM] Cleaned up ${result.invalidTokens.length} invalid tokens`)
      } catch (e) {
        console.error('[FCM] Cleanup failed:', e)
      }
    }

    console.info(
      `[FCM] Broadcast complete: ${result.success} success, ${result.failure} failed`
    )

    return result.success
  } catch (error) {
    console.error('[FCM] Broadcast failed:', error)
    return 0
  }
}

export default admin
