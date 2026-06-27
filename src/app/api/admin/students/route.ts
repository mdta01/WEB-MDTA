import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const students = await db.student.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(students)
  } catch (error) {
    console.error('Admin students fetch error:', error)
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
    const { name, class: className, nis, isActive } = body

    if (!name || !className) {
      return NextResponse.json({ error: 'Nama dan kelas harus diisi' }, { status: 400 })
    }

    const student = await db.student.create({
      data: {
        name,
        class: className,
        nis: nis || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Admin student create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
