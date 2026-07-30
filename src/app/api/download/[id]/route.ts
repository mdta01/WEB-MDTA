import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/download/[id] — proxy download from Cloudinary
// Fetches file server-side (bypassing Cloudinary private mode) and streams to user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get download record from database
    const download = await db.download.findUnique({ where: { id } })
    if (!download) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
    }

    const fileUrl = download.fileUrl

    // If it's a local file (not Cloudinary), redirect directly
    if (fileUrl.startsWith('/') || !fileUrl.includes('cloudinary.com')) {
      return NextResponse.redirect(fileUrl)
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/CLOUD/raw/upload/v123/folder/file.ext
    const urlParts = fileUrl.split('/upload/')
    if (urlParts.length < 2) {
      return NextResponse.redirect(fileUrl)
    }

    const pathAfterUpload = urlParts[1]
    // Remove version prefix (v123/) if present
    const publicIdWithExt = pathAfterUpload.replace(/^v\d+\//, '')
    // Remove extension for public_id
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')

    // Determine resource_type from URL
    const isRaw = fileUrl.includes('/raw/upload/')
    const resourceType = isRaw ? 'raw' : 'image'

    // Generate signed URL (valid for 1 hour)
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      publicIdWithExt.split('.').pop() || 'pdf',
      {
        resource_type: resourceType,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    )

    // Fetch the file from Cloudinary (server-side)
    const response = await fetch(signedUrl)

    if (!response.ok) {
      console.error('Cloudinary fetch failed:', response.status, response.statusText)
      // Fallback: try direct URL
      return NextResponse.redirect(fileUrl)
    }

    // Get file content
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine content type from file extension
    const ext = publicIdWithExt.split('.').pop()?.toLowerCase() || ''
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'txt': 'text/plain',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    // Generate safe filename
    const safeFilename = download.title
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 60) + '.' + ext

    // Return file with proper headers
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
    console.error('Download proxy error:', error)
    return NextResponse.json(
      { error: 'Gagal mengunduh file' },
      { status: 500 }
    )
  }
}
