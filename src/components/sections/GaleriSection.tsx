'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Play, X, ChevronLeft, ChevronRight, Calendar, ZoomIn } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type GalleryItem = {
  id: string
  title: string
  image: string
  category: string
  year?: string
  type: string
}

const categories = [
  { value: '', label: 'Semua' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'acara', label: 'Acara' },
  { value: 'tahunan', label: 'Tahunan' },
]

const categoryColors: Record<string, string> = {
  kegiatan: 'bg-[#003527] text-white',
  acara: 'bg-[#895033] text-white',
  tahunan: 'bg-[#064e3b] text-white',
}

const gradientVariants = [
  'from-[#064e3b] to-[#003527]',
  'from-[#003527] to-[#064e3b]',
  'from-[#064e3b] to-[#003527]',
  'from-[#003527] to-[#064e3b]',
  'from-[#895033] to-[#a86644]',
  'from-[#064e3b] to-[#895033]',
]

export default function GaleriSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => fetch('/api/gallery').then(r => r.json()),
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

  // Clamp selectedYear in render (not in effect) in case data shrinks
  const safeSelectedYear = selectedYear && availableYears.includes(selectedYear) ? selectedYear : ''

  // Filtered gallery (client-side by category + year)
  const filteredGallery = useMemo(() => {
    return allGallery.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false
      if (safeSelectedYear && item.year !== safeSelectedYear) return false
      return true
    })
  }, [allGallery, selectedCategory, safeSelectedYear])

  // Lightbox navigation
  const goNext = useCallback(() => {
    setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % filteredGallery.length))
  }, [filteredGallery.length])

  const goPrev = useCallback(() => {
    setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + filteredGallery.length) % filteredGallery.length))
  }, [filteredGallery.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKey)
    // Lock body scroll when lightbox open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, goNext, goPrev])

  const closeLightbox = () => setLightboxIndex(null)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="inline-block px-3 py-0.5 rounded-full bg-[#064e3b]/15 text-[#003527] text-xs font-semibold uppercase tracking-wider mb-2"
        >
          Dokumentasi
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gradient-emerald"
        >
          Galeri
        </motion.h2>
        <div className="w-20 h-1 bg-gradient-to-r from-[#003527] to-[#cca72f] mx-auto mt-2 rounded-full" />
        {filteredGallery.length > 0 && (
          <p className="text-sm text-[#404944] mt-3">
            {filteredGallery.length} foto
          </p>
        )}
      </div>

      {/* Filters — Category + Year */}
      <div className="space-y-3">
        {/* Category */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === cat.value
                  ? 'bg-[#003527] text-white shadow-md shadow-[#003527]/30 scale-105'
                  : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#efeeea] hover:scale-105'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Year filter (auto-populated from data) */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <span className="text-xs text-[#404944] font-medium flex items-center gap-1 mr-1">
              <Calendar className="h-3 w-3" /> Tahun:
            </span>
            <button
              onClick={() => setSelectedYear('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                safeSelectedYear === ''
                  ? 'bg-[#cca72f] text-white shadow-md scale-105'
                  : 'bg-[#cca72f]/10 text-[#895033] hover:bg-[#cca72f]/20 hover:scale-105'
              }`}
            >
              Semua
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  safeSelectedYear === year
                    ? 'bg-[#cca72f] text-white shadow-md scale-105'
                    : 'bg-[#cca72f]/10 text-[#895033] hover:bg-[#cca72f]/20 hover:scale-105'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Masonry Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filteredGallery.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {filteredGallery.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.5 }}
              className="break-inside-avoid mb-4 cursor-pointer group"
              onClick={() => setLightboxIndex(idx)}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-premium card-hover bg-[#f5f3ef]">
                {item.type === 'video' ? (
                  <div className={`aspect-video bg-gradient-to-br ${gradientVariants[idx % gradientVariants.length]} flex items-center justify-center`}>
                    <Play className="h-12 w-12 text-white/70" />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-2">{item.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || 'bg-[#404944] text-white'}`}>
                      {item.category}
                    </span>
                    {item.year && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium backdrop-blur-sm">
                        {item.year}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#064e3b]/10 mb-4">
            <ImageIcon className="h-10 w-10 text-[#064e3b]/50" />
          </div>
          <p className="text-[#404944]">Belum ada foto untuk filter ini</p>
        </div>
      )}

      {/* Premium Lightbox with swipe + keyboard nav */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {filteredGallery.length}
            </div>

            {/* Prev button (desktop) */}
            {filteredGallery.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next button (desktop) */}
            {filteredGallery.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Image with swipe (framer-motion drag) */}
            <motion.div
              key={filteredGallery[lightboxIndex].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              drag={filteredGallery.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(event, info) => {
                // Swipe threshold: 100px horizontal
                if (info.offset.x < -100) goNext()
                else if (info.offset.x > 100) goPrev()
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            >
              <img
                src={filteredGallery[lightboxIndex].image}
                alt={filteredGallery[lightboxIndex].title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                draggable={false}
              />
              {/* Caption */}
              <div className="mt-4 text-center px-4 max-w-2xl">
                <h3 className="text-white font-semibold text-lg mb-2">{filteredGallery[lightboxIndex].title}</h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${categoryColors[filteredGallery[lightboxIndex].category] || 'bg-[#404944] text-white'}`}>
                    {filteredGallery[lightboxIndex].category}
                  </span>
                  {filteredGallery[lightboxIndex].year && (
                    <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white font-medium backdrop-blur-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {filteredGallery[lightboxIndex].year}
                    </span>
                  )}
                </div>
                {filteredGallery.length > 1 && (
                  <p className="text-white/50 text-xs mt-3">
                    Geser untuk navigasi • ← → untuk panah • ESC untuk tutup
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
