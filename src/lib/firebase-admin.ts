import admin from 'firebase-admin'

/**
 * Firebase Admin SDK — server-side initialization.
 *
 * Used for:
 * — Sending FCM push notifications from API routes
 * — Verifying FCM tokens
 * — Managing topic subscriptions
 *
 * Init is lazy (only when first used) to avoid Vercel cold-start penalty
 * if notifications aren't needed for a request.
 *
 * Required env vars:
 * — FIREBASE_ADMIN_PROJECT_ID
 * — FIREBASE_ADMIN_CLIENT_EMAIL
 * — FIREBASE_ADMIN_PRIVATE_KEY
 *
 * If env vars not set, getAdminApp() returns null — callers should gracefully
 * fall back to VAPID web-push (existing system).
 */

let adminApp: admin.app.App | null = null
let initAttempted = false

export function getFirebaseAdmin(): admin.app.App | null {
  if (initAttempted) return adminApp
  initAttempted = true

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn(
      '[Firebase Admin] Missing env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY to enable FCM server-side push.'
    )
    return null
  }

  try {
    // Handle different private key formats:
    // — Vercel: keeps \n as literal characters → replace with real newlines
    // — Local .env: may have actual newlines → use as-is
    const privateKey = privateKeyRaw
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----')
      .trim()

    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    })

    console.info('[Firebase Admin] Initialized successfully for project:', projectId)
    return adminApp
  } catch (error) {
    console.error('[Firebase Admin] Init failed:', error)
    return null
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
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
  tag?: string
  data?: Record<string, string>
}

/**
 * Send FCM push notification to a single device token.
 * Uses the legacy HTTP v1 API (via firebase-admin).
 * Returns true on success, false on failure.
 */
export async function sendFcmToDevice(token: string, payload: FcmPayload): Promise<boolean> {
  const messaging = getMessaging()
  if (!messaging) return false

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: payload.url
        ? {
            fcmOptions: {
              link: payload.url,
            },
            notification: {
              icon: payload.icon || '/images/logo-madin-warna.png',
              badge: '/images/logo-madin-warna.png',
              tag: payload.tag || 'mdta-update',
              requireInteraction: false,
            },
          }
        : undefined,
      data: payload.data || {},
      android: {
        notification: {
          icon: payload.icon || '/images/logo-madin-warna.png',
          tag: payload.tag || 'mdta-update',
        },
      },
    }

    const response = await messaging.send(message)
    console.info('[FCM] Sent to device:', response)
    return true
  } catch (error) {
    console.error('[FCM] Send failed:', error)

    // Check if token is invalid → caller should remove from DB
    const errMsg = error instanceof Error ? error.message : String(error)
    if (
      errMsg.includes('UNREGISTERED') ||
      errMsg.includes('invalid-registration-token') ||
      errMsg.includes('registration-token-not-registered')
    ) {
      throw new Error('TOKEN_INVALID')
    }

    return false
  }
}

/**
 * Send FCM push notification to multiple device tokens (multicast).
 * Returns count of successful sends.
 */
export async function sendFcmMulticast(
  tokens: string[],
  payload: FcmPayload
): Promise<{ success: number; failure: number; invalidTokens: string[] }> {
  const messaging = getMessaging()
  if (!messaging || tokens.length === 0) {
    return { success: 0, failure: 0, invalidTokens: [] }
  }

  // FCM multicast supports up to 500 tokens per call
  const BATCH_SIZE = 500
  let totalSuccess = 0
  let totalFailure = 0
  const invalidTokens: string[] = []

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)

    const message: admin.messaging.MulticastMessage = {
      tokens: batch,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: payload.url
        ? {
            fcmOptions: {
              link: payload.url,
            },
            notification: {
              icon: payload.icon || '/images/logo-madin-warna.png',
              badge: '/images/logo-madin-warna.png',
              tag: payload.tag || 'mdta-update',
            },
          }
        : undefined,
      data: payload.data || {},
    }

    try {
      const response = await messaging.sendEachForMulticast(message)
      totalSuccess += response.successCount
      totalFailure += response.failureCount

      // Collect invalid tokens (responses with error)
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errCode = resp.error.code || ''
          const errMsg = resp.error.message || ''
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errMsg.includes('UNREGISTERED') ||
            errMsg.includes('invalid-registration-token')
          ) {
            invalidTokens.push(batch[idx])
          }
        }
      })
    } catch (error) {
      console.error('[FCM] Multicast batch failed:', error)
      totalFailure += batch.length
    }
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
 */
export async function broadcastFcm(payload: FcmPayload): Promise<number> {
  // Dynamic import to avoid circular dependency with db
  const { db } = await import('@/lib/db')

  try {
    const tokens = await db.fcmToken.findMany({ select: { token: true } })
    if (tokens.length === 0) return 0

    const result = await sendFcmMulticast(
      tokens.map((t) => t.token),
      payload
    )

    // Clean up invalid tokens
    if (result.invalidTokens.length > 0) {
      await db.fcmToken.deleteMany({
        where: { token: { in: result.invalidTokens } },
      })
      console.info(`[FCM] Cleaned up ${result.invalidTokens.length} invalid tokens`)
    }

    return result.success
  } catch (error) {
    console.error('[FCM] Broadcast failed:', error)
    return 0
  }
}

export default admin
