'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bell, FileText, CalendarDays, GraduationCap, AlertCircle,
  Megaphone, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { Skeleton } from '@/components/ui/skeleton'

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'ujian': { icon: FileText, color: 'bg-[#064e3b]/15 text-[#064e3b]', label: 'Ujian' },
  'libur': { icon: CalendarDays, color: 'bg-[#cca72f]/20 text-[#895033]', label: 'Libur' },
  'kegiatan': { icon: Bell, color: 'bg-[#003527]/15 text-[#003527]', label: 'Kegiatan' },
  'ppdb': { icon: GraduationCap, color: 'bg-[#895033]/15 text-[#895033]', label: 'PPDB' },
  'penting': { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Penting' },
  'general': { icon: Megaphone, color: 'bg-[#f5f3ef] text-[#404944]', label: 'Umum' },
}

export default function PengumumanSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => fetch('/api/announcements').then(r => r.json()),
  })

  const announcements = Array.isArray(data) ? data : (data?.announcements || [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="inline-block px-3 py-0.5 rounded-full bg-[#cca72f]/15 text-[#895033] text-xs font-semibold uppercase tracking-wider mb-2"
        >
          Pemberitahuan
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gradient-emerald"
        >
          Pengumuman
        </motion.h2>
        <div className="w-20 h-1 bg-gradient-to-r from-[#003527] to-[#cca72f] mx-auto mt-2 rounded-full" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5 border-0">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((item: { id: string; title: string; content: string; type: string; createdAt: string; priority: number }, idx: number) => {
            const config = typeConfig[item.type] || typeConfig['general']
            const TypeIcon = config.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
              >
                <Card className={`border border-[#e4e2de] shadow-premium card-hover rounded-2xl bg-[#ffffff] ${item.priority >= 3 ? 'ring-2 ring-[#cca72f]/50' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-2xl ${config.color} flex items-center justify-center shrink-0 shadow-md`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-[#003527]">{item.title}</h4>
                          <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                          {item.priority >= 3 && (
                            <Badge className="text-xs bg-red-100 text-red-700">Prioritas</Badge>
                          )}
                        </div>
                        <div className="text-[#404944] text-sm">
                          <MarkdownRenderer content={item.content} />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-[#404944]/70">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border-0">
          <Megaphone className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944]">Belum ada pengumuman saat ini</p>
        </Card>
      )}
    </div>
  )
}
