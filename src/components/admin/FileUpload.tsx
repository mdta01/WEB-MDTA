'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, Loader2, FileText, Link2, AlertCircle, FileCheck2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FileUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  placeholder?: string
  hint?: string
}

export function FileUpload({
  value,
  onChange,
  folder = 'mdta/downloads',
  label = 'File PDF',
  placeholder = 'https://res.cloudinary.com/...',
  hint,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUrlMode, setShowUrlMode] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return

      // Client-side validation — support PDF, DOC, DOCX, etc.
      const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt']
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      if (!allowedExts.includes(fileExt)) {
        toast.error(`Format tidak didukung: .${fileExt}`, {
          description: 'Hanya PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, TXT.',
        })
        return
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 25 MB', {
          description: `File Anda: ${(file.size / 1024 / 1024).toFixed(1)} MB`,
        })
        return
      }

      setUploading(true)

      // Retry logic — network errors are common on slow connections
      const maxRetries = 2
      let lastError: string = 'Gagal upload'
      let success = false

      try {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder)

            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })

            // Handle non-OK responses
            if (!res.ok) {
              let errorMsg: string
              try {
                const data = await res.json()
                errorMsg = data.error || `Upload gagal (HTTP ${res.status})`
              } catch {
                errorMsg = `Upload gagal (HTTP ${res.status})`
              }
              // Don't retry on client errors (4xx) — only retry on server errors (5xx)
              if (res.status >= 400 && res.status < 500) {
                toast.error('Upload gagal', { description: errorMsg })
                return
              }
              throw new Error(errorMsg)
            }

            const data = await res.json()

            onChange(data.url)
            setFileName(file.name)
            toast.success('File berhasil diupload', {
              description: `${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
            })
            success = true
            return // Success — exit retry loop
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Gagal upload'
            console.error(`[FileUpload] attempt ${attempt}/${maxRetries} failed:`, lastError)

            if (attempt < maxRetries) {
              toast.loading(`Upload gagal, mencoba ulang (${attempt + 1}/${maxRetries})...`, {
                id: 'file-upload-retry',
              })
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            }
          }
        }

        // All retries exhausted
        toast.dismiss('file-upload-retry')
        toast.error('Upload gagal setelah beberapa percobaan', {
          description: lastError + '. Coba file lebih kecil atau periksa koneksi internet.',
        })
      } finally {
        setUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        if (!success) {
          toast.dismiss('file-upload-retry')
        }
      }
    },
    [folder, onChange]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleClear = () => {
    onChange('')
    setFileName('')
  }

  // Extract file name from URL if value already set (e.g. editing existing)
  const displayName = fileName || (value ? value.split('/').pop()?.split('?')[0] || 'file' : '')

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setShowUrlMode(!showUrlMode)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {showUrlMode ? (
              <>
                <UploadCloud className="h-3 w-3" /> Mode Upload
              </>
            ) : (
              <>
                <Link2 className="h-3 w-3" /> Mode URL
              </>
            )}
          </button>
        </label>
      )}

      {showUrlMode ? (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={uploading}
        />
      ) : value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/50 border-emerald-200">
          <div className="p-2 rounded-lg bg-red-100 shrink-0">
            <FileText className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-900 truncate flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{displayName}</span>
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={value}>
              {value}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadCloud className="h-4 w-4 mr-1" /> Ganti
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={uploading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
            uploading
              ? 'border-emerald-400 bg-emerald-50 pointer-events-none opacity-70'
              : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">Mengupload PDF...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-red-100">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Klik untuk pilih file <span className="font-medium text-red-600">PDF</span>
              </p>
              <p className="text-[10px] text-muted-foreground/70">Maksimal 25 MB • PDF, DOC, DOCX, XLS, PPT, ZIP, TXT</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
