import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Content type mapping for common file extensions
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

/**
 * GET /api/download/[id] — proxy download from Cloudinary.
 *
 * Now that Cloudinary account access control is disabled (public access allowed),
 * we simply fetch the direct fileUrl from DB and stream it to client.
 * This is fast, simple, and reliable.
 *
 * Returns:
 *  - 200: file stream with Content-Disposition: attachment
 *  - 404: download record not found in DB
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

    // If it's a local file (not Cloudinary), redirect directly
    if (!fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract extension from URL or filename
    const extMatch = fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf'

    console.log(`[Download Proxy] Fetching direct URL: ${fileUrl.substring(0, 100)}...`)

    // Fetch directly from Cloudinary (public access now enabled)
    const response = await fetch(fileUrl, {
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      console.error('[Download Proxy] Direct fetch failed:', {
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        {
          error: `File tidak dapat diunduh (HTTP ${response.status})`,
          hint: 'Coba beberapa saat lagi atau hubungi admin.',
        },
        { status: 502 }
      )
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    // Generate safe filename with extension
    const safeFilename = download.title
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 60) + '.' + ext

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[Download Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengunduh file' },
      { status: 500 }
    )
  }
}
