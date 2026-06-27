import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const institutionData = await db.institutionData.findMany()
    return NextResponse.json(institutionData)
  } catch (error) {
    console.error('Admin institution fetch error:', error)
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
    const { data } = body as { data: { key: string; value: string; label: string }[] }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    const updates = data.map((item) =>
      db.institutionData.upsert({
        where: { key: item.key },
        update: { value: item.value, label: item.label },
        create: { key: item.key, value: item.value, label: item.label },
      })
    )

    await Promise.all(updates)

    const updatedData = await db.institutionData.findMany()
    return NextResponse.json(updatedData)
  } catch (error) {
    console.error('Admin institution update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
