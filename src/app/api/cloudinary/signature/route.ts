import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/cloudinary/signature
 *
 * Generates a signed upload params for client-side direct upload to Cloudinary.
 * This bypasses Vercel's 4.5MB body size limit — file goes directly from
 * browser → Cloudinary (no Vercel function in the middle).
 *
 * Flow:
 * 1. Client requests signature (this endpoint) — auth: admin session
 * 2. Server signs params with CLOUDINARY_API_SECRET (never exposed to client)
 * 3. Client POSTs file + signature directly to Cloudinary API
 * 4. Cloudinary returns upload result (URL, dimensions, etc)
 * 5. Client saves the returned URL to form state
 *
 * Request body:
 * { folder: string, resourceType: 'image' | 'video' | 'raw' | 'auto', publicId?: string }
 *
 * Response:
 * { api_key, timestamp, signature, folder, public_id?, cloud_name, resource_type, upload_url }
 */
export async function POST(request: NextRequest) {
  // Auth check — only admin can request upload signatures
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json(
      { error: 'Unauthorized. Silakan login sebagai admin.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { folder = 'mdta/misc', resourceType = 'image', publicId } = body

    // Validate resource type — strict whitelist
    const validResourceTypes = ['image', 'video', 'raw', 'auto'] as const
    if (!validResourceTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: `resourceType tidak valid: ${resourceType}. Hanya image, video, raw, auto.` },
        { status: 400 }
      )
    }

    // Validate env vars
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di environment variables.' },
        { status: 500 }
      )
    }

    // Sanitize folder — prevent path traversal
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

    // Build params to sign
    // Cloudinary signature is SHA-1 hex of: sorted params joined by & + api_secret
    // Reference: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
    const timestamp = Math.floor(Date.now() / 1000)

    const paramsToSign: Record<string, string> = {
      folder: safeFolder,
      timestamp: String(timestamp),
    }
    if (safePublicId) {
      paramsToSign.public_id = safePublicId
    }

    // Generate signature
    // 1. Sort keys alphabetically
    // 2. Join key=value pairs with &
    // 3. Append api_secret
    // 4. SHA-1 hex digest
    const sortedKeys = Object.keys(paramsToSign).sort()
    const stringToSign =
      sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') +
      apiSecret
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    // Construct the upload URL for client to POST to
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

    return NextResponse.json({
      api_key: apiKey,
      timestamp,
      signature,
      folder: safeFolder,
      public_id: safePublicId,
      cloud_name: cloudName,
      resource_type: resourceType,
      upload_url: uploadUrl,
      // Expire in 1 hour (Cloudinary default)
      expires_at: timestamp + 3600,
    })
  } catch (error) {
    console.error('[cloudinary/signature] Error:', error)
    return NextResponse.json(
      { error: 'Gagal generate signature Cloudinary' },
      { status: 500 }
    )
  }
}
