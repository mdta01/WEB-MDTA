import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { isPublished: true }
    if (category) {
      where.category = category
    }

    const dakwah = await db.dakwah.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(dakwah)
  } catch (error) {
    console.error('Dakwah fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
