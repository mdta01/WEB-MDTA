import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const teachers = await db.teacher.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Admin teachers fetch error:', error)
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
    const { name, position, subject, image, phone, order, isActive } = body

    if (!name || !position) {
      return NextResponse.json({ error: 'Nama dan jabatan harus diisi' }, { status: 400 })
    }

    const teacher = await db.teacher.create({
      data: {
        name,
        position,
        subject: subject || null,
        image: image || null,
        phone: phone || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('Admin teacher create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
