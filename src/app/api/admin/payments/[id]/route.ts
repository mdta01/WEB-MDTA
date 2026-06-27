import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

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
    const payment = await db.paymentInfo.findUnique({ where: { id } })

    if (!payment) {
      return NextResponse.json({ error: 'Info pembayaran tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Admin payment fetch error:', error)
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

    if (body.dueDate) {
      body.dueDate = new Date(body.dueDate)
    }

    const payment = await db.paymentInfo.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Admin payment update error:', error)
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
    await db.paymentInfo.delete({ where: { id } })

    return NextResponse.json({ message: 'Info pembayaran berhasil dihapus' })
  } catch (error) {
    console.error('Admin payment delete error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
