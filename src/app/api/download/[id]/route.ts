import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'

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
 * Streams the file server-side using authenticated Cloudinary API,
 * bypassing Cloudinary's "deny or ACL failure" on direct public URLs.
 *
 * NEVER redirects to res.cloudinary.com directly (that causes 401 for raw files
 * when account has strict access control).
 *
 * Returns:
 *  - 200: file stream with Content-Disposition: attachment
 *  - 404: download record not found in DB
 *  - 500: Cloudinary fetch failed (with helpful error message)
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

    // If it's a local file (not Cloudinary), redirect directly — local files
    // in /public are publicly accessible.
    if (!fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/raw/upload/v<ver>/<folder>/<file>.<ext>
    const urlParts = fileUrl.split('/upload/')
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'URL Cloudinary tidak valid' },
        { status: 400 }
      )
    }

    const pathAfterUpload = urlParts[1]
    // Remove version prefix (v1234567890/) if present
    const fullPath = pathAfterUpload.replace(/^v\d+\//, '')

    // Extract extension (default to pdf if missing — old uploads)
    const extMatch = fullPath.match(/\.([a-zA-Z0-9]+)$/)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf'
    // public_id is full path WITHOUT extension
    const publicId = fullPath.replace(/\.[^.]+$/, '')

    const isRaw = fileUrl.includes('/raw/upload/')
    const resourceType = isRaw ? 'raw' : 'image'

    // Generate signed delivery URL — this bypasses Cloudinary access control
    // by signing the URL with our API secret. Signed URLs work even when
    // direct public access is denied (strict mode / ACL).
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      secure: true,
      // For raw files, no transformations — deliver as-is
      ...(isRaw ? {} : { fetch_format: 'auto', quality: 'auto' }),
    })

    console.log(`[Download Proxy] Fetching: ${publicId} (${resourceType})`)

    // Fetch the file from Cloudinary (server-side, with signed URL)
    const response = await fetch(signedUrl, {
      // 60s timeout for large files
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[Download Proxy] Cloudinary fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
        publicId,
        signedUrl: signedUrl.substring(0, 100) + '...',
      })

      // Return user-friendly error — DO NOT redirect to Cloudinary (causes 401)
      return NextResponse.json(
        {
          error: `File tidak dapat diunduh (HTTP ${response.status})`,
          hint: response.status === 401
            ? 'Akses Cloudinary ditolak. Hubungi admin.'
            : 'Coba beberapa saat lagi.',
        },
        { status: 502 }
      )
    }

    // Stream file to client (don't buffer entire file in memory for large files)
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
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Gagal mengunduh file',
        hint: msg.includes('timeout')
          ? 'Upload timeout. File terlalu besar atau koneksi lambat.'
          : 'Coba beberapa saat lagi.',
      },
      { status: 500 }
    )
  }
}
