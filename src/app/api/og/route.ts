import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * OG Image API — generates dynamic Open Graph image per page.
 *
 * Instead of a static OG image, this endpoint generates a dynamic image
 * with the page title overlaid on the madrasah hero image.
 *
 * Uses Cloudinary's text overlay transformation (l_text: parameter) to
 * dynamically add text to the hero image. No image processing on our server.
 *
 * URL format:
 *   /api/og?title=Berita%20Terbaru&type=berita
 *   /api/og?title=PPDB%202027&type=ppdb
 *
 * Returns: Redirect to Cloudinary URL (302) so CDN can cache the image.
 *
 * Fallback: If Cloudinary is not configured, returns the default hero image.
 */

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

// Cache for 1 hour — balances freshness with CDN efficiency
export const revalidate = 3600

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const title = searchParams.get('title') || 'MDTA Miftahul Ulum 01'
  const type = searchParams.get('type') || 'default'

  // Get hero image from settings (fallback to local default)
  let heroImage = `${BASE_URL}/images/hero-madrasah.webp`
  let logoUrl = `${BASE_URL}/images/logo-madin-warna.webp`
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: { in: ['madrasah_hero_image', 'madrasah_logo', 'madrasah_name'] },
      },
    })
    const map = new Map(settings.map(s => [s.key, s.value]))
    if (map.get('madrasah_hero_image')) heroImage = map.get('madrasah_hero_image')!
    if (map.get('madrasah_logo')) logoUrl = map.get('madrasah_logo')!
  } catch {
    // Use defaults
  }

  // If Cloudinary is configured, use its text overlay transformation
  if (CLOUDINARY_CLOUD_NAME && heroImage.includes('res.cloudinary.com')) {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<public_id>
    const match = heroImage.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/)
    if (match) {
      const publicId = match[1].replace(/\.(png|jpg|jpeg|webp)$/i, '')

      // Build Cloudinary URL with text overlay
      // l_text:<font_style>:<text>:<options>
      // We use: font Arial 48px, white, bottom-aligned with padding
      const titleEncoded = encodeURIComponent(title.substring(0, 80))
      const ogUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` +
        `w_1200,h_630,c_fill,g_auto/` +              // Resize to OG dimensions (1200x630)
        `e_brightness:-30/` +                         // Darken for text readability
        `${publicId}.jpg/` +                          // Source image
        `?l_text:Arial_48_bold:${titleEncoded},` +    // Text overlay
        `co_white,g_south,y_60/` +                    // White text, bottom, 60px padding
        `fl_layer_apply`

      return NextResponse.redirect(ogUrl, {
        status: 302,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    }
  }

  // Fallback: return the hero image directly (no text overlay)
  return NextResponse.redirect(heroImage, {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
