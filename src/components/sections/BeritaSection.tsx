'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, Tag, X } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'phbi', label: 'PHBI' },
  { value: 'keagamaan', label: 'Keagamaan' },
  { value: 'lomba', label: 'Lomba' },
  { value: 'prestasi', label: 'Prestasi' },
]

const categoryColors: Record<string, string> = {
  'kegiatan': 'bg-emerald-100 text-emerald-700',
  'phbi': 'bg-amber-100 text-amber-700',
  'keagamaan': 'bg-teal-100 text-teal-700',
  'lomba': 'bg-purple-100 text-purple-700',
  'prestasi': 'bg-amber-100 text-amber-800',
}

export default function BeritaSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedNews, setSelectedNews] = useState<{
    id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['news', selectedCategory],
    queryFn: () => fetch(`/api/news${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(r => r.json()),
  })

  const news = Array.isArray(data) ? data : (data?.news || [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Berita & Kegiatan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
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

      {/* News Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden border-0">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item: { id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string }, idx: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedNews(item)}
              >
                <div className="h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                  <Badge className={`absolute top-3 left-3 text-xs ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                    {item.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 className="font-semibold text-emerald-800 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt || item.content?.substring(0, 120) + '...'}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-0">
          <BookOpen className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada berita untuk kategori ini</p>
        </Card>
      )}

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          {selectedNews && (
            <>
              <DialogTitle className="text-xl font-bold text-emerald-800 pr-8">
                {selectedNews.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={categoryColors[selectedNews.category] || 'bg-gray-100 text-gray-700'}>
                  {selectedNews.category}
                </Badge>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(selectedNews.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {selectedNews.image && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-auto" />
                </div>
              )}
              <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
                {selectedNews.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
