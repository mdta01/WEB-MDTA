import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const schedules = await db.schedule.findMany({
      orderBy: [{ day: 'asc' }, { timeStart: 'asc' }],
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Admin schedules fetch error:', error)
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
    const { title, day, timeStart, timeEnd, subject, teacher, class: className } = body

    if (!title || !day || !timeStart || !timeEnd) {
      return NextResponse.json({ error: 'Judul, hari, waktu mulai, dan waktu selesai harus diisi' }, { status: 400 })
    }

    const schedule = await db.schedule.create({
      data: {
        title,
        day,
        timeStart,
        timeEnd,
        subject: subject || null,
        teacher: teacher || null,
        class: className || null,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Admin schedule create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
