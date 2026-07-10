import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUT — update meeting by id
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
    const { title, date, time, location, description, isActive } = body

    const existing = await db.waliSantriMeeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Meeting tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.waliSantriMeeting.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        date: date ? new Date(date) : existing.date,
        time: time ?? existing.time,
        location: location !== undefined ? (location || null) : existing.location,
        description: description !== undefined ? (description || null) : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update wali santri meeting error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE — delete meeting by id
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
    const existing = await db.waliSantriMeeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Meeting tidak ditemukan' }, { status: 404 })
    }
    await db.waliSantriMeeting.delete({ where: { id } })
    return NextResponse.json({ message: 'Meeting berhasil dihapus' })
  } catch (error) {
    console.error('Delete wali santri meeting error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
