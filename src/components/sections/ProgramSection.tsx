'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Star, Trophy, Music, Clock,
  GraduationCap, Palette, Swords, BookHeart,
  CalendarDays, User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const iconMap: Record<string, React.ElementType> = {
  'quran': BookHeart,
  'tajwid': BookOpen,
  'fiqih': BookOpen,
  'aqidah': Star,
  'akhlaq': Star,
  'hadits': BookOpen,
  'tahfidz': BookHeart,
  'bahasa-arab': GraduationCap,
  'sirah': BookOpen,
  'tahsin': BookHeart,
  'kaligrafi': Palette,
  'pramuka': Swords,
  'pidato': Trophy,
  'hadroh': Music,
  'default': BookOpen,
}

const categoryColors: Record<string, string> = {
  'kelas': 'bg-emerald-600',
  'kurikulum': 'bg-teal-600',
  'unggulan': 'bg-amber-600',
  'ekstrakurikuler': 'bg-emerald-800',
}

interface ProgramItem {
  id: string
  title: string
  description: string
  icon?: string | null
}

function getIcon(iconName?: string | null) {
  if (!iconName) return BookOpen
  return iconMap[iconName.toLowerCase()] || BookOpen
}

function ProgramGrid({ items, color }: { items: ProgramItem[]; color: string }) {
  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-md p-8 text-center">
        <BookOpen className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
        <p className="text-gray-500">Data belum tersedia</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, idx) => {
        const Icon = getIcon(item.icon)
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-800 text-sm">{item.title}</h4>
                  <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function ProgramSection() {
  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetch('/api/programs').then(r => r.json()),
  })

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => fetch('/api/schedules').then(r => r.json()),
  })

  const programs = Array.isArray(programsData) ? programsData : (programsData?.programs || [])
  const schedulesRaw = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.schedules || [])

  // Sort schedules by day order: Sabtu, Ahad/Minggu, Senin, Selasa, Rabu, Kamis (Jumat = libur, tidak ada KBM)
  const dayOrder: Record<string, number> = {
    'Sabtu': 1,
    'Ahad': 2, 'Minggu': 2,
    'Senin': 3,
    'Selasa': 4,
    'Rabu': 5,
    'Kamis': 6,
    'Jumat': 7, // libur — biasanya tidak ada, tapi kalau ada taruh di akhir
  }
  const schedules = [...schedulesRaw].sort((a: { day: string }, b: { day: string }) => {
    const aOrder = dayOrder[a.day] ?? 99
    const bOrder = dayOrder[b.day] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return 0
  })

  // Group schedules by day for card-based layout
  const groupedSchedules: { day: string; items: typeof schedules }[] = []
  const dayGroupMap: Record<string, typeof schedules> = {}
  schedules.forEach((s: { day: string }) => {
    if (!dayGroupMap[s.day]) dayGroupMap[s.day] = []
    dayGroupMap[s.day].push(s)
  })
  Object.entries(dayGroupMap)
    .sort(([a], [b]) => (dayOrder[a] ?? 99) - (dayOrder[b] ?? 99))
    .forEach(([day, items]) => {
      groupedSchedules.push({ day, items })
    })

  const kelasPrograms = programs.filter((p: { category: string }) => p.category === 'kelas')
  const kurikulumPrograms = programs.filter((p: { category: string }) => p.category === 'kurikulum')
  const unggulanPrograms = programs.filter((p: { category: string }) => p.category === 'unggulan')
  const ekskulPrograms = programs.filter((p: { category: string }) => p.category === 'ekstrakurikuler')

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Program Pendidikan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      <Tabs defaultValue="kelas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-emerald-50">
          <TabsTrigger value="kelas" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-xs md:text-sm">Kelas</TabsTrigger>
          <TabsTrigger value="kurikulum" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-xs md:text-sm">Kurikulum</TabsTrigger>
          <TabsTrigger value="unggulan" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-xs md:text-sm">Unggulan</TabsTrigger>
          <TabsTrigger value="ekskul" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-xs md:text-sm">Ekskul</TabsTrigger>
        </TabsList>

        <TabsContent value="kelas">
          <ProgramGrid items={kelasPrograms} color={categoryColors['kelas']} />
        </TabsContent>

        <TabsContent value="kurikulum">
          <ProgramGrid items={kurikulumPrograms} color={categoryColors['kurikulum']} />
        </TabsContent>

        <TabsContent value="unggulan">
          <ProgramGrid items={unggulanPrograms} color={categoryColors['unggulan']} />
        </TabsContent>

        <TabsContent value="ekskul">
          <ProgramGrid items={ekskulPrograms} color={categoryColors['ekstrakurikuler']} />
        </TabsContent>
      </Tabs>

      {/* Jadwal KBM — Card-based layout per hari */}
      <section className="mt-12">
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Jadwal KBM
          </h3>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          <p className="text-sm text-gray-600 mt-3">
            Hari belajar: <span className="font-semibold text-emerald-700">Sabtu – Kamis</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Jumat Libur
            </span>
          </p>
        </div>

        {schedulesLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-0 shadow-md overflow-hidden">
                <Skeleton className="h-12 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : schedules.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedSchedules.map(({ day, items: daySchedules }) => {
              const isFriday = day === 'Jumat'
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-0 shadow-md overflow-hidden h-full ${isFriday ? 'ring-1 ring-red-200' : ''}`}>
                    {/* Day header */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      isFriday
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-emerald-700 to-emerald-800'
                    }`}>
                      <div className="flex items-center gap-2 text-white">
                        <CalendarDays className="h-4 w-4" />
                        <span className="font-bold text-sm">{day}</span>
                      </div>
                      <span className="text-white/80 text-xs">
                        {isFriday ? '🔴 Libur' : `${daySchedules.length} pelajaran`}
                      </span>
                    </div>

                    {/* Day content */}
                    {isFriday ? (
                      <div className="p-6 text-center bg-red-50">
                        <p className="text-sm text-red-600 font-medium">
                          🕌 Hari Jumat adalah hari libur KBM
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {daySchedules.map((s: { id: string; timeStart: string; timeEnd: string; subject?: string; teacher?: string; class?: string; title?: string }) => (
                          <div key={s.id} className="p-3 hover:bg-emerald-50/50 transition-colors">
                            {/* Time */}
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mb-1.5">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{s.timeStart} – {s.timeEnd}</span>
                              {s.class && (
                                <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0">
                                  {s.class}
                                </Badge>
                              )}
                            </div>
                            {/* Subject + teacher */}
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-emerald-800 leading-tight">
                                {s.subject || s.title || '—'}
                              </p>
                              {s.teacher && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{s.teacher}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center border-0 shadow-md">
            <CalendarDays className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Jadwal belum tersedia</p>
          </Card>
        )}
      </section>
    </div>
  )
}
