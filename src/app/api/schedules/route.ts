import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const schedules = await db.schedule.findMany({
      orderBy: [{ day: 'asc' }, { timeStart: 'asc' }],
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Schedules fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
