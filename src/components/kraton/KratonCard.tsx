'use client'

import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * KratonCard — Card reusable dengan sistem varian Kraton Islamic Heritage.
 *
 * Varian warna:
 *  - parchment (default) — putih parchment (#ffffff) dengan border tipis,
 *                          wood-carved-shadow, gold top-bar muncul saat hover.
 *                          Cocok untuk konten publik (berita, profil, prestasi).
 *  - emerald             — gradient deep emerald (#003527 → #064e3b) dengan
 *                          kraton-pattern overlay samar. Teks emerald-light (#b0f0d6).
 *                          Cocok untuk highlight / CTA / sambutan.
 *  - gold                — gradient antique gold (#cca72f → #895033). Teks gelap.
 *                          Cocok untuk badge prestasi / penghargaan / featured.
 *
 * Ornamen:
 *  - ornament="top" (default) — bar emas 4px di atas card, opacity 0 → 1 saat hover.
 *                                Memberi sentuhan "kayu ukir Kraton".
 *  - ornament="corner"        — diamond emas kecil di pojok kanan atas (persistent).
 *  - ornament="none"          — tanpa ornamen (clean).
 *
 * Pattern:
 *  - pattern=true (default false) — overlay kraton-pattern (motif Jawa) di sudut card.
 *                                    Hanya aktif untuk varian emerald & gold.
 *
 * Hover:
 *  - hover=true (default) — efek lift (translateY -4px) + shadow dalam.
 *                           Nonaktifkan untuk card statis (mis. jadwal).
 *
 * Card ini MENGACU ke primitif shadcn Card (struktur sama: rounded, border, shadow),
 * tapi dengan styling Kraton yang konsisten. Tetap kompatibel dengan CardHeader,
 * CardContent, CardFooter dari "@/components/ui/card".
 */
type KratonCardProps = {
  children: ReactNode
  /** Varian warna. */
  variant?: 'parchment' | 'emerald' | 'gold'
  /** Ornamen dekoratif. */
  ornament?: 'top' | 'corner' | 'none'
  /** Tampilkan overlay kraton-pattern (hanya emerald & gold). */
  pattern?: boolean
  /** Aktifkan efek hover lift + shadow. */
  hover?: boolean
  /** Kelas tambahan. */
  className?: string
  /** Aksesibilitas: role custom bila card ini clickable. */
  role?: string
  /** Untuk card yang clickable (mis. list item). */
  onClick?: () => void
  /** Tabindex untuk card clickable. */
  tabIndex?: number
}

const variantClasses: Record<
  NonNullable<KratonCardProps['variant']>,
  string
> = {
  parchment:
    'bg-[#ffffff] text-[#1b1c1a] border-[#e4e2de] wood-carved-shadow',
  emerald:
    'bg-gradient-to-br from-[#003527] to-[#064e3b] text-[#b0f0d6] border-[#064e3b]/40 shadow-premium-lg',
  gold:
    'bg-gradient-to-br from-[#cca72f] to-[#895033] text-[#1b1c1a] border-[#895033]/30 shadow-glow-amber',
}

const hoverClasses =
  'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,53,39,0.18),0_8px_16px_-8px_rgba(0,0,0,0.08)]'

export const KratonCard = forwardRef<HTMLDivElement, KratonCardProps>(
  function KratonCard(
    {
      children,
      variant = 'parchment',
      ornament = 'top',
      pattern = false,
      hover = true,
      className,
      role,
      onClick,
      tabIndex,
    },
    ref,
  ) {
    const isClickable = typeof onClick === 'function'
    const showPattern =
      pattern && (variant === 'emerald' || variant === 'gold')

    return (
      <div
        ref={ref}
        role={role ?? (isClickable ? 'button' : undefined)}
        tabIndex={isClickable ? tabIndex ?? 0 : tabIndex}
        onClick={onClick}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClick?.()
                }
              }
            : undefined
        }
        className={cn(
          // Base card structure (mirror shadcn Card)
          'relative overflow-hidden rounded-2xl border flex flex-col gap-6 py-6',
          variantClasses[variant],
          hover && hoverClasses,
          isClickable && 'cursor-pointer focus-ring',
          className,
        )}
      >
        {/* Kraton-pattern overlay (subtle Javanese motif) */}
        {showPattern && (
          <div
            className="absolute inset-0 kraton-pattern opacity-[0.06] pointer-events-none"
            aria-hidden
          />
        )}

        {/* Ornamen top bar emas — muncul saat hover */}
        {ornament === 'top' && (
          <div
            className={cn(
              'absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#cca72f] via-[#ffe088] to-[#cca72f]',
              'transition-opacity duration-300',
              hover ? 'opacity-0 group-hover:opacity-100 hover:opacity-100' : 'opacity-100',
            )}
            aria-hidden
          />
        )}

        {/* Ornamen corner diamond emas */}
        {ornament === 'corner' && (
          <div
            className="absolute top-3 right-3 pointer-events-none"
            aria-hidden
          >
            <span className="block h-2 w-2 rotate-45 bg-[#cca72f] ring-2 ring-[#ffe088]/40" />
          </div>
        )}

        {/* Konten */}
        <div className="relative flex flex-col gap-6 h-full flex-1">{children}</div>
      </div>
    )
  },
)

export default KratonCard
