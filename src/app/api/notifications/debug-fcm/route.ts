import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/debug-fcm
 *
 * Debug endpoint yang menampilkan ERROR sebenarnya saat inisialisasi firebase-admin.
 */
export async function GET(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''

  const envCheck = {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKeyRaw,
    projectId,
    privateKeyLength: privateKeyRaw.length,
    privateKeyStartsWithBegin: privateKeyRaw.startsWith('-----BEGIN'),
    privateKeyHasEscapedNewlines: privateKeyRaw.includes('\\n'),
    privateKeyFirst60: privateKeyRaw.substring(0, 60),
    privateKeyLast60: privateKeyRaw.substring(Math.max(0, privateKeyRaw.length - 60)),
  }

  // Try to require firebase-admin
  let faRequireError: string | null = null
  let fa: any = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fa = require('firebase-admin')
  } catch (e) {
    faRequireError = e instanceof Error ? e.message : String(e)
  }

  if (faRequireError) {
    return NextResponse.json({
      envCheck,
      step: 'require(firebase-admin)',
      error: faRequireError,
    })
  }

  // Check fa structure
  const faKeys = Object.keys(fa || {}).sort()
  const hasCert = typeof fa?.cert === 'function'
  const hasInitializeApp = typeof fa?.initializeApp === 'function'
  const hasGetApps = typeof fa?.getApps === 'function'
  const hasCredential = typeof fa?.credential === 'object' && typeof fa?.credential?.cert === 'function'

  // Try to create credential
  let credError: string | null = null
  let cred: any = null
  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim()
    if (hasCert) {
      cred = fa.cert({
        projectId,
        clientEmail,
        privateKey,
      })
    } else if (hasCredential) {
      cred = fa.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      })
    } else {
      credError = 'Neither fa.cert nor fa.credential.cert is available'
    }
  } catch (e) {
    credError = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  }

  // Try to init app
  let initError: string | null = null
  let initStack: string | null = null
  let app: any = null
  if (cred && hasInitializeApp) {
    try {
      // Clean up existing apps first
      const existing = fa.getApps()
      for (const a of existing) {
        try { await a.delete() } catch {}
      }
      app = fa.initializeApp({ credential: cred, projectId }, 'debug-' + Date.now())
    } catch (e) {
      initError = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
      initStack = e instanceof Error ? e.stack : null
    }
  }

  // Try to get messaging
  let messagingError: string | null = null
  let messaging: any = null
  if (app) {
    try {
      messaging = app.messaging()
    } catch (e) {
      messagingError = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json({
    envCheck,
    faStructure: {
      availableKeys: faKeys,
      hasCert,
      hasInitializeApp,
      hasGetApps,
      hasCredential,
    },
    credential: {
      success: !!cred,
      error: credError,
    },
    initApp: {
      success: !!app,
      error: initError,
      stack: initStack?.substring(0, 1500),
    },
    messaging: {
      success: !!messaging,
      error: messagingError,
    },
  })
}
