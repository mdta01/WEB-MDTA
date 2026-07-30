'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { KratonDivider } from './KratonDivider'

/**
 * KratonSectionHeader — Judul section reusable untuk konsistensi visual.
 *
 * Struktur (atas ke bawah):
 *  1. Badge pill (opsional) — kapsul emerald-transparan, label uppercase tracking-wider
 *  2. Judul (wajib) — Playfair Display (auto via globals.css h2), text-gradient emerald→gold
 *  3. Ornamen Jawa — KratonDivider (diamond emas)
 *  4. Subjudul (opsional) — Montserrat, muted-foreground
 *
 * Alignment:
 *  - center (default) — untuk section publik (Berita, Galeri, dll)
 *  - left — untuk section dengan layout samping (kontak, detail)
 *
 * Animasi: staggered fade-up via framer-motion whileInView (sekali jalan).
 *
 * Contoh pemakaian:
 *   <KratonSectionHeader
 *     badge="Informasi Publik"
 *     title="Berita & Kegiatan"
 *     subtitle="Menampilkan 5 berita terbaru"
 *   />
 */
type KratonSectionHeaderProps = {
  /** Label kecil di atas judul (mis. "Informasi Publik"). Kosongkan untuk skip. */
  badge?: ReactNode
  /** Judul utama. Bisa string atau ReactNode (untuk highlight kata tertentu). */
  title: ReactNode
  /** Deskripsi pendek di bawah ornamen. */
  subtitle?: ReactNode
  /** Penjajaran: center (default) atau left. */
  align?: 'center' | 'left'
  /** Varian ornamen: full (default), line, atau minimal. */
  ornament?: 'full' | 'line' | 'minimal'
  /** Sembunyikan ornamen pembatas. */
  hideOrnament?: boolean
  /** Ukuran judul. Default "default" (text-2xl md:text-3xl). */
  size?: 'sm' | 'default' | 'lg'
  /** Kelas tambahan untuk wrapper. */
  className?: string
}

const titleSizeClass: Record<NonNullable<KratonSectionHeaderProps['size']>, string> = {
  sm: 'text-xl md:text-2xl',
  default: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl lg:text-5xl',
}

export function KratonSectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
  ornament = 'full',
  hideOrnament = false,
  size = 'default',
  className,
}: KratonSectionHeaderProps) {
  const isCenter = align === 'center'

  return (
    <div
      className={cn(
        'mb-8',
        isCenter ? 'text-center' : 'text-left',
        className,
      )}
    >
      {/* Badge pill */}
      {badge && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className={cn(
            'inline-block px-3 py-0.5 rounded-full',
            'bg-[#064e3b]/15 text-[#003527]',
            'text-xs font-semibold uppercase tracking-wider mb-2',
            'font-body border border-[#064e3b]/20',
          )}
        >
          {badge}
        </motion.span>
      )}

      {/* Judul — Playfair Display via globals h2 rule, gradient emerald */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: badge ? 0.05 : 0 }}
        className={cn(
          'font-bold text-gradient-emerald leading-tight',
          titleSizeClass[size],
        )}
      >
        {title}
      </motion.h2>

      {/* Ornamen Jawa */}
      {!hideOrnament && (
        <KratonDivider
          variant={ornament}
          align={align}
          className={cn('mt-3', isCenter ? '' : 'w-max')}
        />
      )}

      {/* Subjudul */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            'text-sm text-[#404944] mt-3 max-w-2xl',
            isCenter ? 'mx-auto' : '',
            'font-body',
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

export default KratonSectionHeader
