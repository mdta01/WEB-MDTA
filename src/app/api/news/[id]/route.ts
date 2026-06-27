import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const news = await db.news.findUnique({
      where: { id },
    })

    if (!news) {
      return NextResponse.json(
        { error: 'Berita tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
