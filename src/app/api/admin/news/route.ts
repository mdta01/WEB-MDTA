import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { broadcastPushNotification } from '@/lib/webpush'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const news = await db.news.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error('Admin news fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, excerpt, image, category, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten harus diisi' }, { status: 400 })
    }

    const news = await db.news.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        image: image || null,
        category: category || 'kegiatan',
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    // Send push notification to all subscribers
    await broadcastPushNotification({
      title: 'Berita Baru',
      body: title.length > 80 ? title.substring(0, 80) + '...' : title,
      url: '/?page=berita',
      tag: `mdta-news-${news.id}`,
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Admin news create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
