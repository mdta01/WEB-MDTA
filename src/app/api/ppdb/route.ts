import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, birthPlace, birthDate, parentName, parentPhone, address, previousSchool } = body

    if (!name || !birthPlace || !birthDate || !parentName || !parentPhone) {
      return NextResponse.json(
        { error: 'Field wajib harus diisi' },
        { status: 400 }
      )
    }

    const registration = await db.pPDBRegistration.create({
      data: {
        name,
        birthPlace,
        birthDate: new Date(birthDate),
        parentName,
        parentPhone,
        address: address || null,
        previousSchool: previousSchool || null,
      },
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('PPDB registration create error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
