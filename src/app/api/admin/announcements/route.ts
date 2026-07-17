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

    // Send push notification — prefix depends on type
    const isWaliSantri = (type || 'general') === 'wali_santri'
    await broadcastPushNotification({
      title: isWaliSantri
        ? '👨‍👩 [PENGUMUMAN WALI SANTRI] ' + (title.length > 40 ? title.substring(0, 40) + '...' : title)
        : '📢 [PENGUMUMAN] ' + (title.length > 60 ? title.substring(0, 60) + '...' : title),
      body: title,
      url: isWaliSantri ? '/?page=wali-santri' : '/?page=pengumuman',
      tag: `mdta-ann-${announcement.id}`,
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Admin announcement create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
