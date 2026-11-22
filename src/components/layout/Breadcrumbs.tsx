'use client'

import { ChevronRight, Home } from 'lucide-react'
import { useAppStore, type PageSection } from '@/store/useAppStore'
import { getBreadcrumbSchema } from '@/lib/structured-data'
import { useSyncExternalStore } from 'react'

/**
 * Breadcrumbs — navigation trail with JSON-LD BreadcrumbList schema.
 *
 * Shows: Beranda > [Current Section]
 * On click: navigates to that section + smooth scroll to top.
 *
 * SEO: Injects BreadcrumbList JSON-LD schema so Google can display
 * breadcrumb trail in search results (improves CTR + user understanding).
 *
 * The schema is injected via a <script> tag in the component (client-side)
 * because the current page is determined by Zustand store state (client-side).
 * For SSR pages, use getBreadcrumbSchema() from structured-data.ts directly.
 */

const sectionLabels: Record<PageSection, string> = {
  beranda: 'Beranda',
  profil: 'Profil',
  program: 'Program',
  berita: 'Berita',
  prestasi: 'Prestasi',
  galeri: 'Galeri',
  pengumuman: 'Pengumuman',
  ppdb: 'PPDB',
  download: 'Download',
  dakwah: 'Dakwah & Kajian',
  kelembagaan: 'Kelembagaan',
  alumni: 'Alumni',
  'wali-santri': 'Wali Santri',
  kontak: 'Kontak',
  faq: 'FAQ',
  search: 'Pencarian',
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

// useSyncExternalStore — returns false on server, true on client (SSR-safe).
// Avoids "setState in effect" lint warning while preventing hydration mismatch.
const subscribeMounted = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function Breadcrumbs() {
  const { currentPage, setCurrentPage } = useAppStore()
  const mounted = useSyncExternalStore(subscribeMounted, getClientSnapshot, getServerSnapshot)

  // Don't render breadcrumbs on Beranda (home page) — no trail needed
  if (currentPage === 'beranda') return null

  const currentLabel = sectionLabels[currentPage] || 'Halaman'

  // Build breadcrumb items for JSON-LD schema
  const breadcrumbItems = [
    { name: 'Beranda', url: BASE_URL },
    { name: currentLabel, url: `${BASE_URL}/#${currentPage}` },
  ]

  const schema = getBreadcrumbSchema(breadcrumbItems)

  const handleHome = () => {
    setCurrentPage('beranda')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* JSON-LD BreadcrumbList schema for SEO */}
      {mounted && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {/* Visible breadcrumb trail — subtle, premium styling */}
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ol className="flex items-center gap-1.5 text-xs text-[#404944]/80 font-body">
          <li>
            <button
              onClick={handleHome}
              className="flex items-center gap-1 hover:text-[#003527] transition-colors"
              aria-label="Kembali ke Beranda"
            >
              <Home className="h-3 w-3" />
              <span>Beranda</span>
            </button>
          </li>
          <li aria-hidden className="text-[#cca72f]/60">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="text-[#003527] font-medium">
            {currentLabel}
          </li>
        </ol>
      </nav>
    </>
  )
}

