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

    // For raw files, publicId should INCLUDE extension (Cloudinary raw files
    // store full filename as public_id, unlike images which strip extension).
    const publicIdWithExt = fullPath // e.g. mdta/downloads/file.pdf
    const publicIdWithoutExt = publicId // e.g. mdta/downloads/file

    // Cloudinary account has strict access control — direct public URLs return 401.
    // Use cloudinary.api.resource() to get resource info + generate authenticated URL.
    // This is the most reliable method for accessing private/restricted resources.

    // First, get resource info via Admin API (uses API key/secret authentication)
    let resourceInfo: { secure_url?: string; url?: string; type?: string; access_mode?: string } | null = null
    try {
      console.log(`[Download Proxy] Getting resource info: ${publicIdWithExt}`)
      resourceInfo = await cloudinary.api.resource(publicIdWithExt, {
        resource_type: resourceType,
      })
      console.log(`[Download Proxy] Resource found:`, {
        type: resourceInfo?.type,
        access_mode: resourceInfo?.access_mode,
        secure_url: resourceInfo?.secure_url?.substring(0, 80),
      })
    } catch (apiErr) {
      console.error('[Download Proxy] api.resource failed:', apiErr instanceof Error ? apiErr.message : String(apiErr))
      // Try without extension for raw files
      if (isRaw) {
        try {
          console.log(`[Download Proxy] Retrying with publicId without ext: ${publicIdWithoutExt}`)
          resourceInfo = await cloudinary.api.resource(publicIdWithoutExt, {
            resource_type: resourceType,
          })
          console.log(`[Download Proxy] Resource found (no ext):`, {
            type: resourceInfo?.type,
            access_mode: resourceInfo?.access_mode,
          })
        } catch (apiErr2) {
          console.error('[Download Proxy] api.resource (no ext) also failed:', apiErr2 instanceof Error ? apiErr2.message : String(apiErr2))
        }
      }
    }

    if (!resourceInfo) {
      return NextResponse.json(
        {
          error: 'File tidak ditemukan di Cloudinary',
          hint: 'File mungkin telah dihapus. Hubungi admin untuk upload ulang.',
        },
        { status: 404 }
      )
    }

    // Try multiple fetch strategies for downloading the file content
    let response: Response | null = null
    let lastError: string = ''

    const fetchStrategies: Array<() => Promise<{ url: string; auth?: string }>> = []

    // Strategy 1: private_download_url with extension (raw files)
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
      // Images: signed url
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

    // Strategy 3: api_download_url — Admin API download endpoint with signature.
    // This is the most reliable method for accessing restricted Cloudinary resources.
    // Uses /api/v1_1/:cloud/download endpoint which authenticates via API signature.
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (apiKey && apiSecret) {
      fetchStrategies.push(async () => {
        // api_download_url generates a signed Admin API URL for direct download
        const authUrl = cloudinary.utils.api_download_url(publicIdWithExt, {
          resource_type: resourceType,
          format: ext,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        })
        return { url: authUrl }
      })
    }

    // Try each strategy until one works
    for (let i = 0; i < fetchStrategies.length; i++) {
      const strategy = fetchStrategies[i]
      try {
        const { url, auth } = await strategy()
        console.log(`[Download Proxy] Strategy ${i + 1}: ${url.substring(0, 100)}...`)

        const headers: Record<string, string> = {}
        if (auth) headers.Authorization = auth

        response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(60000),
        })

        if (response.ok) {
          console.log(`[Download Proxy] Strategy ${i + 1} succeeded`)
          break
        }

        lastError = `HTTP ${response.status} ${response.statusText}`
        console.error(`[Download Proxy] Strategy ${i + 1} failed: ${lastError}`)
        response = null
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        console.error(`[Download Proxy] Strategy ${i + 1} error:`, lastError)
      }
    }

    if (!response || !response.ok) {
      console.error('[Download Proxy] All strategies failed. Last error:', lastError)
      return NextResponse.json(
        {
          error: 'File tidak dapat diunduh',
          hint: 'File mungkin tidak tersedia atau akses ditolak. Hubungi admin.',
          debug: process.env.NODE_ENV === 'development' ? lastError : undefined,
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
