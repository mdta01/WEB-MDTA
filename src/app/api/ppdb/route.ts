import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Required fields: name, birthPlace, birthDate
    if (!body.name || !body.birthPlace || !body.birthDate) {
      return NextResponse.json(
        { error: 'Nama, tempat lahir, dan tanggal lahir harus diisi' },
        { status: 400 }
      )
    }

    // Helper: convert date string to Date or null
    const parseDate = (val: string | undefined | null): Date | null => {
      if (!val) return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }

    const registration = await db.pPDBRegistration.create({
      data: {
        // A. Data Calon Santri
        name: body.name,
        nik: body.nik || null,
        nokk: body.nokk || null,
        birthPlace: body.birthPlace,
        birthDate: new Date(body.birthDate),
        gender: body.gender || null,
        // B. Asal Sekolah
        previousSchool: body.previousSchool || null,
        schoolClass: body.schoolClass || null,
        schoolAddress: body.schoolAddress || null,
        // C. Data Ayah
        fatherName: body.fatherName || null,
        fatherStatus: body.fatherStatus || null,
        fatherNik: body.fatherNik || null,
        fatherBirthPlace: body.fatherBirthPlace || null,
        fatherBirthDate: parseDate(body.fatherBirthDate),
        fatherEducation: body.fatherEducation || null,
        fatherJob: body.fatherJob || null,
        fatherAddress: body.fatherAddress || null,
        fatherPhone: body.fatherPhone || null,
        // C. Data Ibu
        motherName: body.motherName || null,
        motherStatus: body.motherStatus || null,
        motherNik: body.motherNik || null,
        motherBirthPlace: body.motherBirthPlace || null,
        motherBirthDate: parseDate(body.motherBirthDate),
        motherEducation: body.motherEducation || null,
        motherJob: body.motherJob || null,
        motherAddress: body.motherAddress || null,
        motherPhone: body.motherPhone || null,
        // Legacy (backward compat — map father phone/name to parent fields)
        parentName: body.fatherName || body.motherName || null,
        parentPhone: body.fatherPhone || body.motherPhone || null,
        address: body.fatherAddress || body.motherAddress || null,
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
