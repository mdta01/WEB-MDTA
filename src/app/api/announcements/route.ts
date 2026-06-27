import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
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
