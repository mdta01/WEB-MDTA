'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { KratonSectionHeader } from '@/components/kraton'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'phbi', label: 'PHBI' },
  { value: 'keagamaan', label: 'Keagamaan' },
  { value: 'lomba', label: 'Lomba' },
  { value: 'prestasi', label: 'Prestasi' },
]

const categoryColors: Record<string, string> = {
  'kegiatan': 'bg-[#003527]/15 text-[#003527]',
  'phbi': 'bg-[#cca72f]/20 text-[#895033]',
  'keagamaan': 'bg-[#064e3b]/15 text-[#064e3b]',
  'lomba': 'bg-[#895033]/15 text-[#895033]',
  'prestasi': 'bg-[#cca72f]/20 text-[#895033]',
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <KratonSectionHeader
        badge="Informasi Publik"
        title="Berita & Kegiatan"
        subtitle={allNews.length > 0
          ? `Menampilkan ${startIndex + 1}-${Math.min(endIndex, allNews.length)} dari ${allNews.length} berita`
          : 'Kabar terkini seputar kegiatan madrasah'}
        align="center"
      />

      {/* Category Filter — pill style with Kraton colors */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-2 ${
              selectedCategory === cat.value
                ? 'bg-[#003527] text-white border-[#003527] shadow-premium scale-105'
                : 'bg-[#ffffff] text-[#003527] border-[#e4e2de] hover:border-[#cca72f]/40 hover:bg-[#f5f3ef] hover:scale-105'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden border border-[#e4e2de] rounded-2xl">
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
          <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {news.map((item: { id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.4 }}
              >
                <Card
                  className="overflow-hidden border border-[#e4e2de] shadow-premium wood-carved-shadow card-hover cursor-pointer group h-full flex flex-col rounded-2xl bg-[#ffffff] relative"
                  onClick={() => setSelectedNews(item)}
                >
                  {/* Top gold accent bar — appears on hover */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#cca72f] via-[#ffe088] to-[#cca72f] opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-hidden />

                  {/* Image area */}
                  <div className="h-44 sm:h-48 bg-gradient-to-br from-[#064e3b] to-[#003527] relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/40" />
                      </div>
                    )}
                    {/* Gradient overlay at bottom of image for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#003527]/40 via-transparent to-transparent" />
                    <Badge className={`absolute top-3 left-3 text-[10px] uppercase tracking-wide backdrop-blur-sm ${categoryColors[item.category] || 'bg-[#f5f3ef] text-[#404944]'} shadow-md border-0`}>
                      {item.category}
                    </Badge>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Date — with Clock icon */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[#404944]/70 mb-2">
                      <Clock className="h-3 w-3 text-[#cca72f]" />
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Title — font-display for hierarchy */}
                    <h3 className="font-body font-semibold text-[#003527] text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-[#064e3b] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Excerpt — leading-relaxed for readability */}
                    <p className="text-xs sm:text-sm text-[#404944] line-clamp-3 mt-auto leading-relaxed">{item.excerpt || item.content?.substring(0, 120) + '...'}</p>

                    {/* Read more — with gold accent */}
                    <span className="mt-3 text-xs text-[#003527] font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Baca selengkapnya
                      <ChevronRight className="h-3 w-3 text-[#cca72f]" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e4e2de]">
              <p className="text-sm text-[#404944] order-2 sm:order-1">
                Halaman <span className="font-semibold text-[#003527]">{safePage}</span> dari <span className="font-semibold text-[#003527]">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={safePage === 1}
                  className="border-[#e4e2de] text-[#003527] hover:bg-[#f5f3ef] hover:text-[#064e3b] hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-full transition-all"
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
                      className={`h-9 w-9 rounded-full text-sm font-medium transition-all duration-300 ${
                        safePage === pageNum
                          ? 'bg-gradient-to-br from-[#003527] to-[#064e3b] text-white shadow-md scale-110'
                          : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#efeeea] hover:scale-110'
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
                  className="border-[#e4e2de] text-[#003527] hover:bg-[#f5f3ef] hover:text-[#064e3b] hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-full transition-all"
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
          <BookOpen className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944]">Belum ada berita untuk kategori ini</p>
        </Card>
      )}

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" showCloseButton={false}>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          {selectedNews && (
            <>
              <DialogTitle className="text-xl font-bold text-[#003527] pr-8">
                {selectedNews.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={categoryColors[selectedNews.category] || 'bg-[#f5f3ef] text-[#404944]'}>
                  {selectedNews.category}
                </Badge>
                <span className="text-xs text-[#404944]/70 flex items-center gap-1">
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
