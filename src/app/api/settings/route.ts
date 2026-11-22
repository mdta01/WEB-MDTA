import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Cache Strategy for settings endpoint:
//
// Browser cache: 30 seconds (max-age=30)
// CDN cache: 30 seconds (s-maxage=30)
// stale-while-revalidate: 30 seconds
//
// CRITICAL: s-maxage was 3600 (1 hour) which meant Vercel Edge CDN
// cached old ppdb_status for up to 1 hour after admin changed it.
// Now reduced to 30 seconds — admin changes propagate to public
// within 30 seconds.
//
// PPDBSection additionally uses cache: 'no-store' + staleTime: 0
// to bypass even this 30s cache when user navigates to PPDB page,
// ensuring immediate fresh data on PPDB section mount.
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=30',
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
