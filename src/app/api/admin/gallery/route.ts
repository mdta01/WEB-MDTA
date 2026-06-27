import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const gallery = await db.gallery.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Admin gallery fetch error:', error)
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
    const { title, image, category, year, type } = body

    if (!title || !image) {
      return NextResponse.json({ error: 'Judul dan gambar harus diisi' }, { status: 400 })
    }

    const gallery = await db.gallery.create({
      data: {
        title,
        image,
        category: category || 'kegiatan',
        year: year || null,
        type: type || 'foto',
      },
    })

    return NextResponse.json(gallery, { status: 201 })
  } catch (error) {
    console.error('Admin gallery create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
