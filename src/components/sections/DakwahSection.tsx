'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Mic, BookHeart, FileText, X, User, Calendar, Play } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="text-center mb-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="inline-block px-3 py-0.5 rounded-full bg-[#064e3b]/15 text-[#003527] text-xs font-semibold uppercase tracking-wider mb-2"
        >
          Inspirasi Islami
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gradient-emerald"
        >
          Dakwah & Kajian
        </motion.h2>
        <div className="w-20 h-1 bg-gradient-to-r from-[#003527] to-[#cca72f] mx-auto mt-2 rounded-full" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-[#f5f3ef] rounded-2xl p-1.5">
          {categoryTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-[#003527] data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl text-xs md:text-sm transition-all"
            >
              <tab.icon className="h-4 w-4 mr-1 hidden sm:block" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-5 border-0">
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
          <div className="grid md:grid-cols-2 gap-6">
            {dakwah.map((item: { id: string; title: string; content: string; category: string; author?: string; image?: string; videoUrl?: string; createdAt: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
              >
                <Card
                  className="border border-[#e4e2de] shadow-premium card-hover cursor-pointer group h-full overflow-hidden rounded-2xl bg-[#ffffff]"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image / Video thumbnail */}
                  {(item.image || item.videoUrl) && (
                    <div className="h-40 bg-gradient-to-br from-[#064e3b] to-[#003527] relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookHeart className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      {/* Video play indicator */}
                      {item.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 group-hover:scale-110 transition-all duration-300">
                            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 text-xs backdrop-blur-sm ${categoryColors[item.category] || 'bg-[#f5f3ef] text-[#404944]'} shadow-md`}>
                        {item.category}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    {!item.image && !item.videoUrl && (
                      <Badge className={`text-xs mb-3 ${categoryColors[item.category] || 'bg-[#f5f3ef] text-[#404944]'}`}>
                        {item.category}
                      </Badge>
                    )}
                    <h4 className="font-semibold text-[#003527] mb-2 group-hover:text-[#064e3b] transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#404944] line-clamp-3 mb-3">
                      {item.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#404944]/70">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.author || 'Tim Dakwah'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
