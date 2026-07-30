import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NotificationManager } from "@/components/layout/NotificationManager";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  icons: {
    icon: "/images/logo-madin-warna.png",
  },
  openGraph: {
    title: "MDTA Miftahul Ulum 01",
    description: "Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${montserrat.variable} antialiased bg-background text-foreground font-body`}
      >
        {children}
        <Toaster richColors position="top-center" />
        <NotificationManager />
        <SpeedInsights />
      </body>
    </html>
  );
}
