'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bell, FileText, CalendarDays, GraduationCap, AlertCircle,
  Megaphone, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'ujian': { icon: FileText, color: 'bg-blue-100 text-blue-700', label: 'Ujian' },
  'libur': { icon: CalendarDays, color: 'bg-amber-100 text-amber-700', label: 'Libur' },
  'kegiatan': { icon: Bell, color: 'bg-emerald-100 text-emerald-700', label: 'Kegiatan' },
  'ppdb': { icon: GraduationCap, color: 'bg-purple-100 text-purple-700', label: 'PPDB' },
  'penting': { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Penting' },
  'general': { icon: Megaphone, color: 'bg-gray-100 text-gray-700', label: 'Umum' },
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
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Pengumuman</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow ${item.priority >= 3 ? 'ring-2 ring-amber-300' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-emerald-800">{item.title}</h4>
                          <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                          {item.priority >= 3 && (
                            <Badge className="text-xs bg-red-100 text-red-700">Prioritas</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{item.content}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
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
          <Megaphone className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada pengumuman saat ini</p>
        </Card>
      )}
    </div>
  )
}
