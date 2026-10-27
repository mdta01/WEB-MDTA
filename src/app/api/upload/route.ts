import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { uploadToCloudinary, uploadFileToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Vercel default body size limit is 4.5MB on hobby plan. We set maxDuration
// to give Cloudinary upload enough time on slow connections.
export const maxDuration = 30

// Allowed MIME types — strict whitelist to prevent abuse
const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/tiff',
] as const

const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
  'application/octet-stream', // generic — used for unknown binary types like some PDFs
] as const

// Extensions matching the document MIME types above (for fallback when MIME is generic)
const ALLOWED_DOCUMENT_EXTS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt', 'csv',
] as const

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024 // 25 MB

interface UploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
  bytes?: number
  format?: string
  originalName?: string
  originalSize: number
  resourceType: 'image' | 'document'
}

/**
 * POST /api/upload
 *
 * Upload a file to Cloudinary. Handles both images and documents (PDF, DOCX, etc).
 * Returns JSON with secure URL + metadata.
 *
 * Form data fields:
 * — file: File (required) — image or document file
 * — folder: string (optional) — Cloudinary folder, e.g. 'mdta/news'. Default: 'mdta/misc'
 * — publicId: string (optional) — custom public ID (without extension)
 *
 * Auth: requires admin session cookie (admin-only endpoint).
 *
 * Response (200):
 * { url, publicId, width?, height?, bytes, format, originalName, originalSize, resourceType }
 *
 * Error response (4xx/5xx):
 * { error: string, code?: string, detail?: string }
 */
export async function POST(request: NextRequest) {
  // Auth check — only admin can upload files
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json(
      { error: 'Unauthorized. Silakan login sebagai admin.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = (formData.get('folder') as string) || 'mdta/misc'
    const publicId = (formData.get('publicId') as string) || undefined

    // Validate file exists & is a File object (not a string)
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File tidak ditemukan. Pastikan Anda memilih file.', code: 'NO_FILE' },
        { status: 400 }
      )
    }

    // Determine file type (image vs document)
    const isImage = ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])
    const isDocumentMime = ALLOWED_DOCUMENT_MIME.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME)[number])

    // Fallback: check by extension when MIME is generic (application/octet-stream)
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const isDocumentExt = ALLOWED_DOCUMENT_EXTS.includes(fileExt as (typeof ALLOWED_DOCUMENT_EXTS)[number])

    if (!isImage && !isDocumentMime && !isDocumentExt) {
      return NextResponse.json(
        {
          error: `Tipe file tidak didukung: ${file.type || 'tidak diketahui'} (.${fileExt}). Hanya gambar (JPEG, PNG, GIF, WebP, SVG, AVIF) atau dokumen (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, TXT) yang diizinkan.`,
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      )
    }

    // Determine final resource type (image wins if both match — image is more specific)
    const isDocFile = !isImage && (isDocumentMime || isDocumentExt)
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maksimal ${maxSize / 1024 / 1024} MB untuk ${isImage ? 'gambar' : 'dokumen'}.`,
          code: 'FILE_TOO_LARGE',
        },
        { status: 413 }
      )
    }

    // Validate empty file
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File kosong. Pilih file yang valid.', code: 'EMPTY_FILE' },
        { status: 400 }
      )
    }

    // Sanitize folder — prevent path traversal (no .. or /)
    const safeFolder = folder
      .replace(/\.\./g, '')
      .replace(/^\/+|\/+$/g, '')
      .substring(0, 100) || 'mdta/misc'

    // Sanitize publicId if provided
    const safePublicId = publicId
      ? publicId
          .replace(/\.\./g, '')
          .replace(/[^\w\-/]/g, '_')
          .substring(0, 100)
      : undefined

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary via appropriate function
    let result: UploadResult
    if (isImage) {
      const imgResult = await uploadToCloudinary(buffer, safeFolder, safePublicId)
      result = {
        url: imgResult.url,
        publicId: imgResult.publicId,
        width: imgResult.width,
        height: imgResult.height,
        bytes: imgResult.bytes,
        format: imgResult.format,
        originalName: file.name,
        originalSize: file.size,
        resourceType: 'image',
      }
    } else {
      // Document file (PDF, DOCX, etc.)
      // Use original filename as public_id (sanitized inside uploadFileToCloudinary)
      const docResult = await uploadFileToCloudinary(buffer, safeFolder, file.name)
      result = {
        url: docResult.url,
        publicId: docResult.publicId,
        bytes: docResult.bytes,
        format: docResult.format,
        originalName: docResult.originalFilename || file.name,
        originalSize: file.size,
        resourceType: 'document',
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[upload] Error:', error)

    // Parse Cloudinary error messages for better UX
    const errMsg = error instanceof Error ? error.message : String(error)

    let userMsg = 'Gagal mengupload file. Silakan coba lagi.'
    let code = 'UPLOAD_FAILED'
    let status = 500

    if (errMsg.includes('Must supply cloud_name')) {
      userMsg = 'Cloudinary belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di environment variables.'
      code = 'CLOUDINARY_NOT_CONFIGURED'
      status = 500
    } else if (errMsg.includes('Invalid API key') || errMsg.includes('Unauthorized')) {
      userMsg = 'Kredensial Cloudinary tidak valid. Cek CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET.'
      code = 'CLOUDINARY_AUTH_FAILED'
      status = 401
    } else if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT')) {
      userMsg = 'Upload timeout. Coba file lebih kecil atau periksa koneksi internet.'
      code = 'TIMEOUT'
      status = 504
    } else if (errMsg.includes('File size too large') || errMsg.includes('maximum allowed')) {
      userMsg = 'File terlalu besar untuk Cloudinary. Maksimal 10 MB (gambar) atau 25 MB (dokumen).'
      code = 'FILE_TOO_LARGE'
      status = 413
    }

    return NextResponse.json(
      { error: userMsg, code, detail: errMsg },
      { status }
    )
  }
}
