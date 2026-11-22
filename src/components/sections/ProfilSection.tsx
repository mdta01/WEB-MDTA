'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EmptyStateCard } from '@/components/ui/empty-state'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { KratonSectionHeader } from '@/components/kraton'
import { MadrasahTimeline } from '@/components/sections/profil/MadrasahTimeline'
import { VisiMisiTujuanInfografis } from '@/components/sections/profil/VisiMisiTujuanInfografis'
import { StrukturOrganisasiChart } from '@/components/sections/profil/StrukturOrganisasiChart'
import { IdentitasMadrasah } from '@/components/sections/profil/IdentitasMadrasah'

// Split history text into "pages" — each page = ~2 paragraphs (or ~600 chars if no paragraph breaks)
function splitIntoPages(text: string, charsPerPage = 600): string[] {
  if (!text) return []
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length <= 1) {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += charsPerPage) {
      chunks.push(text.slice(i, i + charsPerPage))
    }
    return chunks.length > 0 ? chunks : [text]
  }
  const pages: string[] = []
  let currentPage = ''
  let paraCount = 0
  for (const para of paragraphs) {
    if (currentPage.length + para.length > charsPerPage && currentPage) {
      pages.push(currentPage.trim())
      currentPage = para
      paraCount = 1
    } else {
      currentPage += (currentPage ? '\n\n' : '') + para
      paraCount++
      if (paraCount >= 2 && currentPage.length > charsPerPage / 2) {
        pages.push(currentPage.trim())
        currentPage = ''
        paraCount = 0
      }
    }
  }
  if (currentPage.trim()) pages.push(currentPage.trim())
  return pages.length > 0 ? pages : [text]
}

