import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — fetch likes count + comments for a news article
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [likes, comments] = await Promise.all([
      db.newsLike.count({ where: { newsId: id } }),
      db.newsComment.findMany({
        where: { newsId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ likes, comments })
  } catch (error) {
    console.error('News interactions fetch error:', error)
    return NextResponse.json({ error: 'Gagal memuat interaksi' }, { status: 500 })
  }
}

// POST — like/unlike or comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, sessionId, name, content, parentId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session diperlukan' }, { status: 400 })
    }

    if (action === 'like') {
      // Toggle like
      const existing = await db.newsLike.findUnique({
        where: { newsId_sessionId: { newsId: id, sessionId } },
      })

      if (existing) {
        await db.newsLike.delete({ where: { id: existing.id } })
        const count = await db.newsLike.count({ where: { newsId: id } })
        return NextResponse.json({ liked: false, likes: count })
      } else {
        await db.newsLike.create({ data: { newsId: id, sessionId } })
        const count = await db.newsLike.count({ where: { newsId: id } })
        return NextResponse.json({ liked: true, likes: count })
      }
    }

    if (action === 'comment') {
      if (!name || !content) {
        return NextResponse.json({ error: 'Nama dan komentar diperlukan' }, { status: 400 })
      }

      const comment = await db.newsComment.create({
        data: {
          newsId: id,
          name: name.substring(0, 100),
          content: content.substring(0, 1000),
          parentId: parentId || null,
        },
      })

      return NextResponse.json(comment, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('News interaction error:', error)
    return NextResponse.json({ error: 'Gagal memproses interaksi' }, { status: 500 })
  }
}
