import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const statistics = await db.statistic.findMany()
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Statistics fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
