/**
 * Cloudinary direct upload utility — bypasses Vercel 4.5MB body size limit.
 *
 * Flow:
 * 1. Request signed upload params from /api/cloudinary/signature
 * 2. POST file directly to Cloudinary API with signature
 * 3. Return Cloudinary URL + metadata
 *
 * Benefits over server-side upload:
 * — No 4.5MB body size limit (Vercel Hobby plan)
 * — Faster uploads (no Vercel function in the middle)
 * — Less Vercel bandwidth usage
 * — Support for very large files (videos, high-res images, big PDFs)
 *
 * Auth: requires admin session cookie (the /api/cloudinary/signature
 * endpoint validates admin auth).
 */

export interface CloudinaryUploadResult {
  url: string
  secure_url: string
  publicId: string
  width?: number
  height?: number
  bytes: number
  format: string
  resourceType: string
  duration?: number // seconds (for video)
  originalName: string
}

interface SignatureResponse {
  api_key: string
  timestamp: number
  signature: string
  folder: string
  public_id?: string
  cloud_name: string
  resource_type: string
  upload_url: string
}

/**
 * Upload a file directly to Cloudinary from the browser.
 *
 * @param file — File object from <input type="file">
 * @param folder — Cloudinary folder (e.g. 'mdta/news', 'mdta/videos')
 * @param resourceType — 'image' | 'video' | 'raw' | 'auto'
 * @param onProgress — Optional callback for upload progress (0-100)
 * @returns CloudinaryUploadResult with URL + metadata
 *
 * @throws Error with message if upload fails (network, auth, or Cloudinary error)
 */
export async function uploadToCloudinaryDirect(
  file: File,
  folder: string = 'mdta/misc',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  // Step 1: Get signature from our API (admin-authenticated)
  const sigRes = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, resourceType }),
  })

  if (!sigRes.ok) {
    let errMsg = 'Gagal mendapatkan signature upload'
    try {
      const data = await sigRes.json()
      errMsg = data.error || errMsg
    } catch {}
    throw new Error(errMsg)
  }

  const sig: SignatureResponse = await sigRes.json()

  // Step 2: Build FormData for Cloudinary
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.api_key)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)
  if (sig.public_id) {
    formData.append('public_id', sig.public_id)
  }

  // Step 3: POST to Cloudinary directly (bypasses Vercel body limit)
  // Use XMLHttpRequest for progress tracking (fetch doesn't support upload progress)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      })
    }

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText)

        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          resolve({
            url: response.secure_url,
            secure_url: response.secure_url,
            publicId: response.public_id,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            format: response.format,
            resourceType: response.resource_type,
            duration: response.duration,
            originalName: file.name,
          })
        } else {
          // Cloudinary error format: { error: { message: '...' } }
          const cloudinaryErr =
            response?.error?.message ||
            response?.error ||
            `Cloudinary upload gagal (HTTP ${xhr.status})`
          reject(new Error(cloudinaryErr))
        }
      } catch (parseErr) {
        reject(
          new Error(
            `Response Cloudinary tidak valid (HTTP ${xhr.status}): ${xhr.responseText.substring(0, 200)}`
          )
        )
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Koneksi error saat upload ke Cloudinary. Periksa koneksi internet.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload dibatalkan'))
    })

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout. Coba file lebih kecil atau periksa koneksi internet.'))
    })

    xhr.open('POST', sig.upload_url)
    xhr.timeout = 5 * 60 * 1000 // 5 min timeout (supports large files on slow connections)
    xhr.send(formData)
  })
}

/**
 * Get Cloudinary file size limits by resource type.
 * Free plan limits (default):
 * — image: 10 MB
 * — video: 100 MB
 * — raw: 100 MB
 *
 * Note: Your Cloudinary plan may have different limits — check dashboard.
 */
export const CLOUDINARY_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB (Cloudinary free plan)
  video: 100 * 1024 * 1024, // 100 MB (Cloudinary free plan)
  raw: 100 * 1024 * 1024, // 100 MB
} as const

/**
 * Format bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
