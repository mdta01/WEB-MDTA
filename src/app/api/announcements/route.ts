import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Exclude type='wali_santri' — those are shown only in Wali Santri section
    const announcements = await db.announcement.findMany({
      where: {
        isActive: true,
        type: { not: 'wali_santri' },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Announcements fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
