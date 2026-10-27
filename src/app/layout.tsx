import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NotificationManager } from "@/components/layout/NotificationManager";
import { SpeedInsights } from "@vercel/speed-insights/next";
import VisitorTracker from "@/components/layout/VisitorTracker";

export const metadata: Metadata = {
  title: "MDTA Miftahul Ulum 01 - Madrasah Diniyah Takmiliyah Awaliyah",
  description: "Website resmi MDTA Miftahul Ulum 01 - Madrasah Diniyah Takmiliyah Awaliyah. Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi.",
  keywords: ["MDTA", "Miftahul Ulum", "Madrasah Diniyah", "Pondok Pesantren", "Tahfidz Quran", "Pendidikan Islam"],
  authors: [{ name: "MDTA Miftahul Ulum 01" }],
  openGraph: {
    title: "MDTA Miftahul Ulum 01",
    description: "Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#003527",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body className="antialiased bg-background text-foreground font-body">
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
