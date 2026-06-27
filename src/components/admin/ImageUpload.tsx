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
}

export function ImageUpload({
  value,
  onChange,
  folder = 'mdta/misc',
  label = 'Gambar',
  placeholder = 'https://res.cloudinary.com/...',
  aspectRatio = 'square',
  hint,
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10 MB')
        return
      }

      setUploading(true)
      setImgError(false)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Upload gagal')
        }

        onChange(data.url)
        toast.success('Gambar berhasil diupload', {
          description: `${(file.size / 1024).toFixed(0)} KB → ${data.format?.toUpperCase()} ${data.width}×${data.height}`,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Gagal upload'
        toast.error('Upload gagal', { description: msg })
      } finally {
        setUploading(false)
        // Reset input so same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
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
      ) : hasImage ? (
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
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">Mengupload...</p>
            </>
          ) : imgError && value ? (
            <>
              <AlertCircle className="h-6 w-6 text-amber-500" />
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
              <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, WebP, GIF (maks 10MB)</p>
            </>
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
