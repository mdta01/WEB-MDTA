import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }
    if (type) {
      where.type = type
    }

    const gallery = await db.gallery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Gallery fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
