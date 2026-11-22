/**
 * Cloudinary URL helpers — automatic responsive image optimization.
 *
 * Transforms raw Cloudinary URLs to include optimization params:
 *   - f_auto : serve WebP/AVIF based on browser support (auto-negotiate)
 *   - q_auto : automatic quality (reduces file size 30-50% with no visible loss)
 *   - w_<N> : resize to width N pixels (responsive sizing)
 *   - c_fill / c_limit : crop mode for thumbnails vs detail views
 *   - g_auto : smart gravity (focuses on important content like faces/objects)
 *
 * For NON-Cloudinary URLs (e.g. look.jmgbb.com, /images/*.webp), returns as-is.
 *
 * USAGE:
 *   import { getCloudinaryUrl, getCloudinarySrcSet } from '@/lib/cloudinary'
 *
 *   // Single optimized URL (thumbnail card)
 *   <SmartImage src={getCloudinaryUrl(item.image, { width: 600, crop: 'fill' })} />
 *
 *   // Responsive srcset (detail dialog — browser picks best size)
 *   <img src={getCloudinaryUrl(item.image, { width: 1200 })}
 *        srcSet={getCloudinarySrcSet(item.image, [400, 800, 1200, 1600])} />
 *
 * IMPACT:
 *   - Photo berita/dakwah 3MB (original) → 150KB (thumbnail w_600,q_auto)
 *   - Bandwidth reduction: ~80-95% per image
 *   - Faster LCP, faster LCP for below-the-fold images
 */

type CloudinaryOptions = {
  /** Target width in pixels. Cloudinary will resize to this width. */
  width?: number
  /** Target height in pixels (use with crop='fill' for exact dimensions). */
  height?: number
  /** Crop mode: 'fill' (cover, may crop), 'limit' (no upscale), 'scale' (stretch), 'fit' (contain). Default: 'limit' */
  crop?: 'fill' | 'limit' | 'scale' | 'fit' | 'crop'
  /** Smart gravity — focuses on faces/objects. Use with crop='fill'. Default: 'auto' */
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south'
  /** Quality: 'auto' (recommended) or 1-100. Default: 'auto' */
  quality?: 'auto' | 'auto:low' | 'auto:best' | number
  /** Format: 'auto' (recommended — serves WebP/AVIF based on browser) or 'webp'/'jpg'/'png'. Default: 'auto' */
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif'
  /** Additional Cloudinary transformations (raw string). Rarely needed. */
  raw?: string
}

// Cloudinary upload URL pattern: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>
// We insert transformations AFTER '/upload/' and BEFORE '/v<version>/'.
const CLOUDINARY_PATTERN = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/

/**
 * Check if a URL is a Cloudinary URL that can be optimized.
 */
export function isCloudinaryUrl(url: string): boolean {
  return CLOUDINARY_PATTERN.test(url)
}

/**
 * Transform a Cloudinary URL to include optimization params.
 * Non-Cloudinary URLs are returned UNCHANGED (no-op).
 *
 * @example
 * getCloudinaryUrl('https://res.cloudinary.com/duq8rhc3g/image/upload/v123/mdta/news/abc.jpg', { width: 600 })
 * // → 'https://res.cloudinary.com/duq8rhc3g/image/upload/f_auto,q_auto,w_600,c_limit/v123/mdta/news/abc.jpg'
 */
export function getCloudinaryUrl(url: string, options: CloudinaryOptions = {}): string {
  if (!url || typeof url !== 'string') return url

  // Only transform Cloudinary URLs — pass through other URLs (jmgbb, /images/*, data:, etc.)
  const match = url.match(CLOUDINARY_PATTERN)
  if (!match) return url

  const [, prefix, suffix] = match
  const transformations: string[] = []

  // Format — f_auto lets Cloudinary negotiate WebP/AVIF based on Accept header
  const format = options.format ?? 'auto'
  transformations.push(`f_${format}`)

  // Quality — q_auto is Cloudinary's ML-based quality optimizer (best balance)
  const quality = options.quality ?? 'auto'
  transformations.push(`q_${quality}`)

  // Width
  if (options.width) {
    transformations.push(`w_${options.width}`)
  }

  // Height
  if (options.height) {
    transformations.push(`h_${options.height}`)
  }

  // Crop mode — default 'limit' (resize down only, never upscale)
  const crop = options.crop ?? 'limit'
  transformations.push(`c_${crop}`)

  // Gravity — only relevant for crop='fill' (focus on important content)
  if (crop === 'fill') {
    const gravity = options.gravity ?? 'auto'
    transformations.push(`g_${gravity}`)
  }

  // Raw additional transformations
  if (options.raw) {
    transformations.push(options.raw)
  }

  // Join transformations with comma, append slash
  const transformStr = transformations.join(',') + '/'

  return `${prefix}${transformStr}${suffix}`
}

/**
 * Generate a responsive srcSet string for a Cloudinary URL.
 * Browser will pick the best size based on viewport + devicePixelRatio.
 *
 * @example
 * getCloudinarySrcSet(url, [400, 800, 1200, 1600])
 * // → 'url?w_400 400w, url?w_800 800w, url?w_1200 1200w, url?w_1600 1600w'
 *
 * Non-Cloudinary URLs return empty string (srcSet not applicable).
 */
export function getCloudinarySrcSet(url: string, widths: number[] = [400, 800, 1200, 1600]): string {
  if (!isCloudinaryUrl(url)) return ''

  return widths
    .map((w) => `${getCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(', ')
}

/**
 * Get the best image URL based on display context.
 * Convenience wrapper that picks sensible defaults for each use case.
 *
 * @example
 * // Card thumbnail (3:2 aspect ratio, ~600px wide)
 * getCloudinaryThumb(url)
 *
 * // Detail dialog (~1200px wide)
 * getCloudinaryDetail(url)
 *
 * // Hero image (wide, ~1920px)
 * getCloudinaryHero(url)
 */
export function getCloudinaryThumb(url: string, width = 600): string {
  return getCloudinaryUrl(url, { width, crop: 'fill', gravity: 'auto' })
}

export function getCloudinaryDetail(url: string, width = 1200): string {
  return getCloudinaryUrl(url, { width, crop: 'limit' })
}

export function getCloudinaryHero(url: string, width = 1920): string {
  return getCloudinaryUrl(url, { width, crop: 'fill', gravity: 'auto', quality: 'auto:best' })
}

/**
 * Avatar — square, smaller, face-focused.
 * Used for: principal photo, alumni photos, user avatars.
 */
export function getCloudinaryAvatar(url: string, size = 200): string {
  return getCloudinaryUrl(url, { width: size, height: size, crop: 'fill', gravity: 'face' })
}
