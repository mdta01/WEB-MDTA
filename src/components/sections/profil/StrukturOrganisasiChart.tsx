'use client'

import { motion } from 'framer-motion'
import { Crown, User, Users, Briefcase } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyStateCard } from '@/components/ui/empty-state'

type StrukturItem = {
  role: string
  name: string
  level: number
}

// Initial letter for photo placeholder
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Level config — different visual treatment per hierarchy level
const LEVEL_CONFIG = {
  1: {
    icon: Crown,
    iconWrapper: 'bg-[#cca72f]/20 ring-2 ring-[#cca72f]/40',
    iconColor: 'text-[#ffe088]',
    card: 'bg-gradient-to-br from-[#003527] to-[#064e3b] text-white border-[#cca72f]/40 shadow-premium-lg',
    width: 'md:w-64',
    nameColor: 'text-white',
    roleColor: 'text-[#ffe088]',
    label: 'Kepala Madrasah',
  },
  2: {
    icon: User,
    iconWrapper: 'bg-[#cca72f]/15 ring-1 ring-[#cca72f]/30',
    iconColor: 'text-[#ffe088]',
    card: 'bg-gradient-to-br from-[#064e3b] to-[#003527] text-white border-[#064e3b]/40 shadow-premium',
    width: 'md:w-56',
    nameColor: 'text-white',
    roleColor: 'text-[#b0f0d6]',
    label: 'Wakil',
  },
  3: {
    icon: Users,
    iconWrapper: 'bg-[#003527]/10 ring-1 ring-[#003527]/15',
    iconColor: 'text-[#003527]',
    card: 'bg-[#ffffff] border-[#e4e2de] shadow-premium',
    width: 'md:w-44',
    nameColor: 'text-[#003527]',
    roleColor: 'text-[#404944]',
    label: 'Staff',
  },
} as const

function OrgCard({ item, level }: { item: StrukturItem; level: 1 | 2 | 3 }) {
  const cfg = LEVEL_CONFIG[level]
  const Icon = cfg.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={`relative ${cfg.width} mx-auto w-full`}
    >
      <div
        className={`relative rounded-2xl border-2 p-4 text-center overflow-hidden ${cfg.card} hover:shadow-xl transition-shadow`}
      >
        {level === 1 && (
          <div
            className="absolute inset-0 kraton-pattern opacity-[0.05]"
            aria-hidden
          />
        )}
        <div className="relative">
          {/* Photo placeholder circle */}
          <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20 backdrop-blur-sm">
            <span className="text-xl font-bold font-display text-[#ffe088]">
              {getInitials(item.name)}
            </span>
          </div>
          {/* Icon badge */}
          <div
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full mb-2 ${cfg.iconWrapper}`}
          >
            <Icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
          </div>
          {/* Role label */}
          <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${cfg.roleColor}`}>
            {cfg.label}
          </p>
          {/* Role */}
          <p className={`text-xs font-bold leading-tight ${cfg.nameColor}`}>{item.role}</p>
          {/* Name */}
          {item.name && (
            <p className={`text-[10px] mt-1 leading-tight ${cfg.roleColor}`}>{item.name}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function StrukturOrganisasiChart({ struktur }: { struktur: StrukturItem[] | null }) {
  if (!struktur || struktur.length === 0) {
    return (
      <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow rounded-2xl bg-[#ffffff]">
        <CardContent className="p-8">
          <EmptyStateCard
            illustration="profil"
            title="Struktur organisasi belum tersedia"
            message="Bagan kepengurusan madrasah akan ditampilkan di sini setelah admin mengunggah data."
          />
        </CardContent>
      </Card>
    )
  }

  const level1 = struktur.filter(s => s.level === 1)
  const level2 = struktur.filter(s => s.level === 2)
  const level3 = struktur.filter(s => s.level === 3)

  return (
    <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow rounded-2xl bg-[#fbf9f5] overflow-hidden">
      <CardContent className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center">
          {/* Level 1 — Kepala Madrasah */}
          {level1.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap items-start justify-center gap-4 md:gap-6">
                {level1.map(item => (
                  <OrgCard key={`${item.role}-${item.name}`} item={item} level={1} />
                ))}
              </div>
            </div>
          )}

          {/* Connector: L1 → L2 */}
          {level1.length > 0 && level2.length > 0 && (
            <ConnectorVertical />
          )}

          {/* Level 2 — Wakil */}
          {level2.length > 0 && (
            <div className="w-full">
              <div className="flex flex-wrap items-start justify-center gap-4 md:gap-6">
                {level2.map(item => (
                  <OrgCard key={`${item.role}-${item.name}`} item={item} level={2} />
                ))}
              </div>
            </div>
          )}

          {/* Connector: L2 → L3 (horizontal bar with drops) */}
          {level2.length > 0 && level3.length > 0 && (
            <ConnectorHorizontal count={Math.min(level3.length, 4)} />
          )}

          {/* Level 3 — Staff (grid) */}
          {level3.length > 0 && (
            <div className="w-full mt-2">
              <div className="flex items-center justify-center mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#064e3b]/10 border border-[#064e3b]/15">
                  <Briefcase className="h-3.5 w-3.5 text-[#003527]" />
                  <span className="text-[10px] font-semibold text-[#003527] uppercase tracking-wider">
                    Staf Pelaksana
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                {level3.map(item => (
                  <div
                    key={`${item.role}-${item.name}`}
                    className="bg-[#ffffff] border border-[#e4e2de] rounded-xl p-3 text-center hover:shadow-md hover:border-[#cca72f]/40 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-gradient-to-br from-[#064e3b] to-[#003527] flex items-center justify-center ring-2 ring-[#cca72f]/15">
                      <span className="text-xs font-bold text-[#ffe088]">
                        {getInitials(item.name)}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#895033] mb-1">
                      Staff
                    </p>
                    <p className="text-xs font-bold text-[#003527] leading-tight">{item.role}</p>
                    {item.name && (
                      <p className="text-[10px] text-[#404944] mt-0.5 leading-tight">{item.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Vertical connector (single line)
function ConnectorVertical() {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-px h-10 sm:h-12 bg-gradient-to-b from-[#cca72f] to-[#cca72f]/30 origin-top"
      aria-hidden
    />
  )
}

// Horizontal connector with drop lines for staff grid
function ConnectorHorizontal({ count }: { count: number }) {
  return (
    <div className="relative w-full max-w-3xl py-4" aria-hidden>
      <div className="relative mx-auto" style={{ height: '32px' }}>
        {/* Horizontal bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute left-[12%] right-[12%] top-0 h-px bg-[#cca72f] origin-center"
        />
        {/* Drop lines */}
        {Array.from({ length: count }).map((_, i) => {
          const left = `${12 + (76 / Math.max(count - 1, 1)) * i}%`
          return (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
              className="absolute top-0 w-px h-8 bg-gradient-to-b from-[#cca72f] to-[#cca72f]/30 origin-top"
              style={{ left, transform: 'translateX(-50%)' }}
            />
          )
        })}
        {/* End caps */}
        <span className="absolute left-[12%] top-0 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#cca72f]" />
        <span className="absolute right-[12%] top-0 w-1.5 h-1.5 translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#cca72f]" />
      </div>
    </div>
  )
}

export default StrukturOrganisasiChart
