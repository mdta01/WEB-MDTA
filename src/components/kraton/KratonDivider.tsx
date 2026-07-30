'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * KratonDivider — Ornamen pembatas Jawa yang reusable.
 *
 * Dua garis emas yang menyempit ke tengah, dengan motif berlian (diamond)
 * khas ornamen Kraton di tengahnya. Dipakai sebagai pemisah antar blok konten
 * atau di bawah judul section untuk memberi sentuhan klasik Islam-Jawa.
 *
 * Variasi:
 *  - variant="line"    : hanya garis emas tipis dengan diamond kecil di tengah
 *  - variant="full"    : dua garis menyempit + diamond besar + titik emas
 *  - variant="minimal" : diamond tunggal tanpa garis (subtle separator)
 */
type KratonDividerProps = {
  variant?: 'line' | 'full' | 'minimal'
  align?: 'center' | 'left'
  className?: string
  animated?: boolean
}

export function KratonDivider({
  variant = 'full',
  align = 'center',
  className,
  animated = true,
}: KratonDividerProps) {
  const wrapperAlign = align === 'center' ? 'justify-center' : 'justify-start'

  const content = (
    <>
      {variant === 'full' && (
        <>
          {/* Garis kiri menyempit */}
          <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#cca72f]" />
          {/* Titik emas kecil */}
          <span className="h-1 w-1 rounded-full bg-[#cca72f]" />
        </>
      )}

      {/* Berlian (diamond) — motif khas Kraton */}
      <span
        className={cn(
          'relative inline-block rotate-45',
          variant === 'full' ? 'h-2.5 w-2.5' : 'h-2 w-2',
        )}
        aria-hidden
      >
        <span className="absolute inset-0 bg-[#cca72f]" />
        <span className="absolute inset-[2px] bg-[#ffe088]" />
      </span>

      {variant === 'full' && (
        <>
          <span className="h-1 w-1 rounded-full bg-[#cca72f]" />
          {/* Garis kanan menyempit */}
          <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#cca72f]" />
        </>
      )}

      {variant === 'line' && (
        <>
          <span className="h-px w-12 bg-gradient-to-r from-[#cca72f] to-transparent" />
          <span className="h-px w-12 bg-gradient-to-l from-[#cca72f] to-transparent" />
        </>
      )}
    </>
  )

  if (!animated) {
    return (
      <div className={cn('flex items-center gap-2', wrapperAlign, className)} aria-hidden>
        {content}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn('flex items-center gap-2', wrapperAlign, className)}
      aria-hidden
    >
      {content}
    </motion.div>
  )
}

export default KratonDivider
