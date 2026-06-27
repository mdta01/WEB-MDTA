import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const alumni = await db.alumni.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alumni)
  } catch (error) {
    console.error('Alumni fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
