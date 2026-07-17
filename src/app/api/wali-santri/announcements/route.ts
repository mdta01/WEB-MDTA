import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public API: list announcements khusus wali santri (type='wali_santri')
export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      where: { isActive: true, type: 'wali_santri' },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Wali santri announcements fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
