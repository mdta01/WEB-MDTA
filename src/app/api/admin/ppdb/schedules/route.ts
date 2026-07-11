import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list all PPDB schedules (admin, including inactive)
export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const schedules = await db.pPDBSchedule.findMany({
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Admin PPDB schedules fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST — create new PPDB schedule
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { title, startDate, endDate, location, description, order, isActive } = body

    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Judul dan tanggal mulai harus diisi' },
        { status: 400 }
      )
    }

    const schedule = await db.pPDBSchedule.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        description: description || null,
        order: typeof order === 'number' ? order : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Create PPDB schedule error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
