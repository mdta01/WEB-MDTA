import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    // Determine if local or Cloudinary URL
    const isCloudinary = fileUrl.includes('cloudinary.com')
    const isLocalPath = fileUrl.startsWith('/') || fileUrl.startsWith('./')

    // Extract extension
    const extMatch = fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf'

    // For local files — check if they exist by trying to fetch from same origin.
    // If file doesn't exist, return clear error (not 500).
    if (!isCloudinary && isLocalPath) {
      // Try to fetch local file from same origin
      const origin = _request.nextUrl.origin
      const localUrl = `${origin}${fileUrl}`

      const localResponse = await fetch(localUrl, {
        signal: AbortSignal.timeout(15000),
      })

      if (!localResponse.ok) {
        // Local file doesn't exist — return clear error
        return NextResponse.json(
          {
            error: 'File belum tersedia',
            hint: 'File ini belum diupload. Hubungi admin untuk upload file.',
            fileUrl: fileUrl,
          },
          { status: 404 }
        )
      }

      const buffer = Buffer.from(await localResponse.arrayBuffer())
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
      const safeFilename = download.title.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60) + '.' + ext

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // For Cloudinary URLs — fetch directly (public access enabled)
    if (isCloudinary) {
      const response = await fetch(fileUrl, {
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: `File tidak dapat diunduh (HTTP ${response.status})` },
          { status: 502 }
        )
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
      const safeFilename = download.title.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60) + '.' + ext

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
    }

    // Unknown URL format — try redirect
    return NextResponse.redirect(fileUrl)
  } catch (error) {
    console.error('[Download Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengunduh file' },
      { status: 500 }
    )
  }
}
