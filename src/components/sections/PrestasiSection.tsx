'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Star, Filter } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'santri', label: 'Santri' },
  { value: 'guru', label: 'Guru' },
]

const levelConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'kecamatan': { color: 'bg-emerald-100 text-emerald-700', icon: Medal, label: 'Kecamatan' },
  'kabupaten': { color: 'bg-blue-100 text-blue-700', icon: Medal, label: 'Kabupaten' },
  'provinsi': { color: 'bg-amber-100 text-amber-700', icon: Trophy, label: 'Provinsi' },
  'nasional': { color: 'bg-purple-100 text-purple-700', icon: Trophy, label: 'Nasional' },
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Prestasi</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Daftar prestasi yang diraih oleh santri dan guru MDTA Miftahul Ulum 01</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
            className="px-4 py-2 rounded-full text-sm border border-emerald-200 bg-white text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <Card key={i} className="p-6 border-0">
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-emerald-800 text-sm line-clamp-2">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.achiever}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-xs ${level.color}`}>
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {level.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600">
                            {item.year}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-600">
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
        <Card className="p-12 text-center border-0">
          <Award className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data prestasi</p>
        </Card>
      )}
    </div>
  )
}
