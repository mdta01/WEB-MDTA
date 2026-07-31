import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'

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
 * Streams file server-side using signed Cloudinary URL.
 * NEVER redirects to res.cloudinary.com directly (causes 401 for raw files).
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

    // Local file — redirect directly (publicly accessible)
    if (!fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract public_id from Cloudinary URL
    const urlParts = fileUrl.split('/upload/')
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'URL Cloudinary tidak valid' },
        { status: 400 }
      )
    }

    const pathAfterUpload = urlParts[1]
    const fullPath = pathAfterUpload.replace(/^v\d+\//, '')

    const extMatch = fullPath.match(/\.([a-zA-Z0-9]+)$/)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf'
    const publicId = fullPath.replace(/\.[^.]+$/, '')

    const isRaw = fileUrl.includes('/raw/upload/')
    const resourceType = isRaw ? 'raw' : 'image'

    // Generate authenticated download URL — bypasses Cloudinary access control.
    let signedUrl: string
    try {
      if (isRaw) {
        // For raw files (PDF, DOC, etc.) — use private_download_url
        signedUrl = cloudinary.utils.private_download_url(publicId, ext, {
          resource_type: 'raw',
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        })
      } else {
        // For images — use signed url() with sign_url
        signedUrl = cloudinary.url(publicId, {
          resource_type: 'image',
          sign_url: true,
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        })
      }
    } catch (signError) {
      console.error('[Preview Proxy] Signed URL generation failed:', signError)
      return NextResponse.json(
        { error: 'Gagal generate URL preview. Coba lagi.' },
        { status: 500 }
      )
    }

    console.log(`[Preview Proxy] Fetching: ${publicId} (${resourceType})`)

    // Fetch from Cloudinary with signed URL
    const response = await fetch(signedUrl, {
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[Preview Proxy] Cloudinary fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
        publicId,
      })

      // DO NOT redirect to Cloudinary (causes 401) — return error JSON
      return NextResponse.json(
        {
          error: `File tidak dapat dimuat (HTTP ${response.status})`,
          hint: response.status === 401
            ? 'Akses Cloudinary ditolak. Hubungi admin.'
            : 'Coba beberapa saat lagi.',
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
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Gagal memuat file',
        hint: msg.includes('timeout')
          ? 'Timeout. File terlalu besar atau koneksi lambat.'
          : 'Coba beberapa saat lagi.',
      },
      { status: 500 }
    )
  }
}
