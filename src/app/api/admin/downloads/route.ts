import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const downloads = await db.download.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(downloads)
  } catch (error) {
    console.error('Admin downloads fetch error:', error)
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
    const { title, fileUrl, category } = body

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'Judul dan file harus diisi' }, { status: 400 })
    }

    const download = await db.download.create({
      data: {
        title,
        fileUrl,
        category: category || 'formulir',
      },
    })

    return NextResponse.json(download, { status: 201 })
  } catch (error) {
    console.error('Admin download create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
