import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUT — update PPDB schedule by id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const { title, startDate, endDate, location, description, order, isActive } = body

    const existing = await db.pPDBSchedule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.pPDBSchedule.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        location: location !== undefined ? (location || null) : existing.location,
        description: description !== undefined ? (description || null) : existing.description,
        order: typeof order === 'number' ? order : existing.order,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update PPDB schedule error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE — delete PPDB schedule by id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const existing = await db.pPDBSchedule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    }
    await db.pPDBSchedule.delete({ where: { id } })
    return NextResponse.json({ message: 'Jadwal berhasil dihapus' })
  } catch (error) {
    console.error('Delete PPDB schedule error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
