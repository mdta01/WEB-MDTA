import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { uploadToCloudinary, uploadFileToCloudinary } from '@/lib/cloudinary'

// Force Node.js runtime (not Edge) for Cloudinary SDK + FormData streaming
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 10 MB image limit, 25 MB raw file limit (matched client-side in ImageUpload/FileUpload)
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_FILE_BYTES = 25 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

const ALLOWED_FILE_EXTS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt',
]

/**
 * POST /api/upload
 *
 * Admin-only multipart/form-data upload to Cloudinary.
 *
 * Form fields:
 *  - file:   the file to upload (required)
 *  - folder: Cloudinary folder, e.g. "mdta/news" (optional, default "mdta/misc")
 *
 * Detects whether the file is an image (resource_type=image, transforms allowed)
 * or a raw document (resource_type=raw, preserved as-is).
 *
 * Returns:
 *  - 200: { url, publicId, width?, height?, format, bytes, resourceType }
 *  - 401: not authenticated
 *  - 400: missing file / invalid type / too large
 *  - 500: Cloudinary upload error
 *  - 504: upload timeout
 */
export async function POST(request: NextRequest) {
  // 1. Auth guard — only logged-in admins can upload
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json(
      { error: 'Unauthorized. Silakan login sebagai admin.' },
      { status: 401 }
    )
  }

  // 2. Check Cloudinary config early — fail fast if env vars missing
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[Upload API] Cloudinary env vars missing')
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi untuk upload. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di .env' },
      { status: 500 }
    )
  }

  // 3. Parse multipart form with timeout protection (30s)
  let formData: FormData
  try {
    formData = await Promise.race([
      request.formData(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout parsing form data (30s)')), 30000)
      ),
    ])
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal parse form data'
    console.error('[Upload API] FormData parse error:', msg)
    return NextResponse.json(
      { error: 'Gagal membaca data upload. Coba file yang lebih kecil atau periksa koneksi.' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  const folder = (formData.get('folder') as string) || 'mdta/misc'

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Field "file" wajib diisi dengan file' },
      { status: 400 }
    )
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: 'File kosong (0 bytes)' },
      { status: 400 }
    )
  }

  // 4. Determine upload type (image vs raw file) and validate
  const isImage = file.type.startsWith('image/')
  const ext = (file.name.split('.').pop() || '').toLowerCase()

  if (isImage) {
    // Validate image type allow-list
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe gambar tidak didukung: ${file.type}. Gunakan JPEG, PNG, WebP, GIF, SVG, atau AVIF.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran gambar ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas 10 MB` },
        { status: 400 }
      )
    }
  } else {
    // Validate raw file extension allow-list
    if (!ALLOWED_FILE_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: `Ekstensi file tidak didukung: .${ext}. Gunakan PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, atau TXT.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)} MB melelebihi batas 25 MB` },
        { status: 400 }
      )
    }
  }

  // 5. Read file into buffer (with size guard)
  let buffer: Buffer
  try {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal membaca file'
    console.error('[Upload API] Buffer read error:', msg)
    return NextResponse.json(
      { error: 'Gagal membaca file. Coba upload ulang.' },
      { status: 500 }
    )
  }

  // 6. Upload to Cloudinary with retry (max 2 attempts)
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isImage) {
        const result = await uploadToCloudinary(buffer, folder)
        return NextResponse.json({
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resourceType: 'image',
        })
      } else {
        const result = await uploadFileToCloudinary(buffer, folder, file.name)
        return NextResponse.json({
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          bytes: result.bytes,
          originalFilename: result.originalFilename,
          resourceType: 'raw',
        })
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[Upload API] Cloudinary attempt ${attempt}/${maxRetries} failed:`, lastError.message)

      // Don't retry on validation errors (4xx-like) — only retry on network/server errors
      const errMsg = lastError.message.toLowerCase()
      if (errMsg.includes('invalid') || errMsg.includes('unauthorized') || errMsg.includes('forbidden')) {
        break
      }

      // Wait before retry (exponential backoff: 1s, 2s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  // All retries exhausted
  const errMsg = lastError?.message || 'Upload gagal'
  console.error('[Upload API] All retry attempts exhausted:', errMsg)

  // User-friendly error messages based on common Cloudinary errors
  let userFriendlyError = 'Gagal upload ke Cloudinary'
  if (errMsg.includes('timeout')) {
    userFriendlyError = 'Upload timeout. Coba file yang lebih kecil atau periksa koneksi internet.'
  } else if (errMsg.includes('unauthorized') || errMsg.includes('api_key') || errMsg.includes('api_secret')) {
    userFriendlyError = 'Konfigurasi Cloudinary tidak valid. Hubungi admin.'
  } else if (errMsg.includes('network') || errMsg.includes('econnreset') || errMsg.includes('enotfound')) {
    userFriendlyError = 'Gangguan koneksi ke server upload. Coba beberapa saat lagi.'
  }

  return NextResponse.json(
    { error: userFriendlyError, debug: process.env.NODE_ENV === 'development' ? errMsg : undefined },
    { status: 500 }
  )
}

/**
 * GET /api/upload — health check endpoint.
 * Returns upload config status (useful for debugging).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/upload',
    methods: ['POST'],
    cloudinaryConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    maxImageSize: '10MB',
    maxFileSize: '25MB',
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    allowedFileExts: ALLOWED_FILE_EXTS,
  })
}
