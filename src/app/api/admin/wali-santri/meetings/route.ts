import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list all meetings (admin, including inactive)
export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const meetings = await db.waliSantriMeeting.findMany({
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Admin wali santri meetings fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST — create new meeting
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { title, date, time, location, description, isActive } = body

    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Judul, tanggal, dan waktu harus diisi' },
        { status: 400 }
      )
    }

    const meeting = await db.waliSantriMeeting.create({
      data: {
        title,
        date: new Date(date),
        time,
        location: location || null,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })
    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Create wali santri meeting error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
