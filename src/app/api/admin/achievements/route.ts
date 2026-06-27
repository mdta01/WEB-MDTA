import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const achievements = await db.achievement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Admin achievements fetch error:', error)
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
    const { title, description, achiever, category, level, year, image } = body

    if (!title || !achiever || !year) {
      return NextResponse.json({ error: 'Judul, pencapa, dan tahun harus diisi' }, { status: 400 })
    }

    const achievement = await db.achievement.create({
      data: {
        title,
        description: description || null,
        achiever,
        category: category || 'santri',
        level: level || null,
        year,
        image: image || null,
      },
    })

    return NextResponse.json(achievement, { status: 201 })
  } catch (error) {
    console.error('Admin achievement create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
