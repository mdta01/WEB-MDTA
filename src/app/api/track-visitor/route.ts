import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getClientIP,
  getUserAgent,
  hashVisitor,
  hashSession,
  parseReferrer,
  normalizePath,
  todayKey,
} from '@/lib/visitor-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/track-visitor
 *
 * Public endpoint — called from the public website on every page load.
 * Records a unique visitor (by hashed IP) + a pageview (for realtime count).
 *
 * Privacy:
 * — Never stores raw IP / UA — only SHA-256 hashes (with salt).
 * — Returns 204 No Content (no body) to minimize bandwidth.
 * — Fires-and-forgets from client side (no await needed).
 *
 * Anti-abuse:
 * — Only accepts POST with JSON body.
 * — Path/referrer validated and truncated.
 * — DB writes are wrapped in try/catch — failure doesn't break the site.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = normalizePath(body.path || '/')
    const referrer = parseReferrer(body.referrer || null)

    const ip = getClientIP(request)
    const ua = getUserAgent(request)

    // If we can't get an IP (e.g., local dev), still create a synthetic hash
    // from UA so tracking works in development.
    const visitorHash = ip ? hashVisitor(ip) : hashVisitor('dev-' + ua.substring(0, 50))
    const sessionHash = hashSession(ip || 'dev', ua)
    const day = todayKey()

    // Upsert Visitor — if hash exists, update lastSeen + increment visitCount.
    // Wrap in try/catch — if DB not migrated yet (dev), silently skip.
    try {
      await db.visitor.upsert({
        where: { visitorHash },
        create: {
          visitorHash,
          sessionHash,
          referrer,
          path,
          firstSeen: new Date(),
          lastSeen: new Date(),
          visitCount: 1,
        },
        update: {
          sessionHash,
          lastSeen: new Date(),
          visitCount: { increment: 1 },
          // Update path to latest visit's path
          path,
        },
      })

      // Insert PageView — used for realtime online count + daily aggregation
      await db.pageView.create({
        data: {
          visitorHash,
          path,
          day,
        },
      })
    } catch (dbError) {
      // DB not migrated yet (dev sandbox) — silently ignore.
      // In production (Vercel + Neon), this will work after `prisma db push`.
      console.debug('[track-visitor] DB not available, skipping:', dbError instanceof Error ? dbError.message : 'unknown')
    }

    // Prune old pageviews (>30 days) to keep table small.
    // Run occasionally (10% chance per request) to avoid blocking.
    if (Math.random() < 0.1) {
      try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        await db.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } })
      } catch {
        // ignore
      }
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[track-visitor] Error:', error)
    return new NextResponse(null, { status: 204 }) // never break the site
  }
}

/**
 * GET /api/track-visitor — return realtime online count (last 5 minutes).
 * Public, can be polled by client for live "online visitors" badge.
 */
export async function GET() {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const onlineCount = await db.pageView
      .findMany({
        where: { createdAt: { gte: fiveMinAgo } },
        select: { visitorHash: true },
        distinct: ['visitorHash'],
      })
      .then((rows) => rows.length)
      .catch(() => 0)

    return NextResponse.json({ online: onlineCount, ts: Date.now() })
  } catch {
    return NextResponse.json({ online: 0, ts: Date.now() })
  }
}
