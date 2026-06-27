'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Star, Trophy, Music, Clock, Calendar,
  GraduationCap, Palette, Swords, BookHeart,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

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

const defaultKelas: ProgramItem[] = [
  { id: '1', title: "Kelas 1 (I'dadiyah)", description: 'Tingkat awal untuk santri baru', icon: 'default' },
  { id: '2', title: "Kelas 2 (I'dadiyah)", description: "Tingkat lanjutan I'dadiyah", icon: 'default' },
  { id: '3', title: 'Kelas 3 (Ibtidaiyah)', description: 'Tingkat menengah pertama', icon: 'default' },
  { id: '4', title: 'Kelas 4 (Ibtidaiyah)', description: 'Tingkat menengah akhir', icon: 'default' },
  { id: '5', title: 'Kelas 5 (Tajhidiyah)', description: 'Tingkat tinggi', icon: 'default' },
  { id: '6', title: 'Kelas 6 (Tajhidiyah)', description: 'Tingkat akhir / lulusan', icon: 'default' },
]

const defaultKurikulum: ProgramItem[] = [
  { id: 'k1', title: 'Al-Quran & Tajwid', description: 'Membaca Al-Quran dengan tajwid yang benar', icon: 'quran' },
  { id: 'k2', title: 'Tahfidz Al-Quran', description: 'Menghafal Al-Quran minimal 3 Juz', icon: 'tahfidz' },
  { id: 'k3', title: 'Fiqih Ibadah', description: 'Hukum-hukum ibadah Islam', icon: 'fiqih' },
  { id: 'k4', title: 'Aqidah', description: 'Dasar-dasar keimanan Islam', icon: 'aqidah' },
  { id: 'k5', title: 'Akhlaq', description: 'Pendidikan akhlak dan budi pekerti', icon: 'akhlaq' },
  { id: 'k6', title: 'Hadits', description: 'Studi hadits-hadits Nabi SAW', icon: 'hadits' },
  { id: 'k7', title: 'Bahasa Arab', description: 'Dasar bahasa Arab untuk memahami kitab', icon: 'bahasa-arab' },
  { id: 'k8', title: 'Sirah Nabawiyah', description: 'Perjalanan hidup Rasulullah SAW', icon: 'sirah' },
]

const defaultUnggulan: ProgramItem[] = [
  { id: 'u1', title: 'Program Tahfidz Intensif', description: 'Target hafalan minimal 3 Juz selama masa studi', icon: 'tahfidz' },
  { id: 'u2', title: 'Tahsin Al-Quran', description: 'Perbaikan bacaan Al-Quran dengan metode mutqin', icon: 'tahsin' },
  { id: 'u3', title: 'Lomba Keagamaan', description: 'Pembinaan santri untuk mengikuti lomba tingkat kecamatan hingga nasional', icon: 'default' },
]

const defaultEkskul: ProgramItem[] = [
  { id: 'e1', title: 'Kaligrafi', description: 'Seni tulis indah huruf Arab', icon: 'kaligrafi' },
  { id: 'e2', title: 'Pramuka', description: 'Kegiatan kepanduan dan kepemimpinan', icon: 'pramuka' },
  { id: 'e3', title: 'Pidato B. Arab', description: 'Latihan berpidato dalam bahasa Arab', icon: 'pidato' },
  { id: 'e4', title: 'Hadroh & Sholawat', description: 'Seni musik Islami dan sholawat Nabi', icon: 'hadroh' },
]

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
  const schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.schedules || [])

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
          <ProgramGrid items={kelasPrograms.length > 0 ? kelasPrograms : defaultKelas} color={categoryColors['kelas']} />
        </TabsContent>

        <TabsContent value="kurikulum">
          <ProgramGrid items={kurikulumPrograms.length > 0 ? kurikulumPrograms : defaultKurikulum} color={categoryColors['kurikulum']} />
        </TabsContent>

        <TabsContent value="unggulan">
          <ProgramGrid items={unggulanPrograms.length > 0 ? unggulanPrograms : defaultUnggulan} color={categoryColors['unggulan']} />
        </TabsContent>

        <TabsContent value="ekskul">
          <ProgramGrid items={ekskulPrograms.length > 0 ? ekskulPrograms : defaultEkskul} color={categoryColors['ekstrakurikuler']} />
        </TabsContent>
      </Tabs>

      {/* Jadwal KBM */}
      <section className="mt-12">
        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Jadwal KBM
          </h3>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-700 hover:bg-emerald-700">
                  <TableHead className="text-white font-semibold">Hari</TableHead>
                  <TableHead className="text-white font-semibold">Waktu</TableHead>
                  <TableHead className="text-white font-semibold">Mata Pelajaran</TableHead>
                  <TableHead className="text-white font-semibold">Guru</TableHead>
                  <TableHead className="text-white font-semibold">Kelas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map(j => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : schedules.length > 0 ? (
                  schedules.map((schedule: { id: string; day: string; timeStart: string; timeEnd: string; subject?: string; teacher?: string; class?: string }) => (
                    <TableRow key={schedule.id} className="hover:bg-emerald-50">
                      <TableCell className="font-medium text-emerald-800">{schedule.day}</TableCell>
                      <TableCell>{schedule.timeStart} - {schedule.timeEnd}</TableCell>
                      <TableCell>{schedule.subject || '-'}</TableCell>
                      <TableCell>{schedule.teacher || '-'}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">{schedule.class || '-'}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {[
                      { day: 'Senin', time: '14:00 - 15:30', subject: 'Al-Quran & Tajwid', teacher: 'Ust. Ahmad', class: 'Kelas 1-2' },
                      { day: 'Senin', time: '15:30 - 17:00', subject: 'Fiqih Ibadah', teacher: 'Ust. Ibrahim', class: 'Kelas 3-4' },
                      { day: 'Selasa', time: '14:00 - 15:30', subject: 'Aqidah & Akhlaq', teacher: 'Ustz. Aisyah', class: 'Kelas 1-2' },
                      { day: 'Selasa', time: '15:30 - 17:00', subject: 'Bahasa Arab', teacher: 'Ust. Hasan', class: 'Kelas 5-6' },
                      { day: 'Rabu', time: '14:00 - 15:30', subject: 'Tahfidz Al-Quran', teacher: 'Ust. Yusuf', class: 'Semua Kelas' },
                      { day: 'Kamis', time: '14:00 - 15:30', subject: 'Hadits & Sirah', teacher: 'Ust. Ahmad', class: 'Kelas 3-6' },
                      { day: 'Jumat', time: '14:00 - 16:00', subject: "Tahsin & Muroja'ah", teacher: 'Ust. Yusuf', class: 'Semua Kelas' },
                      { day: 'Sabtu', time: '08:00 - 10:00', subject: 'Ekstrakurikuler', teacher: 'Semua Guru', class: 'Semua Kelas' },
                    ].map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-emerald-50">
                        <TableCell className="font-medium text-emerald-800">{item.day}</TableCell>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell>{item.teacher}</TableCell>
                        <TableCell><Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">{item.class}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </div>
  )
}
