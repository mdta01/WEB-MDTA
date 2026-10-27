'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, Loader2, ImageIcon, Link2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  placeholder?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide'
  hint?: string
  /** Max width CSS class for the upload/preview area, e.g. 'max-w-[200px]'. Default: full width. */
  maxWidth?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = 'mdta/misc',
  label = 'Gambar',
  placeholder = 'https://res.cloudinary.com/...',
  aspectRatio = 'square',
  hint,
  maxWidth,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUrlMode, setShowUrlMode] = useState(false)
  const [imgError, setImgError] = useState(false)

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  }[aspectRatio]

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return

      // Client-side validation
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      // Vercel serverless body size limit is 4.5MB on Hobby plan.
      // Multipart form data has overhead (~200 bytes), so use 4.4MB as safe limit.
      // Files larger than this will be rejected by Vercel edge network with
      // HTTP 413 FUNCTION_PAYLOAD_TOO_LARGE before reaching our API.
      const VERCEL_BODY_LIMIT = 4.4 * 1024 * 1024 // 4.4 MB
      if (file.size > VERCEL_BODY_LIMIT) {
        toast.error('Ukuran gambar melebihi batas server', {
          description: `File: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maksimal 4.4 MB (batasan serverless). Kompres gambar dulu atau gunakan resolusi lebih kecil.`,
          duration: 6000,
        })
        return
      }

      setUploading(true)
      setImgError(false)

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
              // Don't set Content-Type — browser sets it with boundary for FormData
            })

            // Handle non-OK responses
            if (!res.ok) {
              let errorMsg: string
              const responseText = await res.text().catch(() => '')

              // Vercel returns plain text "FUNCTION_PAYLOAD_TOO_LARGE" for 413
              // (edge network rejects before our API runs)
              if (res.status === 413 || responseText.includes('PAYLOAD_TOO_LARGE')) {
                errorMsg = `File terlalu besar untuk server (maks 4.4 MB). File Anda: ${(file.size / 1024 / 1024).toFixed(2)} MB.`
                toast.error('Upload ditolak server', { description: errorMsg, duration: 6000 })
                return // Don't retry — won't help
              }

              // Try to parse JSON error from our API
              try {
                const data = JSON.parse(responseText)
                errorMsg = data.error || data.detail || `Upload gagal (HTTP ${res.status})`
              } catch {
                errorMsg = responseText || `Upload gagal (HTTP ${res.status})`
              }

              // Don't retry on client errors (4xx) — only retry on server errors (5xx)
              if (res.status >= 400 && res.status < 500) {
                toast.error('Upload gagal', { description: errorMsg, duration: 5000 })
                return
              }
              throw new Error(errorMsg)
            }

            const data = await res.json()

            onChange(data.url)
            toast.success('Gambar berhasil diupload', {
              description: `${(file.size / 1024).toFixed(0)} KB → ${data.format?.toUpperCase()} ${data.width}×${data.height}`,
            })
            success = true
            return // Success — exit retry loop
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Gagal upload'
            console.error(`[ImageUpload] attempt ${attempt}/${maxRetries} failed:`, lastError)

            if (attempt < maxRetries) {
              // Show retry toast
              toast.loading(`Upload gagal, mencoba ulang (${attempt + 1}/${maxRetries})...`, {
                id: 'upload-retry',
              })
              // Wait before retry (1s, 2s)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            }
          }
        }

        // All retries exhausted
        toast.dismiss('upload-retry')
        toast.error('Upload gagal setelah beberapa percobaan', {
          description: lastError + '. Coba file lebih kecil atau periksa koneksi internet.',
        })
      } finally {
        setUploading(false)
        // Reset input so same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Dismiss retry toast if still showing
        if (!success) {
          toast.dismiss('upload-retry')
        }
      }
    },
    [folder, onChange]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClear = () => {
    onChange('')
    setImgError(false)
  }

  const hasImage = value && !imgError

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
      ) : (
        <div className={maxWidth}>
          {hasImage ? (
          <div className={`relative w-full ${aspectClass} rounded-lg overflow-hidden border bg-muted group`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <UploadCloud className="h-4 w-4 mr-1" /> Ganti
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleClear}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          ) : (
          <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer ${aspectClass} w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            dragOver
              ? 'border-emerald-500 bg-[#064e3b]/8'
              : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#064e3b]" />
              <p className="text-xs text-muted-foreground">Mengupload...</p>
            </>
          ) : imgError && value ? (
            <>
              <AlertCircle className="h-6 w-6 text-[#895033]" />
              <p className="text-xs text-muted-foreground text-center px-2">
                Gambar tidak dapat dimuat. Klik untuk upload ulang.
              </p>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-muted">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-center px-2">
                Klik atau drag gambar ke sini
              </p>
              <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, WebP, GIF (maks 4.4 MB)</p>
            </>
          )}
        </div>
        )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value && !showUrlMode && (
        <p className="text-[10px] text-muted-foreground/70 truncate" title={value}>
          URL: {value}
        </p>
      )}
    </div>
  )
}
