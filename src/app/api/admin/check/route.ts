import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (authenticated) {
      // Get the first admin's name for display
      let admin = null
      try {
        admin = await db.admin.findFirst()
      } catch (dbError) {
        console.error('DB error in auth check:', dbError)
      }
      return NextResponse.json({
        authenticated: true,
        name: admin?.name || 'Admin',
      })
    }
    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Terjadi kesalahan server' },
      { status: 200 } // Return 200 with authenticated:false so client doesn't crash
    )
  }
}
