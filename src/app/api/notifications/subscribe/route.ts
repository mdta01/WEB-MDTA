import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST — save push subscription (public, no auth needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Upsert: if endpoint already exists, update keys; otherwise create
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { keys: JSON.stringify(keys) },
      create: {
        endpoint,
        keys: JSON.stringify(keys),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan subscription' },
      { status: 500 }
    )
  }
}

// DELETE — unsubscribe (public)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      )
    }

    await db.pushSubscription.deleteMany({
      where: { endpoint },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Gagal unsubscribe' },
      { status: 500 }
    )
  }
}
