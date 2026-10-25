import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MDTA Miftahul Ulum 01',
    short_name: 'MDTA',
    description: 'Website resmi MDTA Miftahul Ulum 01 - Madrasah Diniyah Takmiliyah Awaliyah',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf9f5',
    theme_color: '#003527',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
