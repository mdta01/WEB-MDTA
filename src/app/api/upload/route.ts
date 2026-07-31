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

  // 2. Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Request harus berupa multipart/form-data' },
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
      { error: 'File kosong' },
      { status: 400 }
    )
  }

  // 3. Determine upload type (image vs raw file) and validate
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
        { error: 'Ukuran gambar melebihi 10 MB' },
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
        { error: 'Ukuran file melebihi 25 MB' },
        { status: 400 }
      )
    }
  }

  // 4. Read file into buffer
  let buffer: Buffer
  try {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json(
      { error: 'Gagal membaca file' },
      { status: 500 }
    )
  }

  // 5. Upload to Cloudinary
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
    const msg = error instanceof Error ? error.message : 'Upload gagal'
    console.error('[Upload API] Cloudinary error:', msg)
    return NextResponse.json(
      { error: 'Gagal upload ke Cloudinary. Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET sudah dikonfigurasi di .env', debug: msg },
      { status: 500 }
    )
  }
}
