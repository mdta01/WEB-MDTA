'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * EmptyState — premium empathic empty state component.
 *
 * Replaces the old pattern of `<p>Belum ada berita</p>` with a card that:
 * 1. Has a custom SVG illustration (NOT a generic Lucide icon) — feels brand-specific
 * 2. Acknowledges the situation with a contextual title
 * 3. Gives hope / context with a descriptive message
 * 4. Provides an actionable CTA (primary + optional secondary)
 *
 * Variants:
 * - 'default'  : standard card with SVG illustration (most sections)
 * - 'compact'  : smaller version for inline empty states (calendar, sub-sections)
 * - 'search'   : for search/filter no-results (shows query context)
 * - 'error'    : for API failures (retry CTA)
 *
 * Usage:
 * <EmptyState
 *   illustration="berita"  // see ILLUSTRATIONS map below
 *   title="Belum ada berita untuk kategori ini"
 *   message="Tim redaksi kami sedang merangkai kisah inspiratif untuk dibagikan."
 *   actionLabel="Lihat semua berita"
 *   onAction={() => navigate('berita')}
 * />
 */

// === Custom SVG Illustrations ===
// Each is a hand-crafted SVG that matches the emerald + gold brand palette.
// NOT generic Lucide icons — these are unique to this madrasah website.

const IllustrationBerita = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Newspaper/document shape */}
    <rect x="25" y="20" width="70" height="85" rx="6" fill="#064e3b" opacity="0.1" />
    <rect x="25" y="20" width="70" height="85" rx="6" stroke="#064e3b" strokeWidth="2" opacity="0.3" />
    {/* Folded corner */}
    <path d="M75 20 L95 20 L95 40 Z" fill="#064e3b" opacity="0.15" />
    {/* Lines representing text */}
    <rect x="35" y="38" width="40" height="3" rx="1.5" fill="#cca72f" opacity="0.6" />
    <rect x="35" y="48" width="50" height="2" rx="1" fill="#064e3b" opacity="0.2" />
    <rect x="35" y="55" width="45" height="2" rx="1" fill="#064e3b" opacity="0.2" />
    <rect x="35" y="62" width="48" height="2" rx="1" fill="#064e3b" opacity="0.2" />
    {/* Image placeholder */}
    <rect x="35" y="72" width="25" height="20" rx="3" fill="#cca72f" opacity="0.15" />
    <circle cx="42" cy="79" r="3" fill="#cca72f" opacity="0.4" />
    <path d="M35 92 L45 82 L52 88 L60 80 L60 92 Z" fill="#cca72f" opacity="0.3" />
    {/* Feather pen accent */}
    <path d="M82 75 Q88 70 92 76 Q88 80 84 78 Z" fill="#cca72f" opacity="0.5" />
  </svg>
)

const IllustrationDakwah = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Open book (Quran-like) */}
    <path d="M20 35 Q20 30 25 30 L55 32 L55 90 L25 88 Q20 88 20 83 Z" fill="#064e3b" opacity="0.1" />
    <path d="M100 35 Q100 30 95 30 L65 32 L65 90 L95 88 Q100 88 100 83 Z" fill="#064e3b" opacity="0.1" />
    <path d="M20 35 Q20 30 25 30 L55 32 L55 90 L25 88 Q20 88 20 83 Z" stroke="#064e3b" strokeWidth="1.5" opacity="0.4" />
    <path d="M100 35 Q100 30 95 30 L65 32 L65 90 L95 88 Q100 88 100 83 Z" stroke="#064e3b" strokeWidth="1.5" opacity="0.4" />
    {/* Center spine */}
    <line x1="60" y1="32" x2="60" y2="90" stroke="#064e3b" strokeWidth="2" opacity="0.3" />
    {/* Arabic-like lines (decorative) */}
    <path d="M28 42 Q35 40 42 42 M28 48 Q35 46 42 48 M28 54 Q35 52 42 54" stroke="#cca72f" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    <path d="M78 42 Q85 40 92 42 M78 48 Q85 46 92 48 M78 54 Q85 52 92 54" stroke="#cca72f" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    {/* Star accent */}
    <path d="M60 22 L62 28 L68 28 L63 32 L65 38 L60 34 L55 38 L57 32 L52 28 L58 28 Z" fill="#cca72f" opacity="0.7" />
  </svg>
)

