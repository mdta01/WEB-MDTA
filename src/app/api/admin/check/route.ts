import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    return NextResponse.json({ authenticated })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
