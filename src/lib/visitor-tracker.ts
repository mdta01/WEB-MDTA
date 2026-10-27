import { createHash } from 'crypto'

/**
 * Visitor tracking utilities — privacy-preserving.
 *
 * We never store raw IP addresses or User-Agents. Instead, we hash them
 * with SHA-256 to produce a deterministic but irreversible identifier.
 * This lets us count unique visitors without violating privacy laws
 * (GDPR, UU PDP Indonesia).
 */

/** Hash a string with SHA-256, return hex. */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Get the real client IP from a Next.js Request, accounting for common
 * proxy/CDN headers (Vercel, Cloudflare, nginx, etc.).
 * Returns the first non-empty value, or '' if none found.
 */
export function getClientIP(req: Request): string {
  // Vercel uses x-forwarded-for (comma-separated, first is client)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  // Cloudflare
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp
  // Other common headers
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) return xRealIp
  // Last resort — socket remote address (rarely useful)
  return ''
}

/**
 * Extract client User-Agent.
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || ''
}

/**
 * Hash IP for privacy-preserving storage.
 * Returns 64-char hex SHA-256.
 */
export function hashVisitor(ip: string): string {
  // Salt with a constant app secret to make hashes app-specific.
  // (Even if someone got the DB, they can't reverse to raw IP without the salt.)
  const salt = process.env.VISITOR_HASH_SALT || 'mdta-miftahul-ulum-01-v1'
  return sha256(salt + '|' + ip)
}

/**
 * Hash (IP + UA) for session-level dedup.
 * Same IP but different browser = different sessionHash.
 */
export function hashSession(ip: string, ua: string): string {
  const salt = process.env.VISITOR_HASH_SALT || 'mdta-miftahul-ulum-01-v1'
  return sha256(salt + '|' + ip + '|' + ua)
}

/**
 * Parse referrer URL — strip query params, truncate.
 */
export function parseReferrer(referrer: string | null): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    // Keep only origin + pathname (no query string, no hash)
    const clean = url.origin + url.pathname
    return clean.substring(0, 255)
  } catch {
    return null
  }
}

/**
 * Normalize path — strip query string, truncate.
 */
export function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  // Strip query
  const clean = pathname.split('?')[0].split('#')[0]
  return clean.substring(0, 255) || '/'
}

/**
 * Get today's ISO date string (YYYY-MM-DD) in UTC.
 * Used for the `day` field in PageView (indexed for fast aggregation).
 */
export function todayKey(date = new Date()): string {
  return date.toISOString().substring(0, 10)
}
