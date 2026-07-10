import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const institutionData = await db.institutionData.findMany()
    return NextResponse.json(institutionData)
  } catch (error) {
    console.error('Institution data fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
