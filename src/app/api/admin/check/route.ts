import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (authenticated) {
      // Get the first admin's name for display
      const admin = await db.admin.findFirst()
      return NextResponse.json({ 
        authenticated: true,
        name: admin?.name || 'Admin',
      })
    }
    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
