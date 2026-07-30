import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/preview/[id] — serve file inline for browser preview
// Same as download but with Content-Disposition: inline (not attachment)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const download = await db.download.findUnique({ where: { id } })
    if (!download) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    const fileUrl = download.fileUrl

    // If it's a local file, redirect
    if (fileUrl.startsWith('/') || !fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract public_id from Cloudinary URL
    const urlParts = fileUrl.split('/upload/')
    if (urlParts.length < 2) {
      return NextResponse.redirect(fileUrl)
    }

    const pathAfterUpload = urlParts[1]
    const publicIdWithExt = pathAfterUpload.replace(/^v\d+\//, '')
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')
    const ext = publicIdWithExt.split('.').pop()?.toLowerCase() || 'pdf'

    const isRaw = fileUrl.includes('/raw/upload/')
    const resourceType = isRaw ? 'raw' : 'image'

    // Generate signed URL
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      ext,
      {
        resource_type: resourceType,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    )

    // Fetch from Cloudinary
    const response = await fetch(signedUrl)

    if (!response.ok) {
      console.error('Preview fetch failed:', response.status)
      return NextResponse.redirect(fileUrl)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    const safeFilename = download.title
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 60) + '.' + ext

    // Return inline (browser will display if it can)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Preview proxy error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat file' },
      { status: 500 }
    )
  }
}
