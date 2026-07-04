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
  kegiatan: 'bg-emerald-600 text-white',
  acara: 'bg-amber-600 text-white',
  tahunan: 'bg-teal-600 text-white',
}

const gradientVariants = [
  'from-emerald-400 to-teal-600',
  'from-emerald-500 to-emerald-700',
  'from-teal-400 to-emerald-600',
  'from-emerald-600 to-teal-800',
  'from-amber-400 to-amber-600',
  'from-emerald-400 to-cyan-600',
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Galeri</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        {filteredGallery.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Year filter (auto-populated from data) */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mr-1">
              <Calendar className="h-3 w-3" /> Tahun:
            </span>
            <button
              onClick={() => setSelectedYear('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                safeSelectedYear === ''
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Semua
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  safeSelectedYear === year
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
              className="break-inside-avoid mb-4 cursor-pointer group"
              onClick={() => setLightboxIndex(idx)}
            >
              <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 bg-gray-100">
                {item.type === 'video' ? (
                  <div className={`aspect-video bg-gradient-to-br ${gradientVariants[idx % gradientVariants.length]} flex items-center justify-center`}>
                    <Play className="h-12 w-12 text-white/70" />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-2">{item.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || 'bg-gray-600 text-white'}`}>
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-4">
            <ImageIcon className="h-10 w-10 text-emerald-300" />
          </div>
          <p className="text-gray-500">Belum ada foto untuk filter ini</p>
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
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${categoryColors[filteredGallery[lightboxIndex].category] || 'bg-gray-600 text-white'}`}>
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
