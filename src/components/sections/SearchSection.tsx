'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, BookOpen, Megaphone, GraduationCap, Award, Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/useAppStore'

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  date?: string
}

export default function SearchSection() {
  const { searchQuery, setSearchQuery, setCurrentPage } = useAppStore()

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['news-search'],
    queryFn: () => fetch('/api/news').then(r => r.json()),
    enabled: searchQuery.length >= 2,
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-search'],
    queryFn: () => fetch('/api/announcements').then(r => r.json()),
    enabled: searchQuery.length >= 2,
  })

  const { data: programsData } = useQuery({
    queryKey: ['programs-search'],
    queryFn: () => fetch('/api/programs').then(r => r.json()),
    enabled: searchQuery.length >= 2,
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements-search'],
    queryFn: () => fetch('/api/achievements').then(r => r.json()),
    enabled: searchQuery.length >= 2,
  })

  const { data: eventsData } = useQuery({
    queryKey: ['events-search'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
    enabled: searchQuery.length >= 2,
  })

  const results = useMemo<SearchResult[]>(() => {
    if (searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    const all: SearchResult[] = []

    const news = Array.isArray(newsData) ? newsData : (newsData?.news || [])
    news.forEach((item: { id: string; title: string; excerpt?: string; content: string; category: string; createdAt: string }) => {
      if (item.title.toLowerCase().includes(q) || (item.excerpt || item.content).toLowerCase().includes(q)) {
        all.push({ id: item.id, title: item.title, description: item.excerpt || item.content.substring(0, 150), type: 'berita', date: item.createdAt })
      }
    })

    const announcements = Array.isArray(announcementsData) ? announcementsData : (announcementsData?.announcements || [])
    announcements.forEach((item: { id: string; title: string; content: string; type: string; createdAt: string }) => {
      if (item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)) {
        all.push({ id: item.id, title: item.title, description: item.content.substring(0, 150), type: 'pengumuman', date: item.createdAt })
      }
    })

    const programs = Array.isArray(programsData) ? programsData : (programsData?.programs || [])
    programs.forEach((item: { id: string; title: string; description: string; category: string }) => {
      if (item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) {
        all.push({ id: item.id, title: item.title, description: item.description, type: 'program' })
      }
    })

    const achievements = Array.isArray(achievementsData) ? achievementsData : (achievementsData?.achievements || [])
    achievements.forEach((item: { id: string; title: string; description?: string; achiever: string; year: string }) => {
      if (item.title.toLowerCase().includes(q) || item.achiever.toLowerCase().includes(q)) {
        all.push({ id: item.id, title: item.title, description: item.description || `Prestasi oleh ${item.achiever} (${item.year})`, type: 'prestasi' })
      }
    })

    const events = Array.isArray(eventsData) ? eventsData : (eventsData?.events || [])
    events.forEach((item: { id: string; title: string; description?: string; date: string }) => {
      if (item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)) {
        all.push({ id: item.id, title: item.title, description: item.description || '', type: 'kegiatan', date: item.date })
      }
    })

    return all
  }, [searchQuery, newsData, announcementsData, programsData, achievementsData, eventsData])

  const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; page: string }> = {
    'berita': { icon: BookOpen, label: 'Berita', color: 'bg-emerald-100 text-emerald-700', page: 'berita' },
    'pengumuman': { icon: Megaphone, label: 'Pengumuman', color: 'bg-amber-100 text-amber-700', page: 'pengumuman' },
    'program': { icon: GraduationCap, label: 'Program', color: 'bg-teal-100 text-teal-700', page: 'program' },
    'prestasi': { icon: Award, label: 'Prestasi', color: 'bg-purple-100 text-purple-700', page: 'prestasi' },
    'kegiatan': { icon: Calendar, label: 'Kegiatan', color: 'bg-blue-100 text-blue-700', page: 'berita' },
  }

  const isLoading = newsLoading

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Pencarian</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
        <Input
          placeholder="Cari berita, program, pengumuman..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg border-emerald-200 focus:border-emerald-500 shadow-md"
          autoFocus
        />
      </div>

      {/* Results */}
      {isLoading && searchQuery.length >= 2 ? (
        <div className="max-w-xl mx-auto space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 border-0">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : searchQuery.length >= 2 ? (
        results.length > 0 ? (
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-sm text-gray-400 mb-4">Ditemukan {results.length} hasil untuk &ldquo;{searchQuery}&rdquo;</p>
            {results.map((result, idx) => {
              const config = typeConfig[result.type] || typeConfig['berita']
              const TypeIcon = config.icon
              return (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card
                    className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => {
                      setCurrentPage(config.page as 'berita' | 'pengumuman' | 'program' | 'prestasi')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                            {result.date && (
                              <span className="text-xs text-gray-400">
                                {new Date(result.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-emerald-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {result.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center border-0 max-w-md mx-auto">
            <Search className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ditemukan hasil untuk &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-gray-400 text-sm mt-1">Coba kata kunci yang berbeda</p>
          </Card>
        )
      ) : (
        <Card className="p-12 text-center border-0 max-w-md mx-auto">
          <Search className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Ketik minimal 2 karakter untuk mulai mencari</p>
        </Card>
      )}
    </div>
  )
}
