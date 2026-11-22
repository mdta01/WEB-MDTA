'use client'

/**
 * GaleriSection — premium gallery experience.
 *
 * Features:
 *  - Animated filter chips (icon + label + count) with emerald gradient
 *    + gold ring on active. Categories derived from data + Foto/Video type
 *    filters + separate year filter row.
 *  - Masonry layout (CSS columns + break-inside-avoid) with TiltCard 3D hover.
 *  - SmartImage with Cloudinary optimization (`{ width: 600, crop: 'fill' }}`).
 *  - Hover overlay: title + category badge + year + zoom icon + video play badge.
 *  - Stagger entrance animation via TiltCard's whileInView.
 *  - Premium lightbox: PremiumLightbox (separate component) with keyboard nav,
 *    zoom, caption, thumbnail strip, touch gestures.
 *  - Empty state via <EmptyState illustration="galeri">.
 */

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Calendar, ZoomIn, LayoutGrid, Camera, Video, Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KratonSectionHeader } from '@/components/kraton'
import { EmptyState } from '@/components/ui/empty-state'
import { TiltCard } from '@/components/ui/tilt-card'
import { SmartImage } from '@/components/ui/smart-image'
import { PremiumLightbox } from './galeri/PremiumLightbox'

type GalleryItem = {
  id: string
  title: string
  image: string
  category: string
  year?: string
  type: string
  description?: string
}

type ActiveFilter =
  | { kind: 'all' }
  | { kind: 'type'; value: 'photo' | 'video' }
  | { kind: 'category'; value: string }

type FilterChip =
  | { kind: 'all'; label: string; icon: LucideIcon; count: number }
  | { kind: 'type'; value: 'photo' | 'video'; label: string; icon: LucideIcon; count: number }
  | { kind: 'category'; value: string; label: string; icon: LucideIcon; count: number }

const categoryColors: Record<string, string> = {
  kegiatan: 'bg-[#003527] text-white',
  acara: 'bg-[#895033] text-white',
  tahunan: 'bg-[#064e3b] text-white',
}

function getCategoryColor(cat: string) {
  return categoryColors[cat] || 'bg-[#404944] text-white'
}

const gradientVariants = [
  'from-[#064e3b] to-[#003527]',
  'from-[#003527] to-[#064e3b]',
  'from-[#895033] to-[#a86644]',
  'from-[#064e3b] to-[#895033]',
]

// Treat both 'photo' (spec) and 'foto' (legacy DB default) as photo type
function isPhotoType(t: string) {
  return t === 'photo' || t === 'foto'
}
function isVideoType(t: string) {
  return t === 'video'
}

