import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/admin/migrate-ppdb
 *
 * Adds the new columns (kkUrl, aktaUrl, fotoUrl) to the PPDBRegistration
 * table in the production Neon database using raw SQL ALTER TABLE.
 *
 * This is needed because the Prisma schema was updated with new fields
 * but the production DB table doesn't have these columns yet (can't run
 * `prisma db push` in Vercel serverless).
 *
 * Idempotent: uses IF NOT EXISTS so safe to call multiple times.
 * Safe to call multiple times — won't error if columns already exist.
 *
 * Auth: requires admin session cookie.
 */
export async function POST(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statements = [
    // Add kkUrl column (Cloudinary URL for Kartu Keluarga upload)
    `ALTER TABLE "PPDBRegistration" ADD COLUMN IF NOT EXISTS "kkUrl" TEXT`,
    // Add aktaUrl column (Cloudinary URL for Akta Kelahiran upload)
    `ALTER TABLE "PPDBRegistration" ADD COLUMN IF NOT EXISTS "aktaUrl" TEXT`,
    // Add fotoUrl column (Cloudinary URL for Pas Foto upload)
    `ALTER TABLE "PPDBRegistration" ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT`,
  ]

  const results: Array<{ statement: string; success: boolean; error?: string }> = []

  for (const sql of statements) {
    try {
      await db.$executeRawUnsafe(sql)
      const preview = sql.substring(0, 80).replace(/\s+/g, ' ')
      results.push({ statement: preview, success: true })
    } catch (err) {
      const preview = sql.substring(0, 80).replace(/\s+/g, ' ')
      const errMsg = err instanceof Error ? err.message : String(err)
      results.push({ statement: preview, success: false, error: errMsg })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failedCount = results.length - successCount
  const allSucceeded = failedCount === 0

  // Verify columns exist by trying to query them
  let columnsExist = false
  try {
    await db.pPDBRegistration.findFirst({
      select: { kkUrl: true, aktaUrl: true, fotoUrl: true },
    })
    columnsExist = true
  } catch {
    columnsExist = false
  }

  return NextResponse.json({
    success: allSucceeded,
    message: allSucceeded
      ? 'Kolom kkUrl, aktaUrl, fotoUrl berhasil ditambahkan ke tabel PPDBRegistration.'
      : `${failedCount} dari ${results.length} statement gagal. Cek output untuk detail.`,
    output: results,
    columnsVerified: columnsExist,
    ts: new Date().toISOString(),
  }, { status: allSucceeded ? 200 : 500 })
}
