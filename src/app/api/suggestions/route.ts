import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, type, message } = body

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Nama dan pesan harus diisi' },
        { status: 400 }
      )
    }

    const suggestion = await db.suggestion.create({
      data: {
        name,
        email: email || null,
        type: type || 'saran',
        message,
      },
    })

    return NextResponse.json(suggestion, { status: 201 })
  } catch (error) {
    console.error('Suggestion create error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
