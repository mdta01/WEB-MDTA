import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force Node.js runtime (not Edge) for Prisma + crypto compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: {
    name: string
    ok: boolean
    detail: string
  }[] = []

  // 1. Check environment variables
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  checks.push({
    name: 'DATABASE_URL env',
    ok: !!databaseUrl,
    detail: databaseUrl
      ? `Set (${databaseUrl.substring(0, 25)}...${databaseUrl.includes('neon') ? ' [neon]' : ''})`
      : 'NOT SET - add DATABASE_URL in Vercel env vars',
  })
  checks.push({
    name: 'DIRECT_URL env',
    ok: !!directUrl,
    detail: directUrl
      ? `Set (${directUrl.substring(0, 25)}...)`
      : 'NOT SET - add DIRECT_URL in Vercel env vars (needed for migrations)',
  })

  // 2. Check if DATABASE_URL looks like PostgreSQL (not SQLite)
  if (databaseUrl) {
    const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
    checks.push({
      name: 'DATABASE_URL format',
      ok: isPostgres,
      detail: isPostgres
        ? 'PostgreSQL connection string (correct)'
        : `Wrong format: "${databaseUrl.substring(0, 30)}" - must start with postgresql:// for Neon`,
    })
  }

  // 3. Check if DATABASE_URL uses pooled connection (for serverless)
  if (databaseUrl && databaseUrl.includes('neon')) {
    const isPooled = databaseUrl.includes('-pooler.')
    checks.push({
      name: 'Connection pooling',
      ok: isPooled,
      detail: isPooled
        ? 'Using pooled connection (-pooler) - correct for serverless'
        : 'WARNING: Not using -pooler connection. Serverless may hit connection limits. Use the pooled URL from Neon dashboard.',
    })
  }

  // 4. Test database connection
  try {
    await db.$queryRaw`SELECT 1`
    checks.push({
      name: 'Database connection',
      ok: true,
      detail: 'Connected to database successfully',
    })
  } catch (error) {
    checks.push({
      name: 'Database connection',
      ok: false,
      detail: `FAILED: ${error instanceof Error ? error.message : String(error)}`,
    })
    // If can't connect, no point checking further
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      allOk: false,
      checks,
      nextSteps:
        'Database connection failed. Check: (1) DATABASE_URL is the Neon pooled connection string, (2) sslmode=require is in the URL, (3) Neon project is active (not suspended).',
    }, { status: 500 })
  }

  // 5. Check if tables exist by counting admins
  try {
    const adminCount = await db.admin.count()
    checks.push({
      name: 'Admin table exists',
      ok: true,
      detail: `Admin table exists with ${adminCount} record(s)`,
    })

    if (adminCount === 0) {
      checks.push({
        name: 'Admin user seeded',
        ok: false,
        detail: 'NO ADMIN USER FOUND. Run: npx tsx prisma/seed.ts (with DATABASE_URL pointing to Neon)',
      })
    } else {
      // Check if mdta01 specifically exists
      const mdta01 = await db.admin.findUnique({ where: { username: 'mdta01' } })
      checks.push({
        name: 'Admin mdta01 exists',
        ok: !!mdta01,
        detail: mdta01
          ? `Found admin: ${mdta01.name} (role: ${mdta01.role})`
          : 'Admin user mdta01 NOT found. Other admins exist. Run seed to create mdta01.',
      })
    }
  } catch (error) {
    checks.push({
      name: 'Admin table check',
      ok: false,
      detail: `Tables may not exist: ${error instanceof Error ? error.message : String(error)}. Run: npx prisma db push`,
    })
  }

  // 6. Check settings table
  try {
    const settingCount = await db.siteSetting.count()
    checks.push({
      name: 'Site settings seeded',
      ok: settingCount > 0,
      detail: `${settingCount} setting(s) found${settingCount === 0 ? ' - run: npx tsx prisma/seed.ts' : ''}`,
    })
  } catch (error) {
    checks.push({
      name: 'Site settings check',
      ok: false,
      detail: `Error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  const allOk = checks.every((c) => c.ok)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    allOk,
    checks,
    nextSteps: allOk
      ? 'All checks passed. Login should work at /admin with username mdta01 and password mdta@01'
      : 'Fix the failing checks above. Most common: run npx prisma db push then npx tsx prisma/seed.ts against Neon.',
  }, { status: allOk ? 200 : 500 })
}