const IllustrationGaleri = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Photo stack */}
    <rect x="28" y="28" width="55" height="42" rx="4" fill="#064e3b" opacity="0.08" transform="rotate(-8 55 49)" />
    <rect x="35" y="32" width="55" height="42" rx="4" fill="#064e3b" opacity="0.12" transform="rotate(-3 62 53)" />
    <rect x="32" y="35" width="55" height="42" rx="4" fill="#cca72f" opacity="0.1" />
    <rect x="32" y="35" width="55" height="42" rx="4" stroke="#cca72f" strokeWidth="1.5" opacity="0.5" />
    {/* Mountain + sun inside frame */}
    <circle cx="48" cy="48" r="5" fill="#cca72f" opacity="0.6" />
    <path d="M32 70 L45 58 L55 66 L65 54 L87 70 Z" fill="#064e3b" opacity="0.3" />
    {/* Play badge */}
    <circle cx="85" cy="78" r="14" fill="#003527" opacity="0.9" />
    <path d="M82 73 L82 83 L91 78 Z" fill="#ffe088" />
  </svg>
)

const IllustrationPrestasi = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Trophy cup */}
    <path d="M45 30 L75 30 L73 55 Q73 65 60 65 Q47 65 47 55 Z" fill="#cca72f" opacity="0.2" />
    <path d="M45 30 L75 30 L73 55 Q73 65 60 65 Q47 65 47 55 Z" stroke="#cca72f" strokeWidth="2" opacity="0.6" />
    {/* Handles */}
    <path d="M45 35 Q35 35 35 45 Q35 52 42 52" stroke="#cca72f" strokeWidth="2" opacity="0.5" fill="none" />
    <path d="M75 35 Q85 35 85 45 Q85 52 78 52" stroke="#cca72f" strokeWidth="2" opacity="0.5" fill="none" />
    {/* Star inside */}
    <path d="M60 38 L62 44 L68 44 L63 48 L65 54 L60 50 L55 54 L57 48 L52 44 L58 44 Z" fill="#cca72f" opacity="0.8" />
    {/* Stem */}
    <rect x="57" y="65" width="6" height="10" fill="#cca72f" opacity="0.5" />
    {/* Base */}
    <rect x="48" y="75" width="24" height="6" rx="2" fill="#cca72f" opacity="0.6" />
    <rect x="44" y="81" width="32" height="5" rx="2" fill="#064e3b" opacity="0.4" />
    {/* Sparkles */}
    <circle cx="35" cy="25" r="2" fill="#ffe088" opacity="0.7" />
    <circle cx="85" cy="22" r="1.5" fill="#ffe088" opacity="0.6" />
    <circle cx="90" cy="60" r="2" fill="#ffe088" opacity="0.5" />
  </svg>
)

const IllustrationAlumni = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Graduation cap */}
    <path d="M60 30 L95 42 L60 54 L25 42 Z" fill="#064e3b" opacity="0.15" />
    <path d="M60 30 L95 42 L60 54 L25 42 Z" stroke="#064e3b" strokeWidth="2" opacity="0.4" />
    {/* Cap base */}
    <path d="M42 46 L42 58 Q42 65 60 65 Q78 65 78 58 L78 46" fill="#064e3b" opacity="0.1" />
    <path d="M42 46 L42 58 Q42 65 60 65 Q78 65 78 58 L78 46" stroke="#064e3b" strokeWidth="2" opacity="0.4" fill="none" />
    {/* Tassel */}
    <line x1="90" y1="42" x2="90" y2="58" stroke="#cca72f" strokeWidth="2" opacity="0.6" />
    <circle cx="90" cy="62" r="3" fill="#cca72f" opacity="0.8" />
    {/* People silhouettes */}
    <circle cx="40" cy="85" r="6" fill="#064e3b" opacity="0.3" />
    <path d="M30 100 Q30 92 40 92 Q50 92 50 100 Z" fill="#064e3b" opacity="0.3" />
    <circle cx="60" cy="85" r="6" fill="#cca72f" opacity="0.4" />
    <path d="M50 100 Q50 92 60 92 Q70 92 70 100 Z" fill="#cca72f" opacity="0.4" />
    <circle cx="80" cy="85" r="6" fill="#064e3b" opacity="0.3" />
    <path d="M70 100 Q70 92 80 92 Q90 92 90 100 Z" fill="#064e3b" opacity="0.3" />
  </svg>
)

