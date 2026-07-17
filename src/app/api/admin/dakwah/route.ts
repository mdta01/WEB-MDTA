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

    const dakwah = await db.dakwah.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(dakwah)
  } catch (error) {
    console.error('Admin dakwah fetch error:', error)
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
    const { title, content, category, author, videoUrl, image, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten harus diisi' }, { status: 400 })
    }

    const dakwah = await db.dakwah.create({
      data: {
        title,
        content,
        category: category || 'artikel',
        author: author || null,
        videoUrl: videoUrl || null,
        image: image || null,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    // Send push notification
    await broadcastPushNotification({
      title: 'Dakwah & Kajian Baru',
      body: title.length > 80 ? title.substring(0, 80) + '...' : title,
      url: '/?page=dakwah',
      tag: `mdta-dakwah-${dakwah.id}`,
    })

    return NextResponse.json(dakwah, { status: 201 })
  } catch (error) {
    console.error('Admin dakwah create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
