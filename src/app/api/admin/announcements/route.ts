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

    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Admin announcements fetch error:', error)
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
    const { title, content, type, isActive, priority } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten harus diisi' }, { status: 400 })
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: type || 'general',
        isActive: isActive !== undefined ? isActive : true,
        priority: priority || 0,
      },
    })

    // Send push notification
    await broadcastPushNotification({
      title: 'Pengumuman Baru',
      body: title.length > 80 ? title.substring(0, 80) + '...' : title,
      url: '/?page=pengumuman',
      tag: `mdta-ann-${announcement.id}`,
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Admin announcement create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
