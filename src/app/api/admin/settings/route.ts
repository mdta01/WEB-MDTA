import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const settings = await db.siteSetting.findMany()
    // No-cache: admin should always see fresh data (no browser/CDN cache)
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Admin settings fetch error:', error)
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
    const { settings } = body as { settings: { key: string; value: string }[] }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    const updates = settings.map((setting) =>
      db.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    )

    await Promise.all(updates)

    const updatedSettings = await db.siteSetting.findMany()
    // No-cache: ensure admin always sees the updated settings immediately
    return NextResponse.json(updatedSettings, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
