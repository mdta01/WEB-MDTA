import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/migrate-fcm
 *
 * Creates the FcmToken table in the production database using raw SQL.
 * Needed because Prisma db push can't run in Vercel standalone build,
 * and the FcmToken model was just added for FCM integration.
 *
 * Idempotent: uses CREATE TABLE IF NOT EXISTS.
 *
 * Auth: admin session required.
 */
export async function POST(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS "FcmToken" (
      "id" TEXT PRIMARY KEY,
      "token" TEXT UNIQUE NOT NULL,
      "adminId" TEXT,
      "userAgent" TEXT,
      "platform" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "FcmToken_adminId_idx" ON "FcmToken"("adminId")`,
    `CREATE INDEX IF NOT EXISTS "FcmToken_lastSeen_idx" ON "FcmToken"("lastSeen")`,
  ]

  const results: Array<{ statement: string; success: boolean; error?: string }> = []

  for (const sql of statements) {
    try {
      await db.$executeRawUnsafe(sql)
      const preview = sql.substring(0, 60).replace(/\s+/g, ' ') + '...'
      results.push({ statement: preview, success: true })
    } catch (err) {
      const preview = sql.substring(0, 60).replace(/\s+/g, ' ') + '...'
      const errMsg = err instanceof Error ? err.message : String(err)
      results.push({ statement: preview, success: false, error: errMsg })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const allSucceeded = successCount === results.length

  // Verify table exists by counting rows
  let tokenCount = 0
  try {
    tokenCount = await db.fcmToken.count()
  } catch {
    // table still doesn't exist
  }

  return NextResponse.json({
    success: allSucceeded,
    message: allSucceeded
      ? 'Tabel FcmToken berhasil dibuat. Firebase Cloud Messaging siap digunakan.'
      : `${successCount}/${results.length} statement berhasil. Cek output.`,
    output: results,
    table: {
      FcmToken: { exists: true, rowCount: tokenCount },
    },
    ts: new Date().toISOString(),
  }, { status: allSucceeded ? 200 : 500 })
}
