'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Eye, Target, Users, Award, GraduationCap, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ProfilSection() {
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetch('/api/teachers').then(r => r.json()),
  })

  const teachers = Array.isArray(teachersData) ? teachersData : (teachersData?.teachers || [])

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
                  <h3 className="text-2xl font-bold mb-2">MDTA Miftahul Ulum 01</h3>
                  <p className="text-emerald-200 text-sm">Berdiri sejak tahun 1995</p>
                </div>
              </div>
              <div className="md:col-span-3 p-8">
                <p className="text-gray-600 leading-relaxed mb-4">
                  MDTA Miftahul Ulum 01 didirikan pada tahun 1995 oleh para ulama dan tokoh masyarakat yang peduli terhadap 
                  pendidikan Islam di wilayah ini. Bermula dari pengajian kecil di musholla desa, madrasah ini terus berkembang 
                  hingga menjadi lembaga pendidikan Islam yang dikelola secara profesional.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Selama lebih dari dua dekade, MDTA Miftahul Ulum 01 telah mencetak ratusan alumni yang tersebar di berbagai 
                  daerah, banyak di antaranya yang melanjutkan pendidikan ke jenjang yang lebih tinggi dan menjadi figur yang 
                  bermanfaat bagi masyarakat.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Dengan semangat untuk terus meningkatkan kualitas pendidikan, madrasah ini senantiasa mengembangkan kurikulum, 
                  meningkatkan kompetensi tenaga pengajar, dan melengkapi fasilitas pembelajaran.
                </p>
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
                <p className="text-gray-600 text-sm leading-relaxed">
                  Menjadi lembaga pendidikan Islam yang unggul, berwawasan, dan berakhlakul karimah dalam membentuk generasi 
                  Muslim yang tangguh iman, cerdas ilmu, dan mulia akhlak.
                </p>
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
                <ul className="text-gray-600 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Menyelenggarakan pendidikan Islam yang berkualitas dan terpadu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Mengembangkan kurikulum berbasis Al-Quran dan As-Sunnah</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Meningkatkan kompetensi tenaga pendidik secara berkelanjutan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Membina akhlak dan karakter santri melalui keteladanan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Membangun lingkungan pembelajaran yang kondusif dan Islami</span>
                  </li>
                </ul>
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
                <ul className="text-gray-600 text-sm leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Menghasilkan lulusan yang hafal Al-Quran minimal 3 Juz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Menumbuhkan semangat belajar dan berprestasi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Membentuk santri yang berakhlakul karimah</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Menjalin kerjasama yang baik dengan orang tua dan masyarakat</span>
                  </li>
                </ul>
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
            <div className="flex flex-col items-center">
              {/* Kepala */}
              <div className="bg-emerald-700 text-white rounded-xl px-6 py-3 text-center mb-2">
                <p className="font-bold">Kepala Madrasah</p>
                <p className="text-emerald-200 text-xs">Ust. Ahmad Fauzi, S.Pd.I</p>
              </div>
              <div className="w-px h-6 bg-emerald-300" />
              {/* Wakil */}
              <div className="bg-emerald-600 text-white rounded-xl px-6 py-3 text-center mb-2">
                <p className="font-bold">Wakil Kepala</p>
                <p className="text-emerald-200 text-xs">Ustz. Siti Aisyah, S.Ag</p>
              </div>
              <div className="w-px h-6 bg-emerald-300" />
              {/* Staff */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                {[
                  { role: 'Sekretaris', name: 'Ust. Hasan, S.Pd.I' },
                  { role: 'Bendahara', name: 'Ustz. Fatimah, S.E' },
                  { role: 'Kurikulum', name: 'Ust. Ibrahim, M.Pd.I' },
                  { role: 'Kesantrian', name: 'Ust. Yusuf, S.Pd.I' },
                ].map((item) => (
                  <div key={item.role} className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                    <p className="font-semibold text-emerald-700 text-xs">{item.role}</p>
                    <p className="text-gray-500 text-[10px]">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Guru */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Tenaga Pengajar</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        {teachersLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="p-4 text-center border-0">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </Card>
            ))}
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {teachers.map((teacher: { id: string; name: string; position: string; subject?: string; image?: string }, idx: number) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="text-center p-4 md:p-6 border-0 shadow-md hover:shadow-lg transition-shadow group">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    {teacher.image ? (
                      <img src={teacher.image} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-emerald-600 text-white text-xl font-bold">
                        {teacher.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h4 className="font-semibold text-emerald-800 text-sm">{teacher.name}</h4>
                  <Badge variant="secondary" className="mt-1 text-xs bg-emerald-50 text-emerald-700">
                    {teacher.position}
                  </Badge>
                  {teacher.subject && (
                    <p className="text-xs text-gray-400 mt-1">{teacher.subject}</p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0">
            <Users className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Data guru belum tersedia</p>
          </Card>
        )}
      </section>
    </div>
  )
}
