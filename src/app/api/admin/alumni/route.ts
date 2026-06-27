import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const alumni = await db.alumni.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alumni)
  } catch (error) {
    console.error('Admin alumni fetch error:', error)
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
    const { name, year, testimony, image, currentActivity } = body

    if (!name || !year) {
      return NextResponse.json({ error: 'Nama dan tahun harus diisi' }, { status: 400 })
    }

    const alumni = await db.alumni.create({
      data: {
        name,
        year,
        testimony: testimony || null,
        image: image || null,
        currentActivity: currentActivity || null,
      },
    })

    return NextResponse.json(alumni, { status: 201 })
  } catch (error) {
    console.error('Admin alumni create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
