import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public API: list active PPDB schedules, sorted by order asc then startDate asc
export async function GET() {
  try {
    const schedules = await db.pPDBSchedule.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('PPDB schedules fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