const IllustrationPengumuman = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Megaphone */}
    <path d="M25 50 L70 35 L70 75 L25 60 Z" fill="#064e3b" opacity="0.12" />
    <path d="M25 50 L70 35 L70 75 L25 60 Z" stroke="#064e3b" strokeWidth="2" opacity="0.4" />
    {/* Handle */}
    <rect x="20" y="48" width="8" height="14" rx="2" fill="#064e3b" opacity="0.3" />
    <rect x="18" y="50" width="4" height="10" rx="1" fill="#cca72f" opacity="0.5" />
    {/* Sound waves */}
    <path d="M78 42 Q85 50 78 58" stroke="#cca72f" strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
    <path d="M85 38 Q96 50 85 62" stroke="#cca72f" strokeWidth="2" opacity="0.3" fill="none" strokeLinecap="round" />
    {/* Star */}
    <path d="M60 45 L61.5 49 L65.5 49 L62.5 51.5 L63.5 55.5 L60 53 L56.5 55.5 L57.5 51.5 L54.5 49 L58.5 49 Z" fill="#cca72f" opacity="0.8" />
  </svg>
)

const IllustrationDownload = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Folder */}
    <path d="M25 40 L45 40 L50 45 L95 45 Q100 45 100 50 L100 85 Q100 90 95 90 L25 90 Q20 90 20 85 L20 45 Q20 40 25 40 Z" fill="#064e3b" opacity="0.1" />
    <path d="M25 40 L45 40 L50 45 L95 45 Q100 45 100 50 L100 85 Q100 90 95 90 L25 90 Q20 90 20 85 L20 45 Q20 40 25 40 Z" stroke="#064e3b" strokeWidth="2" opacity="0.3" />
    {/* Download arrow */}
    <path d="M60 55 L60 72" stroke="#cca72f" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <path d="M52 65 L60 73 L68 65" stroke="#cca72f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    {/* Tray */}
    <rect x="48" y="75" width="24" height="4" rx="2" fill="#cca72f" opacity="0.6" />
  </svg>
)

const IllustrationProfil = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Building/madrasah silhouette */}
    <path d="M40 70 L40 50 L55 40 L55 35 L65 35 L65 40 L80 50 L80 70 Z" fill="#064e3b" opacity="0.12" />
    <path d="M40 70 L40 50 L55 40 L55 35 L65 35 L65 40 L80 50 L80 70 Z" stroke="#064e3b" strokeWidth="2" opacity="0.4" />
    {/* Dome */}
    <path d="M50 40 Q60 28 70 40" stroke="#cca72f" strokeWidth="2" fill="none" opacity="0.6" />
    <circle cx="60" cy="30" r="2" fill="#cca72f" opacity="0.8" />
    <line x1="60" y1="28" x2="60" y2="24" stroke="#cca72f" strokeWidth="1.5" opacity="0.6" />
    {/* Windows */}
    <rect x="46" y="55" width="6" height="8" rx="1" fill="#cca72f" opacity="0.3" />
    <rect x="57" y="55" width="6" height="8" rx="1" fill="#cca72f" opacity="0.3" />
    <rect x="68" y="55" width="6" height="8" rx="1" fill="#cca72f" opacity="0.3" />
    {/* Door */}
    <path d="M55 70 L55 80 Q55 82 57 82 L63 82 Q65 82 65 80 L65 70 Z" fill="#064e3b" opacity="0.4" />
    {/* Ground */}
    <line x1="25" y1="82" x2="95" y2="82" stroke="#064e3b" strokeWidth="2" opacity="0.2" />
  </svg>
)

