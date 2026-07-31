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

    const publicIdWithExt = fullPath
    const publicIdWithoutExt = publicId

    // Try multiple fetch strategies — same as download route.
    let response: Response | null = null
    let lastError: string = ''

    const fetchStrategies: Array<() => Promise<{ url: string; auth?: string }>> = []

    if (isRaw) {
      fetchStrategies.push(async () => ({
        url: cloudinary.utils.private_download_url(publicIdWithExt, ext, {
          resource_type: 'raw',
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      }))
      fetchStrategies.push(async () => ({
        url: cloudinary.utils.private_download_url(publicIdWithoutExt, ext, {
          resource_type: 'raw',
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      }))
    } else {
      fetchStrategies.push(async () => ({
        url: cloudinary.url(publicIdWithoutExt, {
          resource_type: 'image',
          sign_url: true,
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        }),
      }))
    }

    // Strategy 3: direct URL with Basic Auth
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (apiKey && apiSecret) {
      fetchStrategies.push(async () => ({
        url: fileUrl,
        auth: 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64'),
      }))
    }

    for (let i = 0; i < fetchStrategies.length; i++) {
      const strategy = fetchStrategies[i]
      try {
        const { url, auth } = await strategy()
        console.log(`[Preview Proxy] Strategy ${i + 1}: ${url.substring(0, 100)}...`)

        const headers: Record<string, string> = {}
        if (auth) headers.Authorization = auth

        response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(60000),
        })

        if (response.ok) {
          console.log(`[Preview Proxy] Strategy ${i + 1} succeeded`)
          break
        }

        lastError = `HTTP ${response.status} ${response.statusText}`
        console.error(`[Preview Proxy] Strategy ${i + 1} failed: ${lastError}`)
        response = null
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        console.error(`[Preview Proxy] Strategy ${i + 1} error:`, lastError)
      }
    }

    if (!response || !response.ok) {
      console.error('[Preview Proxy] All strategies failed. Last error:', lastError)
      return NextResponse.json(
        {
          error: 'File tidak dapat dimuat',
          hint: 'File mungkin tidak tersedia atau akses ditolak. Hubungi admin.',
          debug: process.env.NODE_ENV === 'development' ? lastError : undefined,
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
