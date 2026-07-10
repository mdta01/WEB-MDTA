import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const programs = await db.program.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(programs)
  } catch (error) {
    console.error('Admin programs fetch error:', error)
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
    const { title, description, category, icon, order, isActive } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Judul dan deskripsi harus diisi' }, { status: 400 })
    }

    const program = await db.program.create({
      data: {
        title,
        description,
        category: category || 'unggulan',
        icon: icon || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Admin program create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
