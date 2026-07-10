import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public API: list active wali santri meetings, sorted by date asc (upcoming first)
export async function GET() {
  try {
    const meetings = await db.waliSantriMeeting.findMany({
      where: { isActive: true },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Wali santri meetings fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
