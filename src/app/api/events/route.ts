import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    const events = await db.event.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
