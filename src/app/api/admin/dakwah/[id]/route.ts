import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { notifyDakwahUpdate } from '@/lib/notification-broadcast'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { id } = await params
    const dakwah = await db.dakwah.findUnique({ where: { id } })

    if (!dakwah) {
      return NextResponse.json({ error: 'Dakwah tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(dakwah)
  } catch (error) {
    console.error('Admin dakwah fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const dakwah = await db.dakwah.update({
      where: { id },
      data: body,
    })

    // Send push notification via FCM + VAPID (only if published)
    // Fire-and-forget — don't break the update if push fails
    notifyDakwahUpdate(dakwah, 'updated').catch((err) =>
      console.error('[admin/dakwah PUT] notify failed:', err)
    )

    return NextResponse.json(dakwah)
  } catch (error) {
    console.error('Admin dakwah update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { id } = await params
    await db.dakwah.delete({ where: { id } })

    return NextResponse.json({ message: 'Dakwah berhasil dihapus' })
  } catch (error) {
    console.error('Admin dakwah delete error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
