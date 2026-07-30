import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { uploadToCloudinary, uploadFileToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Max file size: 25 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024

// Allowed MIME types — images + documents
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip', // .zip
  'text/plain', // .txt
]

export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized. Silakan login sebagai admin.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = (formData.get('folder') as string) || 'mdta/misc'

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File tidak ditemukan. Pastikan Anda memilih file.' },
        { status: 400 }
      )
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isFile = ALLOWED_FILE_TYPES.includes(file.type)

    // Also check by extension (some browsers report different MIME for .doc)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt']
    const isFileByExt = allowedExtensions.includes(ext) && !isImage

    if (!isImage && !isFile && !isFileByExt) {
      return NextResponse.json(
        {
          error: `Tipe file tidak didukung: ${file.type || ext}. Hanya PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, TXT, atau gambar (JPEG, PNG, GIF, WebP).`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maksimal 25 MB.`,
        },
        { status: 400 }
      )
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/^\/+|\/+$/g, '')
    const finalFolder = safeFolder || 'mdta/misc'

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use appropriate uploader
    const isActuallyImage = isImage && !isFile && !isFileByExt
    const result = isActuallyImage
      ? await uploadToCloudinary(buffer, finalFolder)
      : await uploadFileToCloudinary(buffer, finalFolder, file.name)

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: (result as { width?: number }).width,
      height: (result as { height?: number }).height,
      bytes: (result as { bytes?: number }).bytes,
      format: (result as { format?: string }).format,
      originalFilename: (result as { originalFilename?: string }).originalFilename || file.name,
      fileType: isActuallyImage ? 'image' : 'file',
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
