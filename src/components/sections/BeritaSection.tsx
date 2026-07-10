'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'

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

const PAGE_SIZE = 6

export default function BeritaSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNews, setSelectedNews] = useState<{
    id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['news', selectedCategory],
    queryFn: () => fetch(`/api/news${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(r => r.json()),
  })

  const allNews = Array.isArray(data) ? data : (data?.news || [])

  const totalPages = Math.max(1, Math.ceil(allNews.length / PAGE_SIZE))
  // Clamp current page in render (not in effect) in case data shrunk
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const news = allNews.slice(startIndex, endIndex)

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1) // reset to first page when category changes
  }

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goToPage = (pageNum: number) => {
    setCurrentPage(pageNum)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Berita & Kegiatan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-sm text-gray-500 mt-3">
          {allNews.length > 0
            ? `Menampilkan ${startIndex + 1}-${Math.min(endIndex, allNews.length)} dari ${allNews.length} berita`
            : ''}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
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
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item: { id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col"
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
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <h3 className="font-semibold text-emerald-800 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mt-auto">{item.excerpt || item.content?.substring(0, 120) + '...'}</p>
                    <span className="mt-3 text-xs text-emerald-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Baca selengkapnya <ChevronRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 order-2 sm:order-1">
                Halaman <span className="font-semibold text-emerald-700">{safePage}</span> dari <span className="font-semibold text-emerald-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={safePage === 1}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                {/* Page number indicators */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                        safePage === pageNum
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      aria-label={`Halaman ${pageNum}`}
                      aria-current={safePage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={safePage === totalPages}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
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
              <div className="mt-4">
                <MarkdownRenderer content={selectedNews.content} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
