'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'formulir', label: 'Formulir' },
  { value: 'jadwal', label: 'Jadwal' },
  { value: 'materi', label: 'Materi' },
  { value: 'surat', label: 'Surat' },
  { value: 'lainnya', label: 'Lainnya' },
]

const fileTypeIcons: Record<string, React.ElementType> = {
  'pdf': FileText,
  'doc': FileText,
  'docx': FileText,
  'xls': FileSpreadsheet,
  'xlsx': FileSpreadsheet,
  'jpg': FileImage,
  'png': FileImage,
  'default': File,
}

const fileTypeColors: Record<string, string> = {
  'pdf': 'bg-red-100 text-red-600',
  'doc': 'bg-blue-100 text-blue-600',
  'docx': 'bg-blue-100 text-blue-600',
  'xls': 'bg-green-100 text-green-600',
  'xlsx': 'bg-green-100 text-green-600',
  'jpg': 'bg-purple-100 text-purple-600',
  'png': 'bg-purple-100 text-purple-600',
  'default': 'bg-gray-100 text-gray-600',
}

function getFileType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ext in fileTypeIcons ? ext : 'default'
}

export default function DownloadSection() {
  const [selectedCategory, setSelectedCategory] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['downloads', selectedCategory],
    queryFn: () => fetch(`/api/downloads${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(r => r.json()),
  })

  const downloads = Array.isArray(data) ? data : (data?.downloads || [])

  const grouped = downloads.reduce((acc: Record<string, typeof downloads>, item: { category: string }) => {
    const cat = item.category || 'lainnya'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Download</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Unduh formulir, jadwal, materi, dan dokumen lainnya</p>
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

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5 border-0">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : downloads.length > 0 ? (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-lg font-bold text-emerald-800 mb-4 capitalize">{category}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {(items as { id: string; title: string; fileUrl: string; category: string; createdAt: string }[]).map((item, idx) => {
                const fileType = getFileType(item.fileUrl)
                const FileIcon = fileTypeIcons[fileType] || fileTypeIcons['default']
                const colorClass = fileTypeColors[fileType] || fileTypeColors['default']
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                          <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-emerald-800 text-sm truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs uppercase">{fileType}</Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0 text-emerald-600 hover:bg-emerald-50" asChild>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <Card className="p-12 text-center border-0">
          <Download className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada file untuk diunduh</p>
        </Card>
      )}
    </div>
  )
}
