import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const statistics = await db.statistic.findMany()
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Admin statistics fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { statistics } = body as { statistics: { key: string; value: string }[] }

    if (!statistics || !Array.isArray(statistics)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    const updates = statistics.map((stat) =>
      db.statistic.upsert({
        where: { key: stat.key },
        update: { value: stat.value },
        create: { key: stat.key, value: stat.value },
      })
    )

    await Promise.all(updates)

    const updatedStatistics = await db.statistic.findMany()
    return NextResponse.json(updatedStatistics)
  } catch (error) {
    console.error('Admin statistics update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