const IllustrationPPDB = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Calendar */}
    <rect x="30" y="30" width="60" height="60" rx="6" fill="#064e3b" opacity="0.1" />
    <rect x="30" y="30" width="60" height="60" rx="6" stroke="#064e3b" strokeWidth="2" opacity="0.3" />
    {/* Calendar top bar */}
    <rect x="30" y="30" width="60" height="14" rx="6" fill="#cca72f" opacity="0.3" />
    <rect x="30" y="38" width="60" height="6" fill="#cca72f" opacity="0.3" />
    {/* Rings */}
    <rect x="42" y="24" width="4" height="12" rx="2" fill="#064e3b" opacity="0.5" />
    <rect x="74" y="24" width="4" height="12" rx="2" fill="#064e3b" opacity="0.5" />
    {/* Checkmark */}
    <path d="M48 60 L55 67 L72 50" stroke="#cca72f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
  </svg>
)

const IllustrationSearch = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Magnifying glass */}
    <circle cx="55" cy="55" r="25" fill="#064e3b" opacity="0.08" />
    <circle cx="55" cy="55" r="25" stroke="#064e3b" strokeWidth="3" opacity="0.4" />
    <line x1="73" y1="73" x2="92" y2="92" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    {/* Question mark inside */}
    <path d="M48 48 Q48 42 55 42 Q62 42 62 48 Q62 53 55 55 L55 60" stroke="#cca72f" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
    <circle cx="55" cy="65" r="1.5" fill="#cca72f" opacity="0.7" />
  </svg>
)

const IllustrationCalendar = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Calendar mini */}
    <rect x="35" y="40" width="50" height="45" rx="4" fill="#064e3b" opacity="0.08" />
    <rect x="35" y="40" width="50" height="45" rx="4" stroke="#064e3b" strokeWidth="1.5" opacity="0.3" />
    <rect x="35" y="40" width="50" height="10" rx="4" fill="#cca72f" opacity="0.2" />
    {/* Rings */}
    <rect x="44" y="35" width="3" height="10" rx="1.5" fill="#064e3b" opacity="0.4" />
    <rect x="73" y="35" width="3" height="10" rx="1.5" fill="#064e3b" opacity="0.4" />
    {/* Empty day cells */}
    <rect x="42" y="55" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    <rect x="54" y="55" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    <rect x="66" y="55" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    <rect x="42" y="67" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    <rect x="54" y="67" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    <rect x="66" y="67" width="8" height="8" rx="1" fill="#064e3b" opacity="0.08" />
    {/* Small sparkle indicating "coming soon" */}
    <path d="M85 35 L86 38 L89 38 L86.5 40 L87.5 43 L85 41 L82.5 43 L83.5 40 L81 38 L84 38 Z" fill="#cca72f" opacity="0.7" />
  </svg>
)

const IllustrationDefault = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Decorative box */}
    <rect x="35" y="35" width="50" height="50" rx="8" fill="#064e3b" opacity="0.08" stroke="#064e3b" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4" />
    {/* Gold accent diamond */}
    <path d="M60 45 L67 52 L60 59 L53 52 Z" fill="#cca72f" opacity="0.3" />
    <path d="M60 45 L67 52 L60 59 L53 52 Z" stroke="#cca72f" strokeWidth="1.5" opacity="0.5" />
    {/* Sparkles */}
    <circle cx="42" cy="42" r="1.5" fill="#ffe088" opacity="0.6" />
    <circle cx="78" cy="78" r="1.5" fill="#ffe088" opacity="0.6" />
    <circle cx="78" cy="42" r="1.5" fill="#ffe088" opacity="0.4" />
    <circle cx="42" cy="78" r="1.5" fill="#ffe088" opacity="0.4" />
  </svg>
)

