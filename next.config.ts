import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Enable automatic image optimization (WebP/AVIF conversion, resizing)
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 1 year (they rarely change)
    minimumCacheTTL: 31536000,
    // Allow remote images from Cloudinary (used for uploaded content)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Compress responses (gzip/brotli)
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
