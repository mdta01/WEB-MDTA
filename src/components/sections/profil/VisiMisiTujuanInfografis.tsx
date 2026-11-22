'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  BookOpen,
  Users,
  Heart,
  Target,
  Compass,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { TiltCard } from '@/components/ui/tilt-card'

// Parse numbered list items (e.g., "1. Item 1\n2. Item 2") into individual items
function parseNumberedList(text: string): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0)
}

// Icon rotation for misi items — premium feel, each item feels distinct
const MISI_ICONS: LucideIcon[] = [BookOpen, Users, Heart, Target, Compass, BookOpen, Users, Heart]
const TUJUAN_ICON: LucideIcon = CheckCircle2

type Props = {
  vision: string
  missionText: string
  goalsText: string
}

export function VisiMisiTujuanInfografis({ vision, missionText, goalsText }: Props) {
  const missionItems = parseNumberedList(missionText)
  const goalItems = parseNumberedList(goalsText)

  const hasVision = Boolean(vision)
  const hasMission = missionItems.length > 0 || Boolean(missionText)
  const hasGoals = goalItems.length > 0 || Boolean(goalsText)

  return (
    <div className="space-y-8">
      {/* VISI — Single full-width premium card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border border-[#e4e2de] shadow-premium-lg wood-carved-shadow bg-[#ffffff]">
          {/* Gold left accent strip */}
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#cca72f] via-[#ffe088] to-[#cca72f]" />
          {/* Subtle emerald radial glow in top-right corner */}
          <div
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#064e3b]/8 blur-2xl"
            aria-hidden
          />
          <CardContent className="relative p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Icon + label column */}
              <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 md:w-48 shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#cca72f] to-[#895033] flex items-center justify-center shadow-md shadow-[#cca72f]/40 ring-4 ring-[#cca72f]/10">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cca72f]">
                    Visi
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#404944]/60 mt-0.5">
                    Panduan Utama
                  </p>
                </div>
              </div>
              {/* Vision text — elegant serif */}
              <div className="flex-1 md:border-l md:border-[#e4e2de] md:pl-8 min-w-0">
                {hasVision ? (
                  <div className="relative">
                    <span className="absolute -left-2 -top-4 text-6xl leading-none text-[#cca72f]/20 font-display select-none">
                      &ldquo;
                    </span>
                    <div className="pl-6">
                      <MarkdownRenderer
                        content={vision}
                        className="text-base sm:text-lg md:text-xl text-[#003527] font-display leading-relaxed italic"
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyState illustration="default" variant="compact" title="Visi belum tersedia" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid: MISI (left) + TUJUAN (right) */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* MISI — Numbered list with rotating icons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-full rounded-2xl border border-[#e4e2de] shadow-premium wood-carved-shadow bg-[#ffffff] overflow-hidden">
            <div className="bg-gradient-to-r from-[#003527] to-[#064e3b] px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-0 kraton-pattern opacity-[0.05]" aria-hidden />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#cca72f]/20 ring-1 ring-[#cca72f]/40 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#ffe088]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display leading-none">Misi</h3>
                  <p className="text-[#b0f0d6] text-[10px] uppercase tracking-wider mt-1">
                    Langkah Strategis
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {hasMission ? (
                missionItems.length > 0 ? (
                  <ol className="space-y-4">
                    {missionItems.map((item, idx) => {
                      const Icon = MISI_ICONS[idx % MISI_ICONS.length]
                      return (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                          className="flex items-start gap-3 group"
                        >
                          <div className="shrink-0 relative">
                            {/* Numbered circle */}
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#003527] to-[#064e3b] text-[#ffe088] text-xs font-bold ring-2 ring-[#cca72f]/20 group-hover:ring-[#cca72f]/50 transition">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start gap-2">
                              <Icon className="h-4 w-4 text-[#cca72f] mt-0.5 shrink-0" />
                              <p className="text-sm text-[#404944] leading-relaxed">{item}</p>
                            </div>
                          </div>
                        </motion.li>
                      )
                    })}
                  </ol>
                ) : (
                  <MarkdownRenderer content={missionText} className="text-sm" />
                )
              ) : (
                <EmptyState illustration="default" variant="compact" title="Misi belum tersedia" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* TUJUAN — Card grid with checkmarks */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-full rounded-2xl border border-[#e4e2de] shadow-premium wood-carved-shadow bg-[#ffffff] overflow-hidden">
            <div className="bg-gradient-to-r from-[#064e3b] to-[#003527] px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-0 kraton-pattern opacity-[0.05]" aria-hidden />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#cca72f]/20 ring-1 ring-[#cca72f]/40 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#ffe088]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display leading-none">Tujuan</h3>
                  <p className="text-[#b0f0d6] text-[10px] uppercase tracking-wider mt-1">
                    Capaan Utama
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {hasGoals ? (
                goalItems.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {goalItems.map((item, idx) => {
                      const Icon = TUJUAN_ICON
                      return (
                        <TiltCard
                          key={idx}
                          maxTilt={3}
                          delay={Math.min(idx * 0.04, 0.2)}
                          duration={0.4}
                        >
                          <div className="h-full bg-[#fbf9f5] border border-[#e4e2de] rounded-xl p-3 hover:border-[#cca72f]/40 transition-colors">
                            <div className="flex items-start gap-2.5">
                              <div className="shrink-0 w-7 h-7 rounded-full bg-[#cca72f]/15 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-[#cca72f]" />
                              </div>
                              <p className="text-xs text-[#404944] leading-relaxed pt-0.5">
                                {item}
                              </p>
                            </div>
                          </div>
                        </TiltCard>
                      )
                    })}
                  </div>
                ) : (
                  <MarkdownRenderer content={goalsText} className="text-sm" />
                )
              ) : (
                <EmptyState illustration="default" variant="compact" title="Tujuan belum tersedia" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default VisiMisiTujuanInfografis
