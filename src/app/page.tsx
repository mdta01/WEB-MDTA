'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import LiveAnnouncement from '@/components/layout/LiveAnnouncement'
import BerandaSection from '@/components/sections/BerandaSection'
import ProfilSection from '@/components/sections/ProfilSection'
import ProgramSection from '@/components/sections/ProgramSection'
import BeritaSection from '@/components/sections/BeritaSection'
import PrestasiSection from '@/components/sections/PrestasiSection'
import GaleriSection from '@/components/sections/GaleriSection'
import PengumumanSection from '@/components/sections/PengumumanSection'
import PPDBSection from '@/components/sections/PPDBSection'
import DownloadSection from '@/components/sections/DownloadSection'
import DakwahSection from '@/components/sections/DakwahSection'
import KelembagaanSection from '@/components/sections/KelembagaanSection'
import AlumniSection from '@/components/sections/AlumniSection'
import WaliSantriSection from '@/components/sections/WaliSantriSection'
import KontakSection from '@/components/sections/KontakSection'
import FAQSection from '@/components/sections/FAQSection'
import SearchSection from '@/components/sections/SearchSection'
import { Toaster } from '@/components/ui/sonner'

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
        transition={{ duration: 0.3 }}
      >
        {sections[currentPage] || <BerandaSection />}
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
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <LiveAnnouncement />
        <main className="flex-1 container mx-auto px-4 py-8">
          <SectionRenderer />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
