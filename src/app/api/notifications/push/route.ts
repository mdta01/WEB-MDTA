import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { broadcastPushNotification } from '@/lib/webpush'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST — admin sends push notification to all subscribers
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: message, url, tag } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title dan body harus diisi' },
        { status: 400 }
      )
    }

    const sentCount = await broadcastPushNotification({
      title,
      body: message,
      url: url || '/',
      tag: tag || 'mdta-push',
      icon: '/images/logo-madin-warna.png',
    })

    return NextResponse.json({
      success: true,
      sentCount,
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim push notification' },
      { status: 500 }
    )
  }
}
