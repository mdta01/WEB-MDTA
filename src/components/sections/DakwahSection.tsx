'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Mic, BookHeart, FileText, X, User, Calendar, Play, Clock } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KratonSectionHeader } from '@/components/kraton'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'

const categoryTabs = [
  { value: 'artikel', label: 'Artikel', icon: FileText },
  { value: 'kajian', label: 'Kajian', icon: BookHeart },
  { value: 'kultum', label: 'Kultum', icon: Mic },
  { value: 'materi', label: 'Materi', icon: BookOpen },
]

const categoryColors: Record<string, string> = {
  'artikel': 'bg-[#003527]/15 text-[#003527]',
  'kajian': 'bg-[#064e3b]/15 text-[#064e3b]',
  'kultum': 'bg-[#cca72f]/20 text-[#895033]',
  'materi': 'bg-[#895033]/15 text-[#895033]',
}

export default function DakwahSection() {
  const [activeTab, setActiveTab] = useState('artikel')
  const [selectedItem, setSelectedItem] = useState<{
    id: string; title: string; content: string; category: string; author?: string; image?: string; videoUrl?: string; createdAt: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['dakwah', activeTab],
    queryFn: () => fetch(`/api/dakwah?category=${activeTab}`).then(r => r.json()),
  })

  const dakwah = Array.isArray(data) ? data : (data?.dakwah || [])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <KratonSectionHeader
        badge="Inspirasi Islami"
        title="Dakwah & Kajian"
        subtitle="Renungan, kajian, dan ceramah keagamaan untuk menambah ilmu dan iman"
        align="center"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-[#f5f3ef] rounded-2xl p-1.5 border border-[#e4e2de]">
          {categoryTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-[#003527] data-[state=active]:text-white data-[state=active]:shadow-premium rounded-xl text-xs md:text-sm transition-all"
            >
              <tab.icon className="h-4 w-4 mr-1 hidden sm:block" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isLoading ? (
          <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-5 border border-[#e4e2de] rounded-2xl">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : dakwah.length > 0 ? (
          <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-4 sm:gap-6">
            {dakwah.map((item: { id: string; title: string; content: string; category: string; author?: string; image?: string; videoUrl?: string; createdAt: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.4 }}
              >
                <Card
                  className="border border-[#e4e2de] shadow-premium wood-carved-shadow card-hover cursor-pointer group h-full overflow-hidden rounded-2xl bg-[#ffffff] relative"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Top gold accent bar — appears on hover */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#cca72f] via-[#ffe088] to-[#cca72f] opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-hidden />

                  {/* Image / Video thumbnail */}
                  {(item.image || item.videoUrl) && (
                    <div className="h-36 sm:h-40 bg-gradient-to-br from-[#064e3b] to-[#003527] relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookHeart className="h-12 w-12 text-white/40" />
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#003527]/40 via-transparent to-transparent" />
                      {/* Video play indicator */}
                      {item.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#003527]/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#003527]/80 group-hover:scale-110 transition-all duration-300 border-2 border-[#cca72f]">
                            <Play className="h-5 w-5 text-[#ffe088] ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 text-[10px] uppercase tracking-wide backdrop-blur-sm ${categoryColors[item.category] || 'bg-[#f5f3ef] text-[#404944]'} shadow-md border-0`}>
                        {item.category}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-5">
                    {!item.image && !item.videoUrl && (
                      <Badge className={`text-[10px] uppercase tracking-wide mb-3 ${categoryColors[item.category] || 'bg-[#f5f3ef] text-[#404944]'} border-0`}>
                        {item.category}
                      </Badge>
                    )}
                    <h4 className="font-body font-semibold text-[#003527] text-sm sm:text-base mb-2 group-hover:text-[#064e3b] transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#404944] line-clamp-3 mb-3 leading-relaxed">
                      {item.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#404944]/70 pt-2 border-t border-[#e4e2de]">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#cca72f]" />
                        {item.author || 'Tim Dakwah'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#cca72f]" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-0">
            <BookOpen className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
            <p className="text-[#404944]">Belum ada konten untuk kategori ini</p>
          </Card>
        )}
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" showCloseButton={false}>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          {selectedItem && (
            <>
              <DialogTitle className="text-xl font-bold text-[#003527] pr-8">
                {selectedItem.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={categoryColors[selectedItem.category] || 'bg-[#f5f3ef] text-[#404944]'}>
                  {selectedItem.category}
                </Badge>
                <span className="text-xs text-[#404944]/70">{selectedItem.author || 'Tim Dakwah'}</span>
                <span className="text-xs text-[#404944]/70">
                  {new Date(selectedItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {/* Image (if no video, show image; if video exists, show video embed instead) */}
              {selectedItem.image && !selectedItem.videoUrl && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-auto" />
                </div>
              )}
              {/* Video embed */}
              {selectedItem.videoUrl && (
                <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-black">
                  <iframe src={selectedItem.videoUrl} className="w-full h-full" allowFullScreen />
                </div>
              )}
              <div className="mt-4">
                <MarkdownRenderer content={selectedItem.content} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
