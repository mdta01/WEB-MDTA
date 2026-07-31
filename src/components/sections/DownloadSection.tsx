'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, FileText, FileSpreadsheet, FileImage, File, Eye, X } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const categories = [
  { value: '', label: 'Semua' },
  { value: 'formulir', label: 'Formulir' },
  { value: 'kalender', label: 'Kalender' },
  { value: 'tata_tertib', label: 'Tata Tertib' },
  { value: 'jadwal', label: 'Jadwal' },
  { value: 'surat_edaran', label: 'Surat Edaran' },
  { value: 'lainnya', label: 'Lainnya' },
]

const fileTypeIcons: Record<string, React.ElementType> = {
  'pdf': FileText,
  'doc': FileText,
  'docx': FileText,
  'xls': FileSpreadsheet,
  'xlsx': FileSpreadsheet,
  'ppt': FileText,
  'pptx': FileText,
  'zip': File,
  'txt': FileText,
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
  'ppt': 'bg-orange-100 text-orange-600',
  'pptx': 'bg-orange-100 text-orange-600',
  'zip': 'bg-[#cca72f]/20 text-[#895033]',
  'txt': 'bg-gray-100 text-gray-600',
  'jpg': 'bg-purple-100 text-purple-600',
  'png': 'bg-purple-100 text-purple-600',
  'default': 'bg-gray-100 text-gray-600',
}

const fileTypeLabels: Record<string, string> = {
  'pdf': 'PDF',
  'doc': 'DOC',
  'docx': 'DOCX',
  'xls': 'XLS',
  'xlsx': 'XLSX',
  'ppt': 'PPT',
  'pptx': 'PPTX',
  'zip': 'ZIP',
  'txt': 'TXT',
  'default': 'FILE',
}

// Extract file type from Cloudinary URL or filename
// Cloudinary raw URLs look like: /raw/upload/v123/mdta/downloads/filename.pdf
// or without extension: /raw/upload/v123/mdta/downloads/filename
function getFileType(url: string): string {
  // Try to extract extension from the URL path
  const pathPart = url.split('/').pop()?.split('?')[0] || ''
  const extMatch = pathPart.match(/\.([a-zA-Z0-9]+)$/)
  if (extMatch) {
    const ext = extMatch[1].toLowerCase()
    if (ext in fileTypeIcons) return ext
  }
  // If no extension found, check if URL contains 'pdf' or 'doc' in the path
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) return 'pdf'
  if (lowerUrl.includes('.doc') || lowerUrl.includes('doc')) return 'doc'
  if (lowerUrl.includes('.xls') || lowerUrl.includes('xls')) return 'xls'
  return 'default'
}

export default function DownloadSection() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [previewItem, setPreviewItem] = useState<{ id: string; title: string; fileUrl: string } | null>(null)

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="text-center mb-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="inline-block px-3 py-0.5 rounded-full bg-[#064e3b]/15 text-[#003527] text-xs font-semibold uppercase tracking-wider mb-2"
        >
          Pusat Unduhan
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gradient-emerald"
        >
          Download
        </motion.h2>
        <div className="w-20 h-1 bg-gradient-to-r from-[#003527] to-[#cca72f] mx-auto mt-2 rounded-full" />
        <p className="text-[#404944] mt-3 text-sm">Unduh formulir, jadwal, materi, dan dokumen lainnya</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === cat.value
                ? 'bg-[#003527] text-white shadow-md shadow-[#003527]/30 scale-105'
                : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#efeeea] hover:scale-105'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-4">
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
            <h3 className="text-lg font-bold text-[#003527] mb-4 capitalize flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-[#cca72f] to-[#895033] rounded-full" />
              {category}
            </h3>
            <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-4">
              {(items as { id: string; title: string; fileUrl: string; category: string; createdAt: string }[]).map((item, idx) => {
                const fileType = getFileType(item.fileUrl)
                const FileIcon = fileTypeIcons[fileType] || fileTypeIcons['default']
                const colorClass = fileTypeColors[fileType] || fileTypeColors['default']
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                  >
                    {/* Wrapper div constrains card to grid column width (prevents overflow) */}
                    <div className="min-w-0 max-w-full">
                    <Card className="border border-[#e4e2de] shadow-premium card-hover rounded-2xl bg-[#ffffff] w-full overflow-hidden">
                      <CardContent className="p-3 sm:p-4 min-w-0">
                        {/* Mobile: stack vertical. Desktop: horizontal row. */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${colorClass} flex items-center justify-center shrink-0 shadow-md`}>
                            <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#003527] text-sm truncate">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs uppercase">{fileTypeLabels[fileType] || 'FILE'}</Badge>
                              <span className="text-xs text-[#404944]/70">
                                {new Date(item.createdAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>
                          {/* Action buttons — shrink-0 so they never get cut off */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[#003527] hover:bg-[#f5f3ef] hover:scale-110 rounded-xl transition-all h-9 w-9 p-0"
                              onClick={() => setPreviewItem({ id: item.id, title: item.title, fileUrl: item.fileUrl })}
                              title={`Lihat ${item.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-[#003527] hover:bg-[#f5f3ef] hover:scale-110 rounded-xl transition-all h-9 w-9 p-0" asChild>
                              <a
                                href={`/api/download/${item.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                title={`Download ${item.title}`}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <Card className="p-12 text-center border-0">
          <Download className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944]">Belum ada file untuk diunduh</p>
        </Card>
      )}

      {/* Preview Modal — uses Google Docs Viewer for PDFs (works on mobile + desktop).
          For images, uses direct URL in img tag.
          For other files (DOC/XLS), falls back to download. */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Preview: {previewItem?.title}</DialogTitle>
          {previewItem && (
            <div className="flex flex-col h-full min-h-0">
              {/* Header bar with title + close + download */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[#e4e2de] bg-[#fbf9f5] shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#003527] text-sm truncate font-display">{previewItem.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-[#003527] hover:bg-[#f5f3ef] rounded-lg h-9 px-2 sm:px-3" asChild>
                    <a
                      href={`/api/download/${previewItem.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#404944] hover:bg-[#f5f3ef] h-9 w-9 p-0 rounded-lg"
                    onClick={() => setPreviewItem(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Preview content — iframe for PDFs, img for images.
                  min-h-0 required for flex-1 child to shrink properly. */}
              <div className="flex-1 min-h-0 overflow-hidden bg-[#f5f3ef]">
                {previewItem.fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                  // Image preview
                  <div className="flex items-center justify-center h-full p-4">
                    <img
                      src={previewItem.fileUrl.includes('cloudinary.com') ? previewItem.fileUrl : `/api/preview/${previewItem.id}`}
                      alt={previewItem.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : previewItem.fileUrl.toLowerCase().includes('.pdf') ? (
                  // PDF preview — use our proxy URL in iframe.
                  // Google Docs Viewer would need public URL; our proxy streams inline
                  // which browsers can render in iframe (desktop + mobile).
                  <iframe
                    src={`/api/preview/${previewItem.id}`}
                    className="w-full h-full border-0"
                    title={previewItem.title}
                  />
                ) : (
                  // Other files (DOC/XLS/PPT) — can't preview inline, offer download
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                    <FileText className="h-16 w-16 text-[#064e3b]/40" />
                    <div>
                      <p className="text-[#404944] text-sm mb-1">Preview tidak tersedia untuk format file ini</p>
                      <p className="text-[#404944]/60 text-xs mb-4">Silakan download untuk melihat</p>
                    </div>
                    <Button className="bg-[#003527] hover:bg-[#064e3b] text-white rounded-xl" asChild>
                      <a
                        href={`/api/download/${previewItem.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