const ILLUSTRATIONS: Record<string, () => React.ReactElement> = {
  berita: IllustrationBerita,
  dakwah: IllustrationDakwah,
  galeri: IllustrationGaleri,
  prestasi: IllustrationPrestasi,
  alumni: IllustrationAlumni,
  pengumuman: IllustrationPengumuman,
  download: IllustrationDownload,
  profil: IllustrationProfil,
  ppdb: IllustrationPPDB,
  search: IllustrationSearch,
  calendar: IllustrationCalendar,
  default: IllustrationDefault,
}

type EmptyStateProps = {
  illustration?: keyof typeof ILLUSTRATIONS | 'default'
  icon?: LucideIcon  // fallback Lucide icon if no illustration
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: 'default' | 'compact' | 'search' | 'error'
  className?: string
  /** Search query — shown in 'search' variant */
  searchQuery?: string
}

export function EmptyState({
  illustration = 'default',
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  className = '',
  searchQuery,
}: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[illustration] || ILLUSTRATIONS.default
  const isCompact = variant === 'compact'
  const isSearch = variant === 'search'
  const isError = variant === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-6' : 'py-12 md:py-16'} px-4 ${className}`}
    >
      {/* Illustration — custom SVG (premium, NOT generic Lucide icon).
          Marked aria-hidden because the SVG is purely decorative —
          the title/message below conveys the same meaning to screen readers. */}
      {!isCompact && (
        <div className={`mb-${isCompact ? '3' : '5'} relative`}>
          {/* Gold ring glow */}
          <div className="absolute inset-0 bg-[#cca72f]/10 rounded-full blur-2xl scale-150 pointer-events-none" aria-hidden />
          <div className={`relative ${isSearch ? 'w-24 h-24' : 'w-28 h-28 md:w-32 md:h-32'}`} aria-hidden="true">
            <Illustration />
          </div>
        </div>
      )}

      {/* Compact variant — show small icon only */}
      {isCompact && Icon && (
        <div className="w-12 h-12 rounded-full bg-[#064e3b]/8 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-[#064e3b]/50" />
        </div>
      )}

      {/* Title */}
      <h3 className={`font-display font-bold ${isCompact ? 'text-sm' : 'text-lg md:text-xl'} text-[#003527] mb-2`}>
        {isSearch && searchQuery ? (
          <>
            Tidak ada hasil untuk{' '}
            <span className="text-[#895033]">&ldquo;{searchQuery}&rdquo;</span>
          </>
        ) : (
          title
        )}
      </h3>

      {/* Message — empathic, gives context and hope */}
      {message && (
        <p className={`text-[#404944]/80 ${isCompact ? 'text-xs' : 'text-sm md:text-base'} max-w-md leading-relaxed mb-6`}>
          {isError && ' '}
          {message}
        </p>
      )}

      {/* Actions — primary + secondary CTAs */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-[#003527] hover:bg-[#064e3b] text-white font-semibold px-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
              size={isCompact ? 'sm' : 'default'}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              variant="outline"
              className="border-[#cca72f] text-[#895033] hover:bg-[#cca72f]/10 font-semibold px-6 rounded-xl transition-all hover:scale-105"
              size={isCompact ? 'sm' : 'default'}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}

      {/* Decorative gold divider — premium feel */}
      {!isCompact && (
        <div className="flex items-center gap-2 mt-8 opacity-40" aria-hidden>
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#cca72f]" />
          <span className="rotate-45 inline-block w-1.5 h-1.5 bg-[#cca72f]" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#cca72f]" />
        </div>
      )}
    </motion.div>
  )
}

/**
 * Convenience wrapper for the most common empty state patterns.
 * Reduces boilerplate when the caller just needs title + message + single CTA.
 */
export function EmptyStateCard({
  illustration = 'default',
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}: Pick<EmptyStateProps, 'illustration' | 'title' | 'message' | 'actionLabel' | 'onAction' | 'className'>) {
  return (
    <div className={`rounded-2xl border border-[#e4e2de] bg-[#ffffff] wood-carved-shadow overflow-hidden ${className}`}>
      <EmptyState
        illustration={illustration}
        title={title}
        message={message}
        actionLabel={actionLabel}
        onAction={onAction}
      />
    </div>
  )
}
