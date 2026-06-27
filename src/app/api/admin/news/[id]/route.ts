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
    const news = await db.news.findUnique({ where: { id } })

    if (!news) {
      return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error('Admin news fetch error:', error)
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

    const news = await db.news.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Admin news update error:', error)
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
    await db.news.delete({ where: { id } })

    return NextResponse.json({ message: 'Berita berhasil dihapus' })
  } catch (error) {
    console.error('Admin news delete error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
