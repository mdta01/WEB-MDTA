import type { MetadataRoute } from 'next'

/**
 * robots.txt — generated dynamically by Next.js App Router.
 *
 * Strategy:
 * - Allow all pages for indexing (public website)
 * - Disallow /api/* (API endpoints are not pages)
 * - Disallow /admin/* (admin panel is private)
 * - Reference sitemap.xml for crawl efficiency
 * - Allow search engine bots (Googlebot, Bingbot, etc.)
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // Allow specific bots explicitly (builds trust with search engines)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
