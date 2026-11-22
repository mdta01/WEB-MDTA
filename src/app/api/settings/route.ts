import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Cache strategy for settings endpoint:
//
// Browser cache: 60 seconds (max-age=60)
//   - Short enough that admin changes propagate within 1 minute
//   - Long enough to prevent "demo template flash" on rapid refresh
//   - Browsers will revalidate after 60s (conditional GET, very fast)
//
// CDN cache: 1 hour (s-maxage=3600)
//   - Vercel Edge CDN caches for 1 hour for anonymous visitors
//   - Serves from CDN edge (instant) while background-refreshing
//
// stale-while-revalidate: 1 hour
//   - If both browser and CDN cache are stale, serve stale instantly
//   while fetching fresh data in the background
//
// CRITICAL: max-age must NOT be too long (was 3600=1hr) because admin
// can change settings (ppdb_status, ppdb_info, etc.) at any time.
// 60 seconds is the sweet spot between performance and freshness.
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    return NextResponse.json(settings, {
      headers: {
        // Browser cache: 60s. CDN cache: 1 hour. SWR: 1 hour.
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
