import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Content type mapping for inline preview
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

/**
 * GET /api/preview/[id] — serve file inline for browser preview.
 *
 * Now that Cloudinary access control is disabled, fetch direct URL and stream inline.
 *
 * Returns:
 *  - 200: file stream with Content-Disposition: inline (browser displays if it can)
 *  - 404: download record not found
 *  - 502: Cloudinary fetch failed
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const download = await db.download.findUnique({ where: { id } })
    if (!download) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 404 }
      )
    }

    const fileUrl = download.fileUrl

    // Local file — redirect directly
    if (!fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract extension
    const extMatch = fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf'

    console.log(`[Preview Proxy] Fetching: ${fileUrl.substring(0, 100)}...`)

    // Fetch directly from Cloudinary (public access enabled)
    const response = await fetch(fileUrl, {
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      console.error('[Preview Proxy] Fetch failed:', response.status, response.statusText)
      return NextResponse.json(
        {
          error: `File tidak dapat dimuat (HTTP ${response.status})`,
          hint: 'Coba beberapa saat lagi atau hubungi admin.',
        },
        { status: 502 }
      )
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    const safeFilename = download.title
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 60) + '.' + ext

    // Return inline (browser will display if it can — PDF viewer, image, etc.)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[Preview Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat file' },
      { status: 500 }
    )
  }
}
