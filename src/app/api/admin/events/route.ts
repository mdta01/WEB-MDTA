import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const events = await db.event.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(events)
  } catch (error) {
    console.error('Admin events fetch error:', error)
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
    const { title, description, date, location, image, category } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Judul dan tanggal harus diisi' }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        image: image || null,
        category: category || 'kegiatan',
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Admin event create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
