'use client'

import { motion } from 'framer-motion'
import { Building2, BookOpen, Users, Award, Sparkles, type LucideIcon } from 'lucide-react'
import { KratonDivider } from '@/components/kraton'

type Milestone = {
  year: string
  title: string
  description: string
  icon: LucideIcon
}

/**
 * MadrasahTimeline — Premium visual timeline of madrasah milestones.
 *
 * Derives 4 milestone "eras" from the founding year, then adds the current
 * year as a 5th milestone ("Era Kini"). Each milestone has:
 * - Large gold year
 * - Title (e.g. "Pendirian Madrasah")
 * - Short description
 * - Icon
 * - Alternating left/right layout on desktop, vertical on mobile
 * - Connected by vertical gold line
 *
 * Scroll-triggered entrance animation (slide from left/right).
 */
export function MadrasahTimeline({ foundingYear }: { foundingYear: string }) {
  const startYear = parseInt(foundingYear, 10)
  const currentYear = new Date().getFullYear()
  const validStart = Number.isFinite(startYear) && startYear > 1900 && startYear <= currentYear
    ? startYear
    : 1948

  // Derive 4 evenly-spaced milestone years between founding and present
  const span = currentYear - validStart
  const milestones: Milestone[] = [
    {
      year: String(validStart),
      title: 'Pendirian Madrasah',
      description:
        'Berawal dari kepedulian para ulama dan tokoh masyarakat untuk menyediakan pendidikan agama yang berkualitas bagi generasi muda.',
      icon: Building2,
    },
    {
      year: String(Math.round(validStart + span * 0.33)),
      title: 'Pengembangan Kurikulum',
      description:
        'Penyusunan kurikulum terstruktur yang memadukan ilmu agama dan umum, disertai pembentukan struktur kepengurusan formal.',
      icon: BookOpen,
    },
    {
      year: String(Math.round(validStart + span * 0.66)),
      title: 'Penguatan Kelembagaan',
      description:
        'Renovasi fisik, penambahan tenaga pengajar tersertifikasi, dan akreditasi resmi sebagai pengakuan kualitas pendidikan.',
      icon: Users,
    },
    {
      year: String(currentYear),
      title: 'Era Digital & Modernisasi',
      description:
        'Transformasi digital: sistem PPDB online, pembelajaran berbasis teknologi, dan integrasi dengan ekosistem pendidikan nasional.',
      icon: Sparkles,
    },
  ]

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Vertical gold center line — desktop only */}
      <div
        className="hidden md:block absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-gradient-to-b from-[#cca72f]/10 via-[#cca72f]/60 to-[#cca72f]/10"
        aria-hidden
      />
      {/* Vertical gold left line — mobile */}
      <div
        className="md:hidden absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-[#cca72f]/10 via-[#cca72f]/60 to-[#cca72f]/10"
        aria-hidden
      />

      <div className="space-y-8 md:space-y-12">
        {milestones.map((m, idx) => {
          const isLeft = idx % 2 === 0
          const Icon = m.icon
          return (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: isLeft ? -40 : 40, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
              className={`relative flex items-center gap-4 md:gap-0 ${
                isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Marker dot on the timeline */}
              <div
                className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10"
                aria-hidden
              >
                <span className="block w-4 h-4 rotate-45 bg-[#cca72f] ring-4 ring-[#fbf9f5] shadow-md shadow-[#cca72f]/40">
                  <span className="block w-full h-full bg-[#ffe088] scale-[0.5] mt-[3px] ml-[3px]" />
                </span>
              </div>

              {/* Card */}
              <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                <div className="bg-[#ffffff] border border-[#e4e2de] rounded-2xl p-5 sm:p-6 shadow-premium wood-carved-shadow relative overflow-hidden">
                  {/* Gold top accent strip */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#cca72f] to-[#895033]" />
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#003527] to-[#064e3b] flex items-center justify-center shadow-md shadow-[#003527]/30">
                      <Icon className="h-6 w-6 text-[#ffe088]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#cca72f] text-2xl sm:text-3xl font-bold font-display leading-none">
                        {m.year}
                      </p>
                      <h4 className="mt-1 text-base sm:text-lg font-bold text-[#003527] font-display leading-tight">
                        {m.title}
                      </h4>
                      <p className="mt-2 text-xs sm:text-sm text-[#404944] leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer for the other side on desktop */}
              <div className="hidden md:block md:w-1/2" aria-hidden />
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10 flex justify-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#064e3b]/8 border border-[#064e3b]/15">
          <Award className="h-4 w-4 text-[#cca72f]" />
          <span className="text-xs font-semibold text-[#003527] uppercase tracking-wider">
            {currentYear - validStart}+ Tahun Mengabdi
          </span>
        </div>
      </motion.div>

      <KratonDivider variant="minimal" className="mt-8" />
    </div>
  )
}

export default MadrasahTimeline
