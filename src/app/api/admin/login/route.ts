import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, setAdminSession } from '@/lib/auth'

// Force Node.js runtime (not Edge) for Prisma + crypto.subtle compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    // Test database connection first with a clear error if it fails
    let admin
    try {
      admin = await db.admin.findUnique({
        where: { username },
      })
    } catch (dbError) {
      console.error('Database query error in login:', dbError)
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError)
      // Return a helpful error that indicates database issue
      return NextResponse.json(
        {
          error: 'Database belum siap. Kemungkinan tabel belum dibuat atau database belum di-seed. Jalankan: npx prisma db push && npx tsx prisma/seed.ts',
          debug: process.env.NODE_ENV === 'development' ? errMsg : undefined,
          hint: 'Cek /api/health untuk diagnosis lengkap',
        },
        { status: 500 }
      )
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, admin.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    await setAdminSession()

    return NextResponse.json({
      message: 'Login berhasil',
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
    })
  } catch (error) {
    console.error('Login error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? errMsg : undefined,
        hint: 'Cek /api/health untuk diagnosis',
      },
      { status: 500 }
    )
  }
}
