import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/migrate — Run database migrations.
 * Used when prisma db push fails (e.g., DIRECT_URL is not a valid postgresql:// URL).
 *
 * Currently: adds attachmentUrl + attachmentType columns to Announcement table.
 */
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // Add attachmentUrl column if not exists
    try {
      await db.$executeRaw`ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "attachmentUrl" VARCHAR(500)`
      results.push('✅ attachmentUrl column added (or already exists)')
    } catch (e) {
      results.push(`⚠️ attachmentUrl: ${e instanceof Error ? e.message : 'unknown error'}`)
    }

    // Add attachmentType column if not exists
    try {
      await db.$executeRaw`ALTER TABLE IF EXISTS "Announcement" ADD COLUMN IF NOT EXISTS "attachmentType" VARCHAR(20)`
      results.push('✅ attachmentType column added (or already exists)')
    } catch (e) {
      results.push(`⚠️ attachmentType: ${e instanceof Error ? e.message : 'unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    })
  } catch (error) {
    console.error('[Migrate] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/migrate',
    method: 'POST',
    description: 'Run database migrations (adds attachmentUrl + attachmentType to Announcement)',
  })
}
