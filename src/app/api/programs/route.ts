import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { isActive: true }
    if (category) {
      where.category = category
    }

    const programs = await db.program.findMany({
      where,
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(programs)
  } catch (error) {
    console.error('Programs fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
