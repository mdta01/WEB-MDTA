'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import LiveAnnouncement from '@/components/layout/LiveAnnouncement'
import { Toaster } from '@/components/ui/sonner'
import { Skeleton } from '@/components/ui/skeleton'

// BerandaSection is the default/largest — load eagerly (above the fold)
import BerandaSection from '@/components/sections/BerandaSection'

// All other sections — lazy loaded (code splitting).
// Only the active section's chunk is downloaded, reducing initial bundle by ~80%.
const ProfilSection = lazy(() => import('@/components/sections/ProfilSection'))
const ProgramSection = lazy(() => import('@/components/sections/ProgramSection'))
const BeritaSection = lazy(() => import('@/components/sections/BeritaSection'))
const PrestasiSection = lazy(() => import('@/components/sections/PrestasiSection'))
const GaleriSection = lazy(() => import('@/components/sections/GaleriSection'))
const PengumumanSection = lazy(() => import('@/components/sections/PengumumanSection'))
const PPDBSection = lazy(() => import('@/components/sections/PPDBSection'))
const DownloadSection = lazy(() => import('@/components/sections/DownloadSection'))
const DakwahSection = lazy(() => import('@/components/sections/DakwahSection'))
const KelembagaanSection = lazy(() => import('@/components/sections/KelembagaanSection'))
const AlumniSection = lazy(() => import('@/components/sections/AlumniSection'))
const WaliSantriSection = lazy(() => import('@/components/sections/WaliSantriSection'))
const KontakSection = lazy(() => import('@/components/sections/KontakSection'))
const FAQSection = lazy(() => import('@/components/sections/FAQSection'))
const SearchSection = lazy(() => import('@/components/sections/SearchSection'))

// Loading fallback — minimal skeleton while section chunk loads
function SectionLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-1 w-20 mx-auto rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionRenderer() {
  const { currentPage } = useAppStore()

  const sections: Record<string, React.ReactNode> = {
    beranda: <BerandaSection />,
    profil: <ProfilSection />,
    program: <ProgramSection />,
    berita: <BeritaSection />,
    prestasi: <PrestasiSection />,
    galeri: <GaleriSection />,
    pengumuman: <PengumumanSection />,
    ppdb: <PPDBSection />,
    download: <DownloadSection />,
    dakwah: <DakwahSection />,
    kelembagaan: <KelembagaanSection />,
    alumni: <AlumniSection />,
    'wali-santri': <WaliSantriSection />,
    kontak: <KontakSection />,
    faq: <FAQSection />,
    search: <SearchSection />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Suspense fallback={<SectionLoading />}>
          {sections[currentPage] || <BerandaSection />}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes — prevents refetch on navigation back
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000, // garbage collect after 10 min (was cacheTime)
            retry: 1,
            refetchOnWindowFocus: false, // don't refetch when user switches tabs
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* MotionConfig — respect user's prefers-reduced-motion setting.
          If user has reduced motion enabled (OS setting), all framer-motion
          animations are reduced to instant transitions. */}
      <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        {/* Skip to main content — keyboard accessibility (Tab key reveals link) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#003527] focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>
        <Header />
        <LiveAnnouncement />
        <main id="main-content" className="flex-1 w-full overflow-x-hidden" tabIndex={-1}>
          <SectionRenderer />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
      <Toaster position="top-right" richColors />
      </MotionConfig>
    </QueryClientProvider>
  )
}
