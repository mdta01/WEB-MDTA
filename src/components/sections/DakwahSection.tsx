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

const categoryTabs = [
  { value: 'artikel', label: 'Artikel', icon: FileText },
  { value: 'kajian', label: 'Kajian', icon: BookHeart },
  { value: 'kultum', label: 'Kultum', icon: Mic },
  { value: 'materi', label: 'Materi', icon: BookOpen },
]

const categoryColors: Record<string, string> = {
  'artikel': 'bg-emerald-100 text-emerald-700',
  'kajian': 'bg-teal-100 text-teal-700',
  'kultum': 'bg-amber-100 text-amber-700',
  'materi': 'bg-purple-100 text-purple-700',
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Dakwah & Kajian</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-emerald-50">
          {categoryTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-xs md:text-sm"
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group h-full overflow-hidden"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image / Video thumbnail */}
                  {(item.image || item.videoUrl) && (
                    <div className="h-40 bg-gradient-to-br from-emerald-400 to-teal-600 relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookHeart className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      {/* Video play indicator */}
                      {item.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 text-xs ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    {!item.image && !item.videoUrl && (
                      <Badge className={`text-xs mb-3 ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category}
                      </Badge>
                    )}
                    <h4 className="font-semibold text-emerald-800 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                      {item.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
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
            <BookOpen className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada konten untuk kategori ini</p>
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
              <DialogTitle className="text-xl font-bold text-emerald-800 pr-8">
                {selectedItem.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={categoryColors[selectedItem.category] || 'bg-gray-100 text-gray-700'}>
                  {selectedItem.category}
                </Badge>
                <span className="text-xs text-gray-400">{selectedItem.author || 'Tim Dakwah'}</span>
                <span className="text-xs text-gray-400">
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
              <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
                {selectedItem.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
