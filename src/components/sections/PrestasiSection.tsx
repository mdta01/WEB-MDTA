'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Filter } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { KratonSectionHeader } from '@/components/kraton'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'santri', label: 'Santri' },
  { value: 'guru', label: 'Guru' },
]

// Kraton palette: deep emerald (primary), primary container (mid), teak wood (secondary), antique gold (accent)
const levelConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'kecamatan': { color: 'bg-[#064e3b]/15 text-[#003527]', icon: Medal, label: 'Kecamatan' },
  'kabupaten': { color: 'bg-[#895033]/15 text-[#895033]', icon: Medal, label: 'Kabupaten' },
  'provinsi': { color: 'bg-[#cca72f]/20 text-[#895033]', icon: Trophy, label: 'Provinsi' },
  'nasional': { color: 'bg-[#cca72f] text-[#003527]', icon: Trophy, label: 'Nasional' },
}

export default function PrestasiSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['achievements', selectedCategory],
    queryFn: () => fetch(`/api/achievements${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(r => r.json()),
  })

  const achievements = Array.isArray(data) ? data : (data?.achievements || [])

  const years = [...new Set(achievements.map((a: { year: string }) => a.year))].sort().reverse()

  const filteredAchievements = selectedYear
    ? achievements.filter((a: { year: string }) => a.year === selectedYear)
    : achievements

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <KratonSectionHeader
        badge="Inspirasi"
        title="Prestasi"
        subtitle="Daftar prestasi yang diraih oleh santri dan guru MDTA Miftahul Ulum 01"
        align="center"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#003527]" />
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-[#003527] text-white shadow-premium'
                  : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#064e3b]/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {years.length > 0 && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 rounded-full text-sm border border-[#e4e2de] bg-[#ffffff] text-[#003527] focus:outline-none focus:ring-2 focus:ring-[#cca72f]/40 focus:border-[#003527] font-body"
          >
            <option value="">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </div>

      {/* Achievement Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 border-[#e4e2de] bg-[#ffffff] rounded-2xl">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredAchievements.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((item: { id: string; title: string; description?: string; achiever: string; category: string; level?: string; year: string }, idx: number) => {
            const level = levelConfig[item.level || ''] || levelConfig['kecamatan']
            const LevelIcon = level.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
              >
                <Card className="border-[#e4e2de] bg-[#ffffff] wood-carved-shadow card-hover h-full group rounded-2xl relative overflow-hidden">
                  {/* Top gold accent bar (appears on hover) */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#cca72f] via-[#ffe088] to-[#cca72f] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#cca72f] to-[#895033] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#003527] text-sm line-clamp-2 font-display">{item.title}</h4>
                        <p className="text-xs text-[#404944] mt-1 font-body">{item.achiever}</p>
                        {item.description && (
                          <p className="text-xs text-[#404944]/70 mt-1 line-clamp-2 font-body">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-xs ${level.color} border-0`}>
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {level.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-[#e4e2de] text-[#003527]">
                            {item.year}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-[#064e3b]/10 text-[#003527]">
                            {item.category === 'santri' ? 'Santri' : 'Guru'}
                          </Badge>
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
        <Card className="p-12 text-center border-[#e4e2de] bg-[#ffffff] wood-carved-shadow rounded-2xl">
          <Award className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944] font-body">Belum ada data prestasi</p>
        </Card>
      )}
    </div>
  )
}
