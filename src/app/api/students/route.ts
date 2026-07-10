import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const count = await db.student.count({
      where: { isActive: true },
    })
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Student count error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
