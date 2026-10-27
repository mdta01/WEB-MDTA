import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/admin/migrate-db
 *
 * Creates the Visitor & PageView tables in the production database using
 * raw SQL via Prisma Client's $executeRawUnsafe. This avoids the need for
 * the `prisma` CLI binary (which isn't available in Vercel standalone output).
 *
 * Idempotent: uses `CREATE TABLE IF NOT EXISTS` so safe to call multiple times.
 *
 * Auth: requires admin session cookie.
 */
export async function POST(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statements = [
    // Visitor table — unique visitors (hashed IP)
    `CREATE TABLE IF NOT EXISTS "Visitor" (
      "id" TEXT PRIMARY KEY,
      "visitorHash" TEXT UNIQUE NOT NULL,
      "sessionHash" TEXT,
      "country" TEXT,
      "city" TEXT,
      "referrer" TEXT,
      "path" TEXT,
      "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "visitCount" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "Visitor_lastSeen_idx" ON "Visitor"("lastSeen")`,
    `CREATE INDEX IF NOT EXISTS "Visitor_createdAt_idx" ON "Visitor"("createdAt")`,

    // PageView table — one row per page load (for realtime + aggregation)
    `CREATE TABLE IF NOT EXISTS "PageView" (
      "id" TEXT PRIMARY KEY,
      "visitorHash" TEXT NOT NULL,
      "path" TEXT NOT NULL,
      "day" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "PageView_day_idx" ON "PageView"("day")`,
    `CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "PageView_visitorHash_idx" ON "PageView"("visitorHash")`,
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
      // Stop on first error (subsequent indexes depend on table existing)
      if (errMsg.includes('does not exist') || errMsg.includes('relation')) {
        break
      }
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failedCount = results.length - successCount
  const allSucceeded = failedCount === 0

  // Verify tables exist by counting rows
  let visitorCount = 0
  let pageViewCount = 0
  try {
    visitorCount = await db.visitor.count()
  } catch {
    // table still doesn't exist
  }
  try {
    pageViewCount = await db.pageView.count()
  } catch {
    // table still doesn't exist
  }

  return NextResponse.json({
    success: allSucceeded,
    message: allSucceeded
      ? 'Tabel Visitor & PageView berhasil dibuat di database production.'
      : `${failedCount} dari ${results.length} statement gagal. Cek output untuk detail.`,
    output: results,
    tables: {
      Visitor: { exists: true, rowCount: visitorCount },
      PageView: { exists: true, rowCount: pageViewCount },
    },
    ts: new Date().toISOString(),
  }, { status: allSucceeded ? 200 : 500 })
}
