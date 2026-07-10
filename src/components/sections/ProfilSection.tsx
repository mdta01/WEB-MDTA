'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Eye, Target, Users, Award, Phone, UserCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'

export default function ProfilSection() {
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetch('/api/teachers').then(r => r.json()),
  })

  const teachers = Array.isArray(teachersData) ? teachersData : (teachersData?.teachers || [])

  // Parse numbered list items (e.g., "1. Item 1\n2. Item 2")
  const parseNumberedList = (text: string): string[] => {
    if (!text) return []
    return text
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  // Parse struktur organisasi JSON
  const parseStruktur = () => {
    const raw = getSetting('madrasah_struktur_organisasi')
    if (!raw) return null
    try {
      return JSON.parse(raw) as Array<{ role: string; name: string; level: number }>
    } catch {
      return null
    }
  }

  const struktur = parseStruktur()
  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const historyYear = getSetting('madrasah_history_year') || '1998'
  const history = getSetting('madrasah_history')
  const vision = getSetting('madrasah_vision')
  const missionItems = parseNumberedList(getSetting('madrasah_mission'))
  const goalItems = parseNumberedList(getSetting('madrasah_goals'))

  return (
    <div className="space-y-16">
      {/* Sejarah */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Sejarah Madrasah</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-5 gap-0">
              <div className="md:col-span-2 bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 flex items-center justify-center min-h-[300px]">
                <div className="text-center text-white">
                  <BookOpen className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{madrasahName}</h3>
                  <p className="text-emerald-200 text-sm">Berdiri sejak tahun {historyYear}</p>
                </div>
              </div>
              <div className="md:col-span-3 p-8">
                {history ? (
                  <MarkdownRenderer content={history} className="text-sm" />
                ) : (
                  <p className="text-gray-400 italic">Sejarah madrasah belum tersedia.</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Visi Misi Tujuan */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Visi, Misi & Tujuan</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4">
                  <Eye className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-3">Visi</h3>
                {vision ? (
                  <MarkdownRenderer content={vision} className="text-sm" />
                ) : (
                  <p className="text-gray-400 italic text-sm">Visi belum tersedia.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center mb-4">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-3">Misi</h3>
                {missionItems.length > 0 || getSetting('madrasah_mission') ? (
                  <MarkdownRenderer content={getSetting('madrasah_mission')} className="text-sm" />
                ) : (
                  <p className="text-gray-400 italic text-sm">Misi belum tersedia.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center mb-4">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-3">Tujuan</h3>
                {goalItems.length > 0 || getSetting('madrasah_goals') ? (
                  <MarkdownRenderer content={getSetting('madrasah_goals')} className="text-sm" />
                ) : (
                  <p className="text-gray-400 italic text-sm">Tujuan belum tersedia.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Struktur Organisasi */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Struktur Organisasi</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {struktur && struktur.length > 0 ? (
              <div className="flex flex-col items-center">
                {/* Level 1 - Kepala */}
                {struktur.filter(s => s.level === 1).map(item => (
                  <div key={item.role} className="bg-emerald-700 text-white rounded-xl px-6 py-3 text-center mb-2">
                    <p className="font-bold">{item.role}</p>
                    <p className="text-emerald-200 text-xs">{item.name}</p>
                  </div>
                ))}
                {struktur.some(s => s.level === 2) && (
                  <div className="w-px h-6 bg-emerald-300" />
                )}
                {/* Level 2 - Wakil */}
                {struktur.filter(s => s.level === 2).map(item => (
                  <div key={item.role} className="bg-emerald-600 text-white rounded-xl px-6 py-3 text-center mb-2">
                    <p className="font-bold">{item.role}</p>
                    <p className="text-emerald-200 text-xs">{item.name}</p>
                  </div>
                ))}
                {struktur.some(s => s.level === 3) && (
                  <div className="w-px h-6 bg-emerald-300" />
                )}
                {/* Level 3 - Staff */}
                {struktur.filter(s => s.level === 3).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                    {struktur.filter(s => s.level === 3).map(item => (
                      <div key={item.role} className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                        <p className="font-semibold text-emerald-700 text-xs">{item.role}</p>
                        <p className="text-gray-500 text-[10px]">{item.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
                <p className="text-gray-500">Struktur organisasi belum tersedia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Data Guru — Premium Teacher Cards */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Tenaga Pengajar</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          <p className="text-sm text-gray-500 mt-3">
            {teachers.length > 0
              ? `${teachers.filter((t: { isActive?: boolean }) => t.isActive !== false).length} guru pengajar`
              : ''}
          </p>
        </div>
        {teachersLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden border-0">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </div>
              </Card>
            ))}
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {teachers.map((teacher: { id: string; name: string; position: string; subject?: string; image?: string; phone?: string }, idx: number) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              >
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full">
                  {/* Photo area (clean, no overlay text) */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200">
                    {teacher.image ? (
                      <img
                        src={teacher.image}
                        alt={teacher.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      // Fallback: gradient + initial letter
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                        <span className="text-5xl md:text-6xl font-extrabold text-white/90">
                          {teacher.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Subtle bottom gradient for depth (no text) */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-950/40 to-transparent" />
                  </div>

                  {/* Info section below photo: jabatan → nama → mata pelajaran */}
                  <div className="flex-1 flex flex-col items-center text-center p-4 pt-3 bg-white">
                    {/* Jabatan */}
                    <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
                      {teacher.position}
                    </span>
                    {/* Nama guru */}
                    <h4 className="font-bold text-emerald-800 text-sm md:text-base leading-tight">
                      {teacher.name}
                    </h4>
                    {/* Mata pelajaran */}
                    {teacher.subject && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="truncate">{teacher.subject}</span>
                      </p>
                    )}
                  </div>

                  {/* Footer with phone (if available) */}
                  {teacher.phone && (
                    <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100">
                      <a
                        href={`tel:${teacher.phone}`}
                        className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{teacher.phone}</span>
                      </a>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0">
            <UserCircle2 className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Data guru belum tersedia</p>
          </Card>
        )}
      </section>
    </div>
  )
}
