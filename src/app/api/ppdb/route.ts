import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/ppdb
 *
 * Public endpoint for submitting PPDB (student registration) form.
 * No auth required — anyone can submit.
 *
 * Handles both:
 * 1. New schema (with kkUrl, aktaUrl, fotoUrl for file uploads)
 * 2. Legacy schema (without those columns — falls back gracefully)
 *
 * If the new columns don't exist in the DB yet, the file URLs are
 * silently dropped (registration still succeeds, just without berkas URLs).
 * Admin can run /api/admin/migrate-ppdb to add the columns.
 */

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

    // Build base data object (fields that definitely exist in DB)
    const baseData = {
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
    }

    // Try to create with new fields (kkUrl, aktaUrl, fotoUrl)
    // If the DB doesn't have these columns yet, catch the error and retry
    // without them (graceful degradation).
    let registration
    try {
      registration = await db.pPDBRegistration.create({
        data: {
          ...baseData,
          // Berkas persyaratan (URL Cloudinary) — new fields
          kkUrl: typeof body.kkUrl === 'string' && body.kkUrl ? body.kkUrl : null,
          aktaUrl: typeof body.aktaUrl === 'string' && body.aktaUrl ? body.aktaUrl : null,
          fotoUrl: typeof body.fotoUrl === 'string' && body.fotoUrl ? body.fotoUrl : null,
        },
      })
    } catch (innerError) {
      // If error is about missing column, retry without the new fields
      const errMsg = innerError instanceof Error ? innerError.message : String(innerError)
      if (errMsg.includes('kkUrl') || errMsg.includes('aktaUrl') || errMsg.includes('fotoUrl') || errMsg.includes('column') || errMsg.includes('does not exist')) {
        // Columns don't exist yet — create without berkas URLs
        console.warn('PPDB: kkUrl/aktaUrl/fotoUrl columns missing in DB. Creating without berkas URLs. Admin should run /api/admin/migrate-ppdb to add columns.')
        registration = await db.pPDBRegistration.create({
          data: baseData,
        })
      } else {
        // Different error — rethrow
        throw innerError
      }
    }

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('PPDB registration create error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
