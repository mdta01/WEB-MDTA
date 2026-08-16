import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NotificationManager } from "@/components/layout/NotificationManager";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
        {/* Google Fonts — loaded via CDN (avoids Turbopack next/font build error).
            CSS variables --font-display and --font-body are defined in globals.css. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
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
      </head>
      <body className="antialiased bg-background text-foreground font-body">
        {children}
        <Toaster richColors position="top-center" />
        <NotificationManager />
        <SpeedInsights />
      </body>
    </html>
  );
}
