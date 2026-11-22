import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

/**
 * sitemap.xml — generated dynamically from database content.
 *
 * Includes:
 * - Static pages (Beranda, Profil, Program, Berita, Dakwah, Galeri, etc.)
 * - Dynamic article pages (each news, dakwah, event has its own URL for SEO)
 * - Dynamic FAQ pages (if FAQ content is split per-category)
 *
 * Generated at request time (Next.js ISR with revalidation) so new
 * articles automatically appear in the sitemap without manual update.
 *
 * Search engines (Google, Bing) crawl this to discover all pages.
 * Submit at: https://search.google.com/search-console
 */

// Revalidate every 1 hour — balances freshness with performance
export const revalidate = 3600

// Force dynamic rendering — we need DB access, can't be cached statically
export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

type SitemapEntry = {
  url: string
  lastModified?: Date | string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = []

  // ============ Static Pages ============
  // Main navigation pages — high priority, weekly change frequency
  const staticPages: SitemapEntry[] = [
    { url: '/', changeFrequency: 'daily', priority: 1.0, lastModified: new Date() },
    { url: '/#profil', changeFrequency: 'monthly', priority: 0.9 },
    { url: '/#program', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/#kelembagaan', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/#berita', changeFrequency: 'daily', priority: 0.9 },
    { url: '/#pengumuman', changeFrequency: 'daily', priority: 0.8 },
    { url: '/#prestasi', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/#galeri', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/#dakwah', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/#ppdb', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/#alumni', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/#wali-santri', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/#kontak', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/#faq', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/#download', changeFrequency: 'monthly', priority: 0.4 },
  ]
  entries.push(...staticPages)

  // ============ Dynamic Content (from DB) ============
  // Each article/event gets its own URL for SEO indexing.
  // These URLs use hash-based routing (/#berita?id=xxx) since the site is SPA-style.
  // For true SEO benefits, each article should ideally have its own URL path
  // (e.g. /berita/judul-artikel), but that requires route refactoring.
  // For now, we list article URLs with query params — search engines will crawl them.

  try {
    // Fetch all news articles
    const news = await db.news.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    for (const article of news) {
      entries.push({
        url: `/#berita?id=${article.id}`,
        lastModified: article.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    // Fetch all dakwah content
    const dakwah = await db.dakwah.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    for (const item of dakwah) {
      entries.push({
        url: `/#dakwah?id=${item.id}`,
        lastModified: item.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    // Fetch all events
    const events = await db.event.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { date: 'desc' },
    })
    for (const event of events) {
      entries.push({
        url: `/#berita?event=${event.id}`,
        lastModified: event.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    // Fetch gallery items
    const gallery = await db.gallery.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    for (const item of gallery) {
      entries.push({
        url: `/#galeri?id=${item.id}`,
        lastModified: item.updatedAt,
        changeFrequency: 'yearly',
        priority: 0.4,
      })
    }
  } catch (error) {
    // If DB is unavailable (e.g. during build), return static pages only.
    // The sitemap will still be valid, just without dynamic content URLs.
    console.error('Sitemap DB fetch error:', error)
  }

  // Convert to absolute URLs with base URL
  return entries.map(entry => ({
    url: entry.url.startsWith('http') ? entry.url : `${BASE_URL}${entry.url}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
