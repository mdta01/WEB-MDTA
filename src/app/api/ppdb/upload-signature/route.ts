import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ppdb/upload-signature
 *
 * Public Cloudinary signature endpoint specifically for PPDB file uploads
 * (Kartu Keluarga, Akta Kelahiran, Pas Foto).
 *
 * Unlike /api/cloudinary/signature (which requires admin auth), this endpoint
 * is intentionally PUBLIC so that prospective parents (calon wali santri)
 * can upload their documents directly from the public PPDB registration form.
 *
 * Security mitigations (since this is public):
 *  1. Folder is hard-locked to 'mdta/ppdb-uploads' — callers cannot inject
 *     their own folder path. This isolates PPDB uploads from admin uploads.
 *  2. Resource type is locked to 'image' or 'raw' (for PDFs) only.
 *     Videos are not allowed (no need for PPDB).
 *  3. Signatures expire in 1 hour (Cloudinary default), limiting replay window.
 *  4. Cloudinary's own per-account rate limits + upload preset policies apply.
 *
 * Flow:
 *  1. Client requests signature (this endpoint) — no auth required
 *  2. Server signs params with CLOUDINARY_API_SECRET (never exposed)
 *  3. Client POSTs file + signature directly to Cloudinary API
 *  4. Cloudinary returns upload result (URL, etc)
 *  5. Client saves the returned URL into form state, then submits to /api/ppdb
 */
const ALLOWED_RESOURCE_TYPES = ['image', 'raw'] as const
const LOCKED_FOLDER = 'mdta/ppdb-uploads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    // Allow caller to pick 'image' (for photos) or 'raw' (for PDFs);
    // anything else falls back to 'image'.
    const requestedType = typeof body.resourceType === 'string' ? body.resourceType : 'image'
    const resourceType: (typeof ALLOWED_RESOURCE_TYPES)[number] =
      (ALLOWED_RESOURCE_TYPES as readonly string[]).includes(requestedType)
        ? (requestedType as (typeof ALLOWED_RESOURCE_TYPES)[number])
        : 'image'

    // Validate env vars
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Layanan upload belum dikonfigurasi. Silakan hubungi panitia.' },
        { status: 503 }
      )
    }

    // Build params to sign — folder is hard-locked, no path traversal possible.
    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign: Record<string, string> = {
      folder: LOCKED_FOLDER,
      timestamp: String(timestamp),
    }

    // Generate Cloudinary signature: SHA-1 hex of sorted key=value pairs + api_secret
    const sortedKeys = Object.keys(paramsToSign).sort()
    const stringToSign =
      sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') + apiSecret
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

    return NextResponse.json({
      api_key: apiKey,
      timestamp,
      signature,
      folder: LOCKED_FOLDER,
      cloud_name: cloudName,
      resource_type: resourceType,
      upload_url: uploadUrl,
      expires_at: timestamp + 3600,
    })
  } catch (error) {
    console.error('[ppdb/upload-signature] Error:', error)
    return NextResponse.json(
      { error: 'Gagal generate signature upload' },
      { status: 500 }
    )
  }
}
