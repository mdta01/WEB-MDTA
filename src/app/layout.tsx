import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NotificationManager } from "@/components/layout/NotificationManager";
import { SpeedInsights } from "@vercel/speed-insights/next";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/structured-data";

// Force dynamic — fetch settings from DB for metadata + JSON-LD
export const dynamic = "force-dynamic"

// Revalidate every hour — balances freshness with performance
export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

// ============ Dynamic Metadata (SEO) ============
// Generates metadata from DB settings — title, description, OG image, etc.
// This runs on the server (SSR) so search engines see the full metadata.
async function getSettingsForMetadata() {
  try {
    const { db } = await import('@/lib/db')
    const settings = await db.siteSetting.findMany()
    const map = new Map(settings.map((s: { key: string; value: string }) => [s.key, s.value]))
    return map
  } catch {
    return new Map<string, string>()
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsForMetadata()
  const get = (key: string) => settings.get(key) || ''

  const name = get('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const subtitle = get('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'
  const description = get('madrasah_description') || 'Website resmi MDTA Miftahul Ulum 01 — Madrasah Diniyah Takmiliyah Awaliyah. Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi.'
  const logo = get('madrasah_logo') || `${BASE_URL}/images/logo-madin-warna.webp`
  const heroImage = get('madrasah_hero_image') || `${BASE_URL}/images/hero-madrasah.webp`
  const facebook = get('madrasah_facebook')
  const instagram = get('madrasah_instagram')
  const youtube = get('madrasah_youtube')
  const keywords = [
    'MDTA', 'Miftahul Ulum', 'Madrasah Diniyah', 'Madrasah Diniyah Takmiliyah Awaliyah',
    'Pondok Pesantren', 'Tahfidz Quran', 'Pendidikan Islam', 'Tawangsari', 'Pujon', 'Malang',
    subtitle, name,
  ]

  return {
    title: {
      default: `${name} - ${subtitle}`,
      template: `%s | ${name}`,
    },
    description,
    keywords,
    authors: [{ name }],
    creator: name,
    publisher: name,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: BASE_URL },
    openGraph: {
      title: name,
      description,
      type: 'website',
      locale: 'id_ID',
      url: BASE_URL,
      siteName: name,
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [heroImage],
    },
    icons: {
      icon: logo,
      apple: logo,
    },
    manifest: '/manifest.webmanifest',
    category: 'education',
    other: {
      'og:logo': logo,
      'og:image:width': '1200',
      'og:image:height': '630',
      // Social profile links for Google Knowledge Panel
      ...(facebook ? { 'og:see_also': facebook } : {}),
    },
  } as Metadata
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#003527",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch structured data schemas (JSON-LD) for SEO rich snippets
  const [orgSchema, websiteSchema] = await Promise.all([
    getOrganizationSchema(),
    getWebsiteSchema(),
  ])

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Google Fonts — loaded via CDN with preconnect for faster load.
            Only essential weights loaded (400, 600, 700) — reduces font payload.
            display=swap prevents FOIT (Flash of Invisible Text). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload critical images — hero is above the fold, needs to load ASAP.
            Logo is used in header on every page.
            Using WebP versions (60-70% smaller than PNG) for instant hero display.
            Also preconnect to Cloudinary for any remote content images. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preload" as="image" href="/images/hero-madrasah.webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/logo-madin-warna.webp" fetchPriority="high" />
        {/* CRITICAL: Preload /api/settings so browser starts fetching BEFORE React hydrates.
            Without this, the client components render with FALLBACK values
            (default name "Kepala Madrasah", default photo, default subtitle)
            during the 200-500ms it takes for fetch('/api/settings') to resolve.
            This was the root cause of the "demo template flash" on refresh.
            With preload, settings data is available MUCH faster — usually
            before any component tries to read it. */}
        <link rel="preload" as="fetch" href="/api/settings" crossOrigin="anonymous" fetchPriority="high" />
        {/* ChunkLoadError auto-reload */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var reloaded = false;
            window.addEventListener('error', function(e) {
              if (reloaded) return;
              var msg = (e.message || '').toLowerCase();
              var tag = (e.target && e.target.tagName || '').toLowerCase();
              if (msg.includes('chunkloaderror') ||
                  msg.includes('failed to fetch dynamically imported module') ||
                  msg.includes('loading chunk') ||
                  (tag === 'script' && e.target.src && e.target.src.includes('/_next/static/chunks/'))) {
                reloaded = true;
                console.warn('[ChunkLoadError] Auto-reloading page to fetch fresh chunks...');
                window.location.reload();
              }
            }, true);
            window.addEventListener('unhandledrejection', function(e) {
              if (reloaded) return;
              var msg = (e.reason && (e.reason.message || String(e.reason)) || '').toLowerCase();
              if (msg.includes('chunkloaderror') || msg.includes('failed to fetch dynamically imported module')) {
                reloaded = true;
                console.warn('[ChunkLoadError] Auto-reloading (unhandled rejection)...');
                window.location.reload();
              }
            });
          })();
        `}} />
        {/* Disable browser scroll restoration + force scroll to top on initial load.
            CRITICAL FIX: Without this, browsers (especially Facebook In-App Browser,
            Chrome mobile, Safari) restore the *previous* scroll position from the
            last session. If the user previously scrolled down to "Berita" / "Dakwah" /
            "Footer" and reopened the page, the browser would scroll back to that
            position — making it look like the page "didn't land on the hero".

            Setting history.scrollRestoration = 'manual' tells the browser: "don't
            auto-restore scroll position, I'll handle it myself."

            We also use document.documentElement.scrollTop = 0 (NOT window.scrollTo)
            because direct property assignment is INSTANT and is NOT affected by
            CSS `scroll-behavior: smooth` — guaranteeing the page is at the top
            before React even hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              // Instant scroll to top — bypasses CSS scroll-behavior: smooth.
              // Runs BEFORE React hydrates, so user always sees the hero first.
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0; // Safari fallback
              window.scrollTo(0, 0);
            } catch (e) {}
          })();
        `}} />
        {/* ============ JSON-LD Structured Data (SEO) ============
            Injects schema.org JSON-LD for rich snippets in Google search results.
            - EducationalOrganization: logo, address, contact, social profiles
            - WebSite: sitelinks, search box
            These run on the server (SSR) so search engines always see them. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased bg-background text-foreground font-body" suppressHydrationWarning>
        {children}
        {/* Visitor traffic tracker — fires on every route change, sends
            fire-and-forget POST to /api/track-visitor. Mounted at root so
            it tracks ALL pages. Skips admin routes (don't count admin views). */}
        <VisitorTracker />
        <Toaster richColors position="top-center" />
        <NotificationManager />
        <SpeedInsights />
      </body>
    </html>
  );
}
