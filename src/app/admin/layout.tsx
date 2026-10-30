import type { Metadata, Viewport } from "next";
import AdminSWRegister from "@/components/admin/AdminSWRegister";

export const metadata: Metadata = {
  title: "Admin Panel - MDTA Miftahul Ulum 01",
  description: "Panel administrasi MDTA Miftahul Ulum 01",
  robots: "noindex, nofollow",
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MDTA Admin",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/admin/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/admin/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/admin/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/admin/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminSWRegister />
      {children}
    </>
  );
}
