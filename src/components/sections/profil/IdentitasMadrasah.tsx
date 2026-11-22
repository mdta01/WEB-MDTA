'use client'

import { motion } from 'framer-motion'
import {
  Facebook,
  Instagram,
  Youtube,
  Music2,
  Hash,
  FileCheck,
  Shield,
  Building2,
  Calendar,
  Award,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SmartImage, pickImage } from '@/components/ui/smart-image'
import { LQIP } from '@/lib/lqip'
import { KratonDivider } from '@/components/kraton'

type SettingGetter = (key: string) => string

type IdentityRow = {
  label: string
  value: string
  icon: LucideIcon
  /** For ID-like values, render with monospace + tabular-nums */
  mono?: boolean
}

const SOCIALS: { icon: LucideIcon; label: string; key: string }[] = [
  { icon: Facebook, label: 'Facebook', key: 'madrasah_facebook' },
  { icon: Instagram, label: 'Instagram', key: 'madrasah_instagram' },
  { icon: Youtube, label: 'YouTube', key: 'madrasah_youtube' },
  { icon: Music2, label: 'TikTok', key: 'madrasah_tiktok' },
]

export function IdentitasMadrasah({ getSetting }: { getSetting: SettingGetter }) {
  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const madrasahSubtitle =
    getSetting('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'
  const madrasahLogo = pickImage(
    getSetting('madrasah_logo') || undefined,
    '/images/logo-madin-warna.webp',
  )

  const rows: IdentityRow[] = [
    {
      label: 'NSDT',
      value: getSetting('madrasah_nsdt') || '311235070813',
      icon: Hash,
      mono: true,
    },
    {
      label: 'NSM / NPSN',
      value: getSetting('madrasah_nsm') || getSetting('madrasah_npsn') || '-',
      icon: Hash,
      mono: true,
    },
    {
      label: 'Tahun Berdiri',
      value: getSetting('madrasah_history_year') || '1948',
      icon: Calendar,
      mono: true,
    },
    {
      label: 'Yayasan Pengelola',
      value: getSetting('madrasah_yayasan') || '-',
      icon: Building2,
    },
    {
      label: 'SK Pendirian',
      value: getSetting('madrasah_sk') || '-',
      icon: FileCheck,
      mono: true,
    },
    {
      label: 'Izin Operasional',
      value: getSetting('madrasah_izin') || 'DTA/813/2020',
      icon: Shield,
      mono: true,
    },
    {
      label: 'Akreditasi',
      value: getSetting('madrasah_akreditasi') || '-',
      icon: Award,
    },
    {
      label: 'Alamat',
      value:
        getSetting('madrasah_address') ||
        'Jl. Pesantren No. 01, Kec. Cisauk, Kab. Tangerang, Banten 15345',
      icon: MapPin,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden rounded-2xl border border-[#e4e2de] shadow-premium-lg wood-carved-shadow bg-[#fbf9f5]">
        {/* Top gold accent strip — like an official letterhead */}
        <div className="h-1.5 bg-gradient-to-r from-[#895033] via-[#cca72f] to-[#895033]" />

        {/* Watermark pattern in background */}
        <div
          className="absolute inset-0 kraton-pattern opacity-[0.025] pointer-events-none"
          aria-hidden
        />

        <CardContent className="relative p-6 sm:p-8 md:p-10">
          {/* Letterhead — Logo + Name + Subtitle */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mb-6 pb-6 border-b border-dashed border-[#e4e2de]">
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#ffffff] border border-[#e4e2de] shadow-md p-2 flex items-center justify-center">
              <SmartImage
                src={madrasahLogo}
                fallbackSrc="/images/logo-madin-warna.webp"
                blurDataURL={LQIP['logo-madin-warna']}
                alt={`Logo ${madrasahName}`}
                fill
                objectFit="contain"
                className="object-contain"
                loading="lazy"
                noFade
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#cca72f] mb-1">
                Identitas Madrasah
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#003527] leading-tight">
                {madrasahName}
              </h3>
              <p className="text-sm text-[#404944] mt-1">{madrasahSubtitle}</p>
            </div>
          </div>

          {/* Identity data — two-column grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-4">
            {rows.map(row => {
              const Icon = row.icon
              return (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 py-2 border-b border-[#e4e2de]/60 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-[#064e3b]/8 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[#003527]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider font-semibold text-[#404944]/70">
                      {row.label}
                    </dt>
                    <dd
                      className={`text-sm font-medium text-[#003527] break-words ${
                        row.mono ? 'font-mono tabular-nums tracking-tight' : ''
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                </motion.div>
              )
            })}
          </dl>

          {/* Decorative divider */}
          <KratonDivider variant="line" className="mt-7" />

          {/* Social media premium buttons */}
          <div className="mt-6">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[#404944]/70 mb-4 font-semibold">
              Terhubung dengan Kami
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {SOCIALS.map(social => {
                const Icon = social.icon
                const url = getSetting(social.key)
                const isActive = Boolean(url)
                return (
                  <a
                    key={social.label}
                    href={url || '#'}
                    target={isActive ? '_blank' : undefined}
                    rel={isActive ? 'noopener noreferrer' : undefined}
                    aria-label={social.label}
                    aria-disabled={!isActive}
                    className={`group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border transition-all duration-300 ${
                      isActive
                        ? 'bg-[#ffffff] border-[#e4e2de] hover:border-[#cca72f]/50 hover:bg-gradient-to-br hover:from-[#003527] hover:to-[#064e3b] hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-[#f5f3ef] border-[#e4e2de]/60 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-[#003527] group-hover:text-[#ffe088]'
                          : 'text-[#404944]/60'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        isActive
                          ? 'text-[#003527] group-hover:text-white'
                          : 'text-[#404944]/60'
                      }`}
                    >
                      {social.label}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </CardContent>

        {/* Bottom decorative gold strip */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#cca72f]/30 to-transparent" />
      </Card>
    </motion.div>
  )
}

export default IdentitasMadrasah
