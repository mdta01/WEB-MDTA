import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }

    const achievements = await db.achievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Achievements fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
