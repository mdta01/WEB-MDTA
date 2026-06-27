import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check - only logged-in admins can upload
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized. Silakan login sebagai admin.' },
        { status: 401 }
      )
    }

    // 2. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = (formData.get('folder') as string) || 'mdta/misc'

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File tidak ditemukan. Pastikan Anda memilih file.' },
        { status: 400 }
      )
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipe file tidak didukung: ${file.type}. Hanya JPEG, PNG, GIF, WebP, SVG, AVIF.`,
        },
        { status: 400 }
      )
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maksimal 10 MB.`,
        },
        { status: 400 }
      )
    }

    // 5. Sanitize folder name (prevent path traversal)
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/^\/+|\/+$/g, '')
    const finalFolder = safeFolder || 'mdta/misc'

    // 6. Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 7. Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, finalFolder)

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Gagal mengupload file ke Cloudinary.',
        debug: process.env.NODE_ENV === 'development' ? errMsg : undefined,
      },
      { status: 500 }
    )
  }
}
