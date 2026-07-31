import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary from environment variables
// These must be set in .env locally and in Vercel dashboard for production
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    '[Cloudinary] Missing env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
  )
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
})

export { cloudinary }

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer - The file buffer to upload
 * @param folder - Cloudinary folder (e.g. 'mdta/news', 'mdta/teachers')
 * @param publicId - Optional public ID (without extension). If omitted, a timestamp-based ID is generated.
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string; width?: number; height?: number; bytes?: number; format?: string }> {
  const finalPublicId = publicId || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: finalPublicId,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        if (!result) {
          reject(new Error('Cloudinary returned no result'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        })
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Upload a non-image file (e.g. PDF) buffer to Cloudinary.
 * Uses resource_type: 'raw' for file uploads (not transformed).
 * @param buffer - The file buffer to upload
 * @param folder - Cloudinary folder (e.g. 'mdta/downloads')
 * @param fileName - Original file name (used for public ID, sanitized)
 */
export async function uploadFileToCloudinary(
  buffer: Buffer,
  folder: string,
  fileName: string
): Promise<{ url: string; publicId: string; bytes?: number; format?: string; originalFilename?: string }> {
  // Extract extension from original filename
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : ''

  // Sanitize file name → use as public_id (WITHOUT removing extension)
  // Keep the extension so Cloudinary preserves Content-Type
  const baseName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // sanitize but keep dots, dashes
    .substring(0, 80) || `file_${Date.now()}`
  const finalPublicId = `${baseName}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: finalPublicId,
        // 'raw' preserves the original file as-is.
        // The filename with extension is kept so browsers know the file type.
        resource_type: 'raw',
        // Attach original filename so Content-Disposition header includes it
        filename_override: fileName,
        // Explicitly set access mode to 'public' so files are accessible via
        // direct URL. Some Cloudinary accounts default to 'authenticated'
        // which blocks direct access (401 'deny or ACL failure').
        access_mode: 'public',
        // Ensure upload type is 'upload' (public), not 'authenticated' or 'private'
        type: 'upload',
      },
      (error, result) => {
        if (error) {
          const errMsg = typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error)
          reject(new Error(errMsg))
          return
        }
        if (!result) {
          reject(new Error('Cloudinary returned no result'))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          originalFilename: fileName,
        })
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Delete an asset from Cloudinary by public ID.
 * Useful when admin removes an image — cleans up storage.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  } catch (error) {
    console.error('[Cloudinary] Failed to delete asset:', error)
    // Don't throw — deletion is best-effort
  }
}

/**
 * Extract the public ID from a Cloudinary URL.
 * Example: https://res.cloudinary.com/duq8rhc3g/image/upload/v123/mdta/news/abc.jpg -> mdta/news/abc
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
