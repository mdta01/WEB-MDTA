'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, Loader2, ImageIcon, Link2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  uploadToCloudinaryDirect,
  CLOUDINARY_LIMITS,
  formatBytes,
} from '@/lib/cloudinary-direct'

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
  const [uploadProgress, setUploadProgress] = useState(0)
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
      // Cloudinary free plan limit: 10MB for images
      // (Direct upload bypasses Vercel's 4.5MB body limit)
      if (file.size > CLOUDINARY_LIMITS.image) {
        toast.error('Ukuran gambar melebihi batas Cloudinary', {
          description: `File: ${formatBytes(file.size)}. Maksimal ${formatBytes(CLOUDINARY_LIMITS.image)}. Kompres gambar dulu atau gunakan resolusi lebih kecil.`,
          duration: 6000,
        })
        return
      }

      setUploading(true)
      setUploadProgress(0)
      setImgError(false)

      try {
        // Direct upload to Cloudinary (bypasses Vercel 4.5MB limit)
        const result = await uploadToCloudinaryDirect(file, folder, 'image', (pct) => {
          setUploadProgress(pct)
        })

        onChange(result.url)
        toast.success('Gambar berhasil diupload', {
          description: `${formatBytes(file.size)} → ${result.format?.toUpperCase()} ${result.width}×${result.height}`,
        })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Gagal upload'
        console.error('[ImageUpload] direct upload failed:', errMsg)

        // Show clear error message with possible causes
        let title = 'Upload gagal'
        let description = errMsg
        if (errMsg.includes('timed out') || errMsg.includes('timeout')) {
          title = 'Upload timeout'
          description = 'File terlalu besar atau koneksi lambat. Coba file lebih kecil.'
        } else if (errMsg.includes('Unauthorized') || errMsg.includes('signature')) {
          title = 'Auth gagal'
          description = 'Sesi admin berakhir. Refresh halaman & login ulang.'
        } else if (errMsg.includes('File size')) {
          title = 'File terlalu besar'
          description = 'Cloudinary menolak file. Maksimal 10 MB untuk gambar.'
        }

        toast.error(title, { description, duration: 6000 })
      } finally {
        setUploading(false)
        setUploadProgress(0)
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
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                {uploadProgress > 0 && (
                  <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#cca72f] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {uploadProgress > 0 && (
                  <p className="text-[10px] text-white/80">{uploadProgress}%</p>
                )}
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
              <p className="text-xs text-muted-foreground">Mengupload... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</p>
              {uploadProgress > 0 && (
                <div className="w-32 h-1.5 bg-[#e4e2de] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#003527] to-[#064e3b] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
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
              <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, WebP, GIF (maks 10 MB)</p>
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
