import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NotificationManager } from "@/components/layout/NotificationManager";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MDTA Miftahul Ulum 01 - Madrasah Diniyah Takmiliyah Awaliyah",
  description: "Website resmi MDTA Miftahul Ulum 01 - Madrasah Diniyah Takmiliyah Awaliyah. Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi.",
  keywords: ["MDTA", "Miftahul Ulum", "Madrasah Diniyah", "Pondok Pesantren", "Tahfidz Quran", "Pendidikan Islam"],
  authors: [{ name: "MDTA Miftahul Ulum 01" }],
  // Favicon: Next.js 16 auto-detects src/app/icon.png and serves it at /icon
  // Logo displayed in header/footer comes from admin-uploaded 'madrasah_logo' setting
  openGraph: {
    title: "MDTA Miftahul Ulum 01",
    description: "Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi",
    type: "website",
  },
};

// Viewport — disable pinch zoom & set maximumScale=1 for native app feel.
// userScalable=false prevents zoom on mobile (iOS Safari + Android Chrome).
// viewportFit=cover respects safe-area insets (notch, home indicator).
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
        {/* ChunkLoadError auto-reload — when Next.js chunk fails to load
            (common after new deploy with different chunk hashes),
            automatically reload page once to fetch fresh chunks. */}
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
      <body
        className={`${playfair.variable} ${montserrat.variable} antialiased bg-background text-foreground font-body`}
      >
        {children}
        <Toaster richColors position="top-center" />
        <NotificationManager />
      </body>
    </html>
  );
}
