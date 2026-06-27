'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GraduationCap, Quote, Briefcase, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function AlumniSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['alumni'],
    queryFn: () => fetch('/api/alumni').then(r => r.json()),
  })

  const alumni = Array.isArray(data) ? data : (data?.alumni || [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Alumni</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Para alumni MDTA Miftahul Ulum 01 yang telah berkontribusi</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 border-0 text-center">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
              <Skeleton className="h-5 w-24 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </Card>
          ))}
        </div>
      ) : alumni.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((item: { id: string; name: string; year: string; testimony?: string; image?: string; currentActivity?: string }, idx: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-emerald-600 text-white text-xl font-bold">
                        {item.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h4 className="font-semibold text-emerald-800">{item.name}</h4>
                  <Badge variant="outline" className="mt-1 text-xs border-emerald-200 text-emerald-600">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Angkatan {item.year}
                  </Badge>
                  {item.testimony && (
                    <div className="mt-3 text-sm text-gray-500 italic relative">
                      <Quote className="h-4 w-4 text-amber-400 absolute -top-1 -left-1" />
                      <p className="pl-4 line-clamp-3">{item.testimony}</p>
                    </div>
                  )}
                  {item.currentActivity && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
                      <Briefcase className="h-3 w-3" />
                      {item.currentActivity}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Ahmad Rizki', year: '2018', activity: 'Mahasiswa UIN Jakarta', testimony: 'Alhamdulillah, ilmu yang saya dapatkan di Miftahul Ulum sangat bermanfaat.' },
            { name: 'Siti Nurhaliza', year: '2019', activity: 'Guru Tahfidz', testimony: 'Madrasah ini membentuk karakter dan hafalan Al-Quran saya.' },
            { name: 'Muhammad Fadli', year: '2020', activity: 'Santri Ponpes Al-Zaytun', testimony: 'Dasar keagamaan yang kuat dari Miftahul Ulum sangat membantu.' },
            { name: 'Aisyah Putri', year: '2017', activity: 'Dai & Motivator', testimony: 'Saya bangga pernah bersekolah di Miftahul Ulum 01.' },
            { name: 'Hasan Basri', year: '2021', activity: 'Mahasiswa STAI', testimony: 'Lingkungan Islami di madrasah membentuk pribadi yang lebih baik.' },
            { name: 'Fatimah Zahra', year: '2016', activity: 'Pengusaha Muslimah', testimony: 'Pendidikan akhlak di Miftahul Ulum menjadi bekal saya.' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarFallback className="bg-emerald-600 text-white text-xl font-bold">
                      {item.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-emerald-800">{item.name}</h4>
                  <Badge variant="outline" className="mt-1 text-xs border-emerald-200 text-emerald-600">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Angkatan {item.year}
                  </Badge>
                  <div className="mt-3 text-sm text-gray-500 italic relative">
                    <Quote className="h-4 w-4 text-amber-400 absolute -top-1 -left-1" />
                    <p className="pl-4 line-clamp-3">{item.testimony}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Briefcase className="h-3 w-3" />
                    {item.activity}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
