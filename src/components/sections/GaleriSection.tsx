'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Play, X } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'phbi', label: 'PHBI' },
  { value: 'akademik', label: 'Akademik' },
  { value: 'lomba', label: 'Lomba' },
  { value: 'wisuda', label: 'Wisuda' },
]

const gradientVariants = [
  'from-emerald-400 to-teal-600',
  'from-emerald-500 to-emerald-700',
  'from-teal-400 to-emerald-600',
  'from-emerald-600 to-teal-800',
  'from-amber-400 to-amber-600',
  'from-emerald-400 to-cyan-600',
]

export default function GaleriSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedImage, setSelectedImage] = useState<{
    id: string; title: string; image: string; category: string; year?: string; type: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', selectedCategory],
    queryFn: () => fetch(`/api/gallery${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(r => r.json()),
  })

  const gallery = Array.isArray(data) ? data : (data?.gallery || [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Galeri</h2>
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

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : gallery.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item: { id: string; title: string; image: string; category: string; year?: string; type: string }, idx: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="cursor-pointer group"
              onClick={() => setSelectedImage(item)}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {item.type === 'video' ? (
                  <div className={`w-full h-full bg-gradient-to-br ${gradientVariants[idx % gradientVariants.length]} flex items-center justify-center`}>
                    <Play className="h-12 w-12 text-white/70" />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium line-clamp-2">{item.title}</p>
                    <Badge className="mt-1 text-xs bg-emerald-600 text-white">{item.category}</Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-xl bg-gradient-to-br ${gradientVariants[idx % gradientVariants.length]} flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <ImageIcon className="h-10 w-10 text-white/50" />
            </div>
          ))}
        </div>
      )}

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedImage?.title || 'Galeri'}</DialogTitle>
          {selectedImage && (
            <div>
              <div className="relative">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain bg-black"
                />
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-black/50 text-white hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-emerald-800">{selectedImage.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{selectedImage.category}</Badge>
                  {selectedImage.year && (
                    <Badge variant="outline" className="text-xs">{selectedImage.year}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
