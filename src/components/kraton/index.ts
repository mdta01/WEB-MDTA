/**
 * Kraton Design System — Primitif UI reusable bergaya Islamic Heritage Jawa.
 *
 * Komponen yang tersedia:
 *  - KratonSectionHeader : Judul section dengan badge + judul gradient + ornamen Jawa
 *  - KratonCard          : Card dengan 3 varian (parchment/emerald/gold) + ornamen
 *  - KratonDivider       : Ornamen pembatas motif berlian (diamond) khas Kraton
 *
 * Palet warna (lihat src/app/globals.css):
 *  - Primary deep emerald : #003527
 *  - Primary container    : #064e3b
 *  - Secondary teak wood  : #895033
 *  - Antique gold accent  : #cca72f
 *  - Gold highlight       : #ffe088
 *  - Primary-fixed light  : #b0f0d6
 *  - Background parchment : #fbf9f5
 *  - Surface containers   : #f5f3ef, #efeeea
 *
 * Tipografi:
 *  - Display (Playfair Display) — h1-h6 (auto via globals.css)
 *  - Body (Montserrat)          — teks body
 *
 * Utility CSS (di globals.css):
 *  - .kraton-pattern        : overlay motif Jawa (SVG data-uri)
 *  - .wood-carved-shadow    : shadow kayu ukir
 *  - .active-nav-pill       : bar emas kiri untuk nav aktif
 *  - .glass / .glass-dark   : glassmorphism parchment / emerald
 *  - .text-gradient-emerald : gradient teks emerald→gold
 *  - .card-hover            : efek lift hover (kompatibel dengan KratonCard hover=true)
 *  - .shadow-premium-lg     : shadow premium dalam
 *  - .shadow-glow-amber     : glow emas
 *  - .focus-ring            : focus ring aksesibilitas
 */
export { KratonSectionHeader, default as KratonSectionHeaderDefault } from './KratonSectionHeader'
export { KratonCard, default as KratonCardDefault } from './KratonCard'
export { KratonDivider, default as KratonDividerDefault } from './KratonDivider'

export type { KratonSectionHeaderProps } from './KratonSectionHeader'
export type { KratonCardProps } from './KratonCard'
export type { KratonDividerProps } from './KratonDivider'
