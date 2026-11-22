import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force this route to be dynamic (always queries DB) but cache the response.
// We use Cache-Control + s-maxage so Vercel's Edge CDN caches the response
// for 1 hour, with stale-while-revalidate allowing instant response from cache
// while refreshing in the background.
//
// CRITICAL: Without caching, every page refresh triggers a fresh Neon DB query
// (200-500ms). During that window, client components render with FALLBACK values
// (e.g. "Kepala Madrasah" instead of "Bapak Hasyim Asy'ari",
// /images/kepala-madrasah.webp instead of Cloudinary URL).
// This caused the "demo template flash" bug users saw on refresh.
//
// With this cache:
//   1. Browser caches the response for 1 hour (max-age=3600)
//   2. Vercel CDN caches for 24 hours (s-maxage=86400)
//   3. stale-while-revalidate serves stale instantly while refreshing in BG
// Result: subsequent page loads get settings INSTANTLY from cache, no flash.
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    return NextResponse.json(settings, {
      headers: {
        // Browser cache: 1 hour. CDN cache: 24 hours. SWR: 24 hours.
        // 'public' allows Vercel CDN to cache. 'must-revalidate' ensures
        // we don't serve stale data past max-age.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
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
