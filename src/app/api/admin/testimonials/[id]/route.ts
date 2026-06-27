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
    const testimonial = await db.testimonial.findUnique({ where: { id } })

    if (!testimonial) {
      return NextResponse.json({ error: 'Testimoni tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(testimonial)
  } catch (error) {
    console.error('Admin testimonial fetch error:', error)
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

    const testimonial = await db.testimonial.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(testimonial)
  } catch (error) {
    console.error('Admin testimonial update error:', error)
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
    await db.testimonial.delete({ where: { id } })

    return NextResponse.json({ message: 'Testimoni berhasil dihapus' })
  } catch (error) {
    console.error('Admin testimonial delete error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
