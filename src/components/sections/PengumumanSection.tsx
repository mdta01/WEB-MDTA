'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  Bell, FileText, CalendarDays, GraduationCap, AlertCircle,
  Megaphone, Clock, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { Skeleton } from '@/components/ui/skeleton'
import { KratonSectionHeader } from '@/components/kraton'

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  'ujian': { icon: FileText, color: 'text-[#064e3b]', label: 'Ujian', bg: 'bg-[#064e3b]/12' },
  'libur': { icon: CalendarDays, color: 'text-[#895033]', label: 'Libur', bg: 'bg-[#cca72f]/15' },
  'kegiatan': { icon: Bell, color: 'text-[#003527]', label: 'Kegiatan', bg: 'bg-[#003527]/12' },
  'ppdb': { icon: GraduationCap, color: 'text-[#895033]', label: 'PPDB', bg: 'bg-[#895033]/12' },
  'penting': { icon: AlertCircle, color: 'text-[#895033]', label: 'Penting', bg: 'bg-[#cca72f]/15' },
  'general': { icon: Megaphone, color: 'text-[#404944]', label: 'Umum', bg: 'bg-[#f5f3ef]' },
}

export default function PengumumanSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => fetch('/api/announcements').then(r => r.json()),
  })

  const announcements = Array.isArray(data) ? data : (data?.announcements || [])

  // Track which announcements are expanded (for long content)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Sort: priority desc (featured first), then newest first
  const sortedAnnouncements = [...announcements].sort((a: { priority?: number; createdAt: string }, b: { priority?: number; createdAt: string }) => {
    const pa = a.priority || 0
    const pb = b.priority || 0
    if (pb !== pa) return pb - pa
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const renderAnnouncement = (item: { id: string; title: string; content: string; type: string; createdAt: string; priority: number }, idx: number) => {
    const config = typeConfig[item.type] || typeConfig['general']
    const TypeIcon = config.icon
    // Featured = high priority (>=3) — shown first, with subtle gold accent (not red/alarmist)
    const isFeatured = item.priority >= 3
    const isExpanded = expandedIds.has(item.id)
    const contentPreview = item.content?.length > 200 ? item.content.substring(0, 200) + '...' : item.content
    const isLongContent = item.content?.length > 200

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.4 }}
      >
        <Card
          className={`border rounded-2xl bg-[#ffffff] card-hover overflow-hidden relative ${
            isFeatured
              ? 'border-[#cca72f]/40 shadow-premium-lg'
              : 'border-[#e4e2de] shadow-premium'
          }`}
        >
          {/* Featured: subtle gold left accent bar (eye-catching, not alarmist) */}
          {isFeatured && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#cca72f] via-[#ffe088] to-[#cca72f]" aria-hidden />
          )}

          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Icon with type-colored bg */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
                <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#cca72f]/15 text-[#895033] text-[10px] font-bold uppercase tracking-wide">
                      <Sparkles className="h-2.5 w-2.5" />
                      Utama
                    </span>
                  )}
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wide border-0 ${config.bg} ${config.color}`}>
                    {config.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-[10px] text-[#404944]/70">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Title — emerald for all (not red) */}
                <h4 className="font-semibold text-sm sm:text-base leading-tight mb-2 text-[#003527]">
                  {item.title}
                </h4>

                {/* Content — preview or full based on expand state */}
                <div className="text-[#404944] text-sm">
                  <MarkdownRenderer content={isExpanded ? item.content : contentPreview} />
                </div>

                {/* Expand/collapse button for long content */}
                {isLongContent && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#003527] hover:text-[#064e3b] transition-colors"
                  >
                    {isExpanded ? (
                      <>Tutup <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Baca selengkapnya <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <KratonSectionHeader
        badge="Pemberitahuan Resmi"
        title="Pengumuman"
        subtitle="Informasi terkini seputar kegiatan madrasah — silakan baca dengan saksama"
        align="center"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5 border border-[#e4e2de] rounded-2xl">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {sortedAnnouncements.map((item: { id: string; title: string; content: string; type: string; createdAt: string; priority: number }, idx: number) => renderAnnouncement(item, idx))}
        </div>
      ) : (
        <Card className="p-12 text-center border border-[#e4e2de] rounded-2xl bg-[#ffffff] wood-carved-shadow">
          <Megaphone className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944]">Belum ada pengumuman saat ini</p>
          <p className="text-xs text-[#404944]/60 mt-1">Periksa kembali nanti untuk informasi terbaru</p>
        </Card>
      )}
    </div>
  )
}
