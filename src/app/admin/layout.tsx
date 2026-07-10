import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - MDTA Miftahul Ulum 01",
  description: "Panel administrasi MDTA Miftahul Ulum 01",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