export default function GaleriSection() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ kind: 'all' })
  const [selectedYear, setSelectedYear] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => fetch('/api/gallery').then((r) => r.json()),
  })

  const allGallery: GalleryItem[] = Array.isArray(data) ? data : (data?.gallery || [])

  // Auto-populate years from gallery data (sorted desc)
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>()
    allGallery.forEach((item) => {
      if (item.year) yearSet.add(item.year)
    })
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a))
  }, [allGallery])

  // Clamp selectedYear in render in case data shrinks
  const safeSelectedYear = selectedYear && availableYears.includes(selectedYear) ? selectedYear : ''

  // Categories derived from data
  const dataCategories = useMemo(() => {
    const set = new Set<string>()
    allGallery.forEach((item) => set.add(item.category))
    return Array.from(set).sort()
  }, [allGallery])

  // Filter chips with counts
  const filterChips: FilterChip[] = useMemo(() => {
    const photoCount = allGallery.filter((i) => isPhotoType(i.type)).length
    const videoCount = allGallery.filter((i) => isVideoType(i.type)).length
    return [
      { kind: 'all', label: 'Semua', icon: LayoutGrid, count: allGallery.length },
      { kind: 'type', value: 'photo', label: 'Foto', icon: Camera, count: photoCount },
      { kind: 'type', value: 'video', label: 'Video', icon: Video, count: videoCount },
      ...dataCategories.map((cat) => ({
        kind: 'category' as const,
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: ImageIcon,
        count: allGallery.filter((i) => i.category === cat).length,
      })),
    ]
  }, [allGallery, dataCategories])

  // Filtered gallery (by active filter + year)
  const filteredGallery = useMemo(() => {
    return allGallery.filter((item) => {
      if (activeFilter.kind === 'type') {
        if (activeFilter.value === 'photo' && !isPhotoType(item.type)) return false
        if (activeFilter.value === 'video' && !isVideoType(item.type)) return false
      }
      if (activeFilter.kind === 'category' && item.category !== activeFilter.value) return false
      if (safeSelectedYear && item.year !== safeSelectedYear) return false
      return true
    })
  }, [allGallery, activeFilter, safeSelectedYear])

  const isChipActive = useCallback((chip: FilterChip): boolean => {
    if (chip.kind === 'all') return activeFilter.kind === 'all'
    if (chip.kind === 'type') return activeFilter.kind === 'type' && activeFilter.value === chip.value
    if (chip.kind === 'category') return activeFilter.kind === 'category' && activeFilter.value === chip.value
    return false
  }, [activeFilter])

  const hasActiveFilter = activeFilter.kind !== 'all' || !!safeSelectedYear

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <KratonSectionHeader
        badge="Dokumentasi"
        title="Galeri Kegiatan"
        align="center"
        subtitle={filteredGallery.length > 0 ? `${filteredGallery.length} foto` : undefined}
      />

      {/* === Filters === */}
      <div className="space-y-4">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {filterChips.map((chip) => {
            const Icon = chip.icon
            const active = isChipActive(chip)
            const key = chip.kind === 'all' ? 'all' : `${chip.kind}-${chip.value}`
            return (
              <motion.button
                key={key}
                layout
                onClick={() => {
                  if (chip.kind === 'all') setActiveFilter({ kind: 'all' })
                  else if (chip.kind === 'type') setActiveFilter({ kind: 'type', value: chip.value })
                  else setActiveFilter({ kind: 'category', value: chip.value })
                }}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -1 }}
                className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 font-body ${
                  active
                    ? 'bg-gradient-to-br from-[#064e3b] to-[#003527] text-white shadow-md shadow-[#003527]/30 ring-2 ring-[#cca72f] ring-offset-2 ring-offset-[#fbf9f5]'
                    : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#efeeea] border border-[#e4e2de]'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{chip.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums font-semibold ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-[#003527]/10 text-[#003527]/70'
                  }`}
                >
                  {chip.count}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Year filter (auto-populated from data) */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <span className="text-xs text-[#404944] font-medium flex items-center gap-1 mr-1 font-body">
              <Calendar className="h-3 w-3" /> Tahun:
            </span>
            <motion.button
              layout
              onClick={() => setSelectedYear('')}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-body ${
                safeSelectedYear === ''
                  ? 'bg-[#cca72f] text-white shadow-md shadow-[#cca72f]/30 ring-2 ring-[#cca72f]/40'
                  : 'bg-[#cca72f]/10 text-[#895033] hover:bg-[#cca72f]/20 border border-[#cca72f]/30'
              }`}
              aria-pressed={safeSelectedYear === ''}
            >
              Semua
            </motion.button>
            {availableYears.map((year) => (
              <motion.button
                key={year}
                layout
                onClick={() => setSelectedYear(year)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -1 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-body tabular-nums ${
                  safeSelectedYear === year
                    ? 'bg-[#cca72f] text-white shadow-md shadow-[#cca72f]/30 ring-2 ring-[#cca72f]/40'
                    : 'bg-[#cca72f]/10 text-[#895033] hover:bg-[#cca72f]/20 border border-[#cca72f]/30'
                }`}
                aria-pressed={safeSelectedYear === year}
              >
                {year}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* === Gallery Masonry Grid === */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filteredGallery.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {filteredGallery.map((item, idx) => (
            <TiltCard
              key={item.id}
              delay={Math.min(idx * 0.04, 0.4)}
              maxTilt={4}
              className="break-inside-avoid mb-4"
            >
              <div
                onClick={() => setLightboxIndex(idx)}
                className="relative overflow-hidden rounded-2xl border border-[#e4e2de] bg-[#064e3b] shadow-premium group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setLightboxIndex(idx)
                  }
                }}
                aria-label={`Buka ${item.title} di lightbox`}
              >
                {/* Image / video placeholder */}
                {isVideoType(item.type) ? (
                  <div
                    className={`aspect-video bg-gradient-to-br ${gradientVariants[idx % gradientVariants.length]} flex items-center justify-center`}
                  >
                    <Play
                      className="h-12 w-12 text-white/70 ml-1"
                      fill="currentColor"
                    />
                  </div>
                ) : (
                  <div className="overflow-hidden transition-transform duration-700 group-hover:scale-105">
                    <SmartImage
                      src={item.image}
                      fallbackSrc="/images/hero-madrasah.webp"
                      alt={item.title}
                      optimize={{ width: 600, crop: 'fill' }}
                      loading="lazy"
                      className="w-full h-auto block"
                    />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-2 font-body">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(item.category)}`}
                    >
                      {item.category}
                    </span>
                    {item.year && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium backdrop-blur-sm flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {item.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* Zoom icon (top-right, appears on hover) */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>

                {/* Video badge (top-left, always visible for video items) */}
                {isVideoType(item.type) && (
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#cca72f] flex items-center justify-center shadow-md shadow-[#cca72f]/40">
                    <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" />
                  </div>
                )}
              </div>
            </TiltCard>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="galeri"
          variant={hasActiveFilter ? 'search' : 'default'}
          searchQuery={
            hasActiveFilter
              ? [
                  activeFilter.kind === 'type'
                    ? activeFilter.value
                    : activeFilter.kind === 'category'
                      ? activeFilter.value
                      : '',
                  safeSelectedYear,
                ].filter(Boolean).join(' • ')
              : undefined
          }
          title={
            hasActiveFilter
              ? 'Tidak ada foto untuk filter ini'
              : 'Galeri masih kosong'
          }
          message={
            hasActiveFilter
              ? 'Coba ubah kategori atau tahun filter untuk menemukan foto yang Anda cari.'
              : 'Dokumentasi kegiatan madrasah akan tampil di sini setelah foto tersedia. Mari kembali berkunjung nanti.'
          }
        />
      )}

      {/* === Premium Lightbox === */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
          <PremiumLightbox
            items={filteredGallery}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={(newIndex) => setLightboxIndex(newIndex)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
