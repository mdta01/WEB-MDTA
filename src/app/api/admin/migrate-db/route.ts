import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60s — Vercel hobby plan max

const execAsync = promisify(exec)

/**
 * POST /api/admin/migrate-db
 *
 * Triggers `prisma db push --accept-data-loss` on the server (Vercel function).
 * Creates any missing tables/columns in the production Neon database based on
 * the current schema.prisma — used to create the Visitor & PageView tables
 * after the visitor tracking feature was added.
 *
 * Auth: requires admin session cookie.
 *
 * Returns:
 * — 200 OK with stdout/stderr on success
 * — 500 with error message on failure
 *
 * NOTE: This runs `prisma db push` via child_process. On Vercel serverless,
 * the function has a 60s timeout (hobby plan) — should be plenty for db push
 * of a small schema. For large migrations, consider running locally with
 * `bun run db:push` after `vercel env pull`.
 */
export async function POST(_request: NextRequest) {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run prisma db push — accepts data loss (skip interactive prompt, CI-safe)
    // --skip-generate because postinstall already runs `prisma generate`
    const { stdout, stderr } = await execAsync(
      'npx prisma db push --accept-data-loss --skip-generate',
      {
        cwd: process.cwd(),
        timeout: 55000, // 55s — leave 5s buffer before function timeout
        maxBuffer: 1024 * 1024, // 1MB output buffer
        env: {
          ...process.env,
          // Ensure prisma uses the production schema file
          PRISMA_SCHEMA_PATH: 'prisma/schema.prisma',
        },
      }
    )

    // Prisma often writes progress to stderr (not an error, just info)
    const output = (stdout + (stderr ? '\n--- stderr ---\n' + stderr : '')).trim()

    return NextResponse.json({
      success: true,
      message: 'Schema berhasil di-push ke database. Tabel Visitor & PageView (dan tabel lain yang hilang) sudah dibuat.',
      output: output.substring(0, 4000), // truncate for response size
      ts: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[migrate-db] Error:', error)

    // Extract useful error message from child_process error
    const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean }
    const errorOutput = (err.stdout || '') + (err.stderr ? '\n' + err.stderr : '')

    // Check common failure causes
    let hint = ''
    if (errorOutput.includes('DIRECT_URL') || errorOutput.includes('directUrl')) {
      hint = ' Environment variable DIRECT_URL belum di-set di Vercel. Set di: Vercel Dashboard → Project → Settings → Environment Variables. Format: postgresql://user:pass@host/db?sslmode=require'
    } else if (errorOutput.includes('DATABASE_URL')) {
      hint = ' Environment variable DATABASE_URL belum di-set di Vercel.'
    } else if (err.killed) {
      hint = ' Proses timeout (>55s). Database mungkin terlalu besar atau koneksi lambat. Coba jalankan manual: bun run db:push setelah vercel env pull.'
    }

    return NextResponse.json({
      success: false,
      error: 'Gagal menjalankan prisma db push',
      output: (errorOutput || err.message || 'Unknown error').substring(0, 4000),
      hint: hint.trim(),
      ts: new Date().toISOString(),
    }, { status: 500 })
  }
}