// HistoryBook — paginated history with flip animation (preserved from previous design)
function HistoryBook({
  history,
  madrasahName,
  historyYear,
}: {
  history: string
  madrasahName: string
  historyYear: string
}) {
  const pages = useMemo(() => splitIntoPages(history), [history])
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)

  const totalPages = pages.length

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return
    setDirection(page > currentPage ? 1 : -1)
    setCurrentPage(page)
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  }

  return (
    <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow overflow-hidden rounded-2xl bg-[#ffffff] mb-20 md:mb-0">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        {/* Left — Book cover */}
        <div className="bg-gradient-to-br from-[#003527] to-[#064e3b] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center md:min-h-[350px] relative overflow-hidden py-6 sm:py-8">
          <div className="absolute inset-0 kraton-pattern opacity-[0.05]" aria-hidden />
          <div className="relative text-center text-white">
            <div className="flex md:flex-col items-center gap-3 md:gap-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-[#cca72f]/15 flex items-center justify-center shrink-0 ring-2 ring-[#cca72f]/30">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-[#cca72f]" />
              </div>
              <div className="text-left md:text-center">
                <h3 className="text-base md:text-xl lg:text-2xl font-bold mb-0 md:mb-2 font-display leading-tight">
                  {madrasahName}
                </h3>
                <p className="text-[#b0f0d6] text-xs md:text-sm">Berdiri sejak tahun {historyYear}</p>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="mt-3 md:mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                <span className="text-[#ffe088] text-xs font-semibold">
                  Hal {currentPage + 1} / {totalPages}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right — Book page content */}
        <div className="md:col-span-3 p-4 sm:p-6 md:p-8 flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-none">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-justify"
              >
                <MarkdownRenderer content={pages[currentPage]} className="text-sm text-justify leading-relaxed" />
              </motion.div>
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#e4e2de] shrink-0">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-[#003527] bg-[#f5f3ef] hover:bg-[#064e3b]/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentPage
                        ? 'w-5 sm:w-6 bg-[#003527]'
                        : 'w-2 bg-[#e4e2de] hover:bg-[#cca72f]/40'
                    }`}
                    aria-label={`Halaman ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-[#003527] bg-[#f5f3ef] hover:bg-[#064e3b]/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

type StrukturItem = { role: string; name: string; level: number }

export default function ProfilSection() {
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : settingsData?.settings || []
  const getSetting = (key: string) =>
    settings.find((s: { key: string }) => s.key === key)?.value || ''

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetch('/api/teachers').then(r => r.json()),
  })
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.teachers || []

  // Parse struktur organisasi JSON
  const parseStruktur = (): StrukturItem[] | null => {
    const raw = getSetting('madrasah_struktur_organisasi')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StrukturItem[]
    } catch {
      return null
    }
  }

  const struktur = parseStruktur()
  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const historyYear = getSetting('madrasah_history_year') || '1948'
  const history = getSetting('madrasah_history')
  const vision = getSetting('madrasah_vision')
  const missionText = getSetting('madrasah_mission')
  const goalsText = getSetting('madrasah_goals')

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-16 md:space-y-24">
      {/* Sejarah — Book style with pagination */}
      <section>
        <KratonSectionHeader badge="Sejarah" title="Sejarah Madrasah" align="center" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {history ? (
            <HistoryBook history={history} madrasahName={madrasahName} historyYear={historyYear} />
          ) : (
            <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow rounded-2xl bg-[#ffffff]">
              <CardContent className="p-8 text-center">
                <EmptyState
                  illustration="profil"
                  variant="compact"
                  title="Sejarah madrasah belum tersedia"
                  message={`Kisah perjalanan madrasah dari ${historyYear} akan segera lengkap.`}
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </section>

      {/* Timeline Interaktif Sejarah */}
      <section>
        <KratonSectionHeader
          badge="Perjalanan"
          title="Linimasa Madrasah"
          align="center"
          subtitle="Jejak langkah madrasah dari masa ke masa — dari pendirian hingga era modernisasi digital."
        />
        <MadrasahTimeline foundingYear={historyYear} />
      </section>

      {/* Visi Misi Tujuan — Premium Infografis */}
      <section>
        <KratonSectionHeader
          badge="Landasan"
          title="Visi, Misi & Tujuan"
          align="center"
          subtitle="Pilar-pilar utama yang menjadi kompas arah dan langkah strategis madrasah."
        />
        <VisiMisiTujuanInfografis
          vision={vision}
          missionText={missionText}
          goalsText={goalsText}
        />
      </section>

      {/* Identitas Madrasah — Document-style card */}
      <section>
        <KratonSectionHeader
          badge="Legalitas"
          title="Identitas Madrasah"
          align="center"
          subtitle="Profil resmi madrasah sebagai dasar hukum dan akreditasi kelembagaan."
        />
        <IdentitasMadrasah getSetting={getSetting} />
      </section>

      {/* Struktur Organisasi — Visual Hierarchy Chart */}
      <section>
        <KratonSectionHeader
          badge="Organisasi"
          title="Struktur Organisasi"
          align="center"
          subtitle="Susunan kepengurusan madrasah dari pimpinan hingga staf pelaksana."
        />
        <StrukturOrganisasiChart struktur={struktur} />
      </section>

      {/* Data Guru — Premium Teacher Cards (preserved) */}
      <section>
        <KratonSectionHeader
          badge="Edukator"
          title="Tenaga Pengajar"
          align="center"
          subtitle={
            teachers.length > 0
              ? `${teachers.filter((t: { isActive?: boolean }) => t.isActive !== false).length} guru pengajar`
              : undefined
          }
        />
        {teachersLoading ? (
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden border-0">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </div>
              </Card>
            ))}
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {teachers.map(
              (
                teacher: {
                  id: string
                  name: string
                  position: string
                  subject?: string
                  image?: string
                  phone?: string
                },
                idx: number,
              ) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.03, 0.15), duration: 0.4 }}
                >
                  <Card className="overflow-hidden border border-[#e4e2de] shadow-premium card-hover group flex flex-col h-full rounded-2xl bg-[#ffffff]">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#064e3b]/20 to-[#003527]/30">
                      {teacher.image ? (
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#003527] to-[#064e3b] flex items-center justify-center">
                          <span className="text-5xl md:text-6xl font-extrabold text-white/90">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#003527]/40 to-transparent" />
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center p-3 sm:p-4 pt-3 bg-[#ffffff] min-w-0">
                      <span className="inline-block bg-[#cca72f]/20 text-[#895033] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
                        {teacher.position}
                      </span>
                      <h4 className="font-bold text-[#003527] text-sm md:text-base leading-tight">
                        {teacher.name}
                      </h4>
                      {teacher.subject && (
                        <p className="text-[10px] sm:text-xs text-[#404944] mt-1 flex items-center justify-center gap-1 min-w-0">
                          <BookOpen className="h-3 w-3 shrink-0 text-[#003527]" />
                          <span className="line-clamp-2 text-center leading-tight">
                            {teacher.subject}
                          </span>
                        </p>
                      )}
                    </div>

                    {teacher.phone && (
                      <div className="px-4 py-2.5 bg-[#f5f3ef] border-t border-[#e4e2de]">
                        <a
                          href={`tel:${teacher.phone}`}
                          className="flex items-center justify-center gap-1.5 text-xs text-[#003527] hover:text-[#064e3b] font-medium transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{teacher.phone}</span>
                        </a>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ),
            )}
          </div>
        ) : (
          <EmptyStateCard
            illustration="profil"
            title="Data guru belum tersedia"
            message="Profil para asatidz madrasah akan segera ditampilkan di sini."
          />
        )}
      </section>
    </div>
  )
}
