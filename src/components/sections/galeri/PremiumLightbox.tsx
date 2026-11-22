'use client'

/**
 * PremiumLightbox — premium photo-viewing experience.
 *
 * Inspired by Apple Photos / Google Photos:
 *  - Keyboard nav: ← → for prev/next, Esc to close, +/- zoom, 0 reset, i toggle info
 *  - Click image to cycle zoom (1x → 1.5x → 2x → 3x → 1x)
 *  - Mouse wheel: ctrl+wheel to zoom (browser-standard)
 *  - Drag to pan when zoomed; drag horizontally to swipe when at 1x
 *  - Double-tap/click to toggle zoom (1x ↔ 2x)
 *  - Caption overlay (toggle via Info button) with title + category + year + description
 *  - Horizontal thumbnail strip with auto-scroll to current item, gold ring on active
 *  - Counter "3 dari 24"
 *  - Touch: swipe left/right for prev/next, double-tap to zoom
 *  - Dark backdrop with blur, click outside image to close
 *  - Direction-aware slide transitions between images
 *
 * Cloudinary optimization applied via getCloudinaryUrl (raw <img> used here for
 * fine-grained control over max-width / object-contain / pan — SmartImage's
 * wrapper background would clash with the dark backdrop).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Info,
  Play, Calendar, RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCloudinaryUrl } from '@/lib/cloudinary'

export type LightboxGalleryItem = {
  id: string
  title: string
  image: string
  type: string
  category: string
  year?: string
  description?: string
}

const ZOOM_LEVELS = [1, 1.5, 2, 3] as const
const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1]

const categoryColors: Record<string, string> = {
  kegiatan: 'bg-[#003527] text-white',
  acara: 'bg-[#895033] text-white',
  tahunan: 'bg-[#064e3b] text-white',
}

function getCategoryColor(cat: string) {
  return categoryColors[cat] || 'bg-[#404944] text-white'
}

function isVideoType(t: string) {
  return t === 'video'
}

type PremiumLightboxProps = {
  items: LightboxGalleryItem[]
  index: number
  onClose: () => void
  onNavigate: (newIndex: number) => void
}

export function PremiumLightbox({ items, index, onClose, onNavigate }: PremiumLightboxProps) {
  const [direction, setDirection] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showInfo, setShowInfo] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [prevIndex, setPrevIndex] = useState(index)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])
  const draggedRef = useRef(false)
  const lastTapRef = useRef(0)

  const current = items[index]
  const total = items.length

  // Reset zoom + pan + loaded flag when index changes.
  // Use the "store previous prop" pattern (React-recommended) instead of
  // useEffect+setState which triggers cascading-render lint error.
  // See: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (prevIndex !== index) {
    setPrevIndex(index)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setImageLoaded(false)
  }

  const goNext = useCallback(() => {
    if (total <= 1) return
    setDirection(1)
    onNavigate((index + 1) % total)
  }, [index, total, onNavigate])

  const goPrev = useCallback(() => {
    if (total <= 1) return
    setDirection(-1)
    onNavigate((index - 1 + total) % total)
  }, [index, total, onNavigate])

  const cycleZoom = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z as typeof ZOOM_LEVELS[number])
      const nextIdx = (idx + 1) % ZOOM_LEVELS.length
      const nextZoom = ZOOM_LEVELS[nextIdx]
      if (nextZoom === 1) setPan({ x: 0, y: 0 })
      return nextZoom
    })
  }, [])

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z as typeof ZOOM_LEVELS[number])
      if (idx >= ZOOM_LEVELS.length - 1) return z
      return ZOOM_LEVELS[idx + 1]
    })
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z as typeof ZOOM_LEVELS[number])
      if (idx <= 0) return 1
      const nextZoom = ZOOM_LEVELS[idx - 1]
      if (nextZoom === 1) setPan({ x: 0, y: 0 })
      return nextZoom
    })
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); goNext(); break
        case 'ArrowLeft': e.preventDefault(); goPrev(); break
        case 'Escape': onClose(); break
        case '+': case '=': zoomIn(); break
        case '-': case '_': zoomOut(); break
        case '0': resetZoom(); break
        case 'i': case 'I': setShowInfo((s) => !s); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose, zoomIn, zoomOut, resetZoom])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    const el = thumbnailRefs.current[index]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [index])

  // Ctrl+wheel to zoom (desktop standard)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }, [zoomIn, zoomOut])

  // Drag end: pan (when zoomed) or swipe (when at 1x)
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (zoom > 1) {
      setPan((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))
    } else {
      const threshold = 80
      if (info.offset.x < -threshold) goNext()
      else if (info.offset.x > threshold) goPrev()
    }
    // Reset draggedRef on next tick so onClick can detect "was drag, not tap"
    requestAnimationFrame(() => { draggedRef.current = false })
  }, [zoom, goNext, goPrev])

  // Direction-aware slide variants
  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 60 : dir < 0 ? -60 : 0,
      scale: 0.96,
    }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -60 : dir < 0 ? 60 : 0,
      scale: 0.96,
    }),
  }

  if (!current) return null

  const isVideo = isVideoType(current.type)
  const isZoomed = zoom > 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Galeri lightbox"
    >
      {/* === Top bar === */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 sm:p-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          aria-label="Tutup (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Counter */}
        <div className="bg-white/10 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full font-medium tabular-nums font-body">
          {index + 1}
          <span className="opacity-60 mx-1">dari</span>
          {total}
        </div>

        <button
          onClick={() => setShowInfo((s) => !s)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm ${
            showInfo ? 'bg-[#cca72f] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          aria-label="Info (i)"
          aria-pressed={showInfo}
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      {/* === Main image area === */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onClick={(e) => {
          // Click backdrop (not image) → close
          if (e.target === e.currentTarget) onClose()
        }}
        onWheel={handleWheel}
      >
        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Sebelumnya (←)"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Berikutnya (→)"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            drag={isZoomed ? true : (total > 1 ? 'x' : false)}
            dragConstraints={isZoomed
              ? { left: -300, right: 300, top: -300, bottom: 300 }
              : { left: 0, right: 0 }}
            dragElastic={0.4}
            onDragStart={() => { draggedRef.current = true }}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (draggedRef.current) return
              const now = Date.now()
              if (now - lastTapRef.current < 300) {
                // Double tap: toggle 1x ↔ 2x
                if (zoom === 1) setZoom(2)
                else resetZoom()
                lastTapRef.current = 0
              } else {
                // Single tap: cycle zoom (1x → 1.5x → 2x → 3x → 1x)
                if (!isVideo) cycleZoom()
                lastTapRef.current = now
              }
            }}
            className="relative select-none"
            style={{ cursor: isZoomed ? 'grab' : 'zoom-in' }}
          >
            {isVideo ? (
              <div className="relative w-[80vw] max-w-4xl aspect-video bg-gradient-to-br from-[#064e3b] to-[#003527] flex items-center justify-center rounded-lg overflow-hidden">
                <div className="text-center text-white p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#cca72f] flex items-center justify-center shadow-lg shadow-[#cca72f]/30">
                    <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                  </div>
                  <p className="font-display text-lg mb-1">{current.title}</p>
                  <p className="text-sm opacity-70">Konten video</p>
                </div>
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <img
                  src={getCloudinaryUrl(current.image, { width: 1200, crop: 'limit' })}
                  alt={current.title}
                  className="max-w-[88vw] max-h-[78vh] object-contain block"
                  draggable={false}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* === Caption overlay === */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-10 max-w-2xl w-full px-4 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
                  <Badge className={`${getCategoryColor(current.category)} border-0 rounded-full`}>
                    {current.category}
                  </Badge>
                  {current.year && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {current.year}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-white text-lg sm:text-xl font-semibold text-center mb-1">
                  {current.title}
                </h3>
                {current.description && (
                  <p className="text-white/70 text-sm text-center leading-relaxed font-body">
                    {current.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === Bottom: zoom controls + thumbnail strip === */}
      <div className="relative z-20 pb-3 sm:pb-5 px-4 space-y-3">
        {/* Zoom controls */}
        {!isVideo && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={zoomOut}
              disabled={zoom <= 1}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Zoom out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-full font-medium tabular-nums min-w-[64px] text-center font-body">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Zoom in (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={resetZoom}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Reset zoom (0)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Thumbnail strip */}
        {total > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  ref={(el) => { thumbnailRefs.current[i] = el }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDirection(i > index ? 1 : -1)
                    onNavigate(i)
                  }}
                  className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden transition-all ${
                    i === index
                      ? 'ring-2 ring-[#cca72f] ring-offset-2 ring-offset-black opacity-100'
                      : 'opacity-50 hover:opacity-90 ring-1 ring-white/10'
                  }`}
                  aria-label={`Foto ${i + 1}`}
                  aria-current={i === index}
                >
                  {isVideoType(item.type) ? (
                    <div className="w-full h-full bg-gradient-to-br from-[#064e3b] to-[#003527] flex items-center justify-center">
                      <Play className="h-3 w-3 text-white/80" fill="currentColor" />
                    </div>
                  ) : (
                    <img
                      src={getCloudinaryUrl(item.image, { width: 200, crop: 'fill' })}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help text */}
        <p className="text-white/40 text-[10px] sm:text-xs text-center font-body">
          Klik untuk zoom • ← → navigasi • Esc tutup • +/− zoom • 0 reset • i info
        </p>
      </div>
    </motion.div>
  )
}
