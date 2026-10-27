'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, Loader2, Film, Link2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  uploadToCloudinaryDirect,
  CLOUDINARY_LIMITS,
  formatBytes,
} from '@/lib/cloudinary-direct'

interface VideoUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  placeholder?: string
  hint?: string
}

const ALLOWED_VIDEO_EXTS = [
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogv', '3gp',
] as const

const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-flv',
  'video/x-ms-wmv',
  'video/x-m4v',
  'video/ogg',
  'video/3gpp',
] as const

/**
 * VideoUpload — direct upload to Cloudinary (bypasses Vercel 4.5MB body limit).
 *
 * Supports:
 * — MP4, WebM, MOV, AVI, MKV, FLV, WMV, M4V, OGV, 3GP
 * — Max 100 MB (Cloudinary free plan video limit)
 * — Live progress bar (XHR upload progress)
 * — Video preview (<video> tag) once uploaded
 * — Drag-and-drop support
 * — URL mode fallback (paste Cloudinary URL directly)
 *
 * Uses resource_type: 'video' for Cloudinary API.
 */
export function VideoUpload({
  value,
  onChange,
  folder = 'mdta/videos',
  label = 'Video',
  placeholder = 'https://res.cloudinary.com/...',
  hint,
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [showUrlMode, setShowUrlMode] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoMeta, setVideoMeta] = useState<{ duration?: number; width?: number; height?: number }>({})

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return

      // Validate file type — check both extension & MIME
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      const extValid = ALLOWED_VIDEO_EXTS.includes(fileExt as (typeof ALLOWED_VIDEO_EXTS)[number])
      const mimeValid = ALLOWED_VIDEO_MIME.includes(file.type as (typeof ALLOWED_VIDEO_MIME)[number])

      if (!extValid && !mimeValid) {
        toast.error(`Format video tidak didukung: .${fileExt}`, {
          description: 'Hanya MP4, WebM, MOV, AVI, MKV, FLV, WMV, M4V, OGV, 3GP.',
        })
        return
      }

      // Cloudinary free plan video limit: 100MB
      if (file.size > CLOUDINARY_LIMITS.video) {
        toast.error('Ukuran video melebihi batas Cloudinary', {
          description: `File: ${formatBytes(file.size)}. Maksimal ${formatBytes(CLOUDINARY_LIMITS.video)}.`,
          duration: 6000,
        })
        return
      }

      setUploading(true)
      setUploadProgress(0)
      setVideoError(false)

      try {
        // Direct upload to Cloudinary as video resource
        const result = await uploadToCloudinaryDirect(file, folder, 'video', (pct) => {
          setUploadProgress(pct)
        })

        onChange(result.url)
        setVideoMeta({
          duration: result.duration,
          width: result.width,
          height: result.height,
        })

        toast.success('Video berhasil diupload', {
          description: `${file.name} (${formatBytes(file.size)})${result.duration ? ` • ${Math.round(result.duration)}s` : ''}`,
          duration: 5000,
        })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Gagal upload'
        console.error('[VideoUpload] direct upload failed:', errMsg)

        let title = 'Upload video gagal'
        let description = errMsg
        if (errMsg.includes('timed out') || errMsg.includes('timeout')) {
          title = 'Upload timeout'
          description = 'Video terlalu besar atau koneksi lambat. Coba video lebih kecil atau format MP4/WebM.'
        } else if (errMsg.includes('Unauthorized') || errMsg.includes('signature')) {
          title = 'Auth gagal'
          description = 'Sesi admin berakhir. Refresh halaman & login ulang.'
        } else if (errMsg.includes('File size')) {
          title = 'File terlalu besar'
          description = 'Cloudinary menolak file. Maksimal 100 MB untuk video.'
        }

        toast.error(title, { description, duration: 6000 })
      } finally {
        setUploading(false)
        setUploadProgress(0)
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
    setVideoError(false)
    setVideoMeta({})
  }

  const hasVideo = value && !videoError

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
        <div>
          {hasVideo ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-black group">
              <video
                src={value}
                controls
                className="w-full h-full object-contain"
                onError={() => setVideoError(true)}
              />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8"
                >
                  <UploadCloud className="h-4 w-4 mr-1" /> Ganti
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={uploading}
                  className="h-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  {uploadProgress > 0 && (
                    <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
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
              className={`cursor-pointer aspect-video w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                dragOver
                  ? 'border-emerald-500 bg-[#064e3b]/8'
                  : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50'
              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-[#064e3b]" />
                  <p className="text-xs text-muted-foreground">
                    Mengupload video... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                  </p>
                  {uploadProgress > 0 && (
                    <div className="w-32 h-1.5 bg-[#e4e2de] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#003527] to-[#064e3b] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </>
              ) : videoError && value ? (
                <>
                  <AlertCircle className="h-6 w-6 text-[#895033]" />
                  <p className="text-xs text-muted-foreground text-center px-2">
                    Video tidak dapat dimuat. Klik untuk upload ulang.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-muted">
                    <Film className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center px-2">
                    Klik atau drag video ke sini
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    MP4, WebM, MOV (maks 100 MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv,.flv,.wmv,.m4v,.ogv,.3gp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value && !showUrlMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] text-muted-foreground/70 truncate flex-1 min-w-0" title={value}>
            URL: {value}
          </p>
          {videoMeta.duration && (
            <span className="text-[10px] text-[#404944] bg-[#f5f3ef] px-1.5 py-0.5 rounded">
              ⏱ {Math.round(videoMeta.duration)}s
            </span>
          )}
          {videoMeta.width && videoMeta.height && (
            <span className="text-[10px] text-[#404944] bg-[#f5f3ef] px-1.5 py-0.5 rounded">
              📐 {videoMeta.width}×{videoMeta.height}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default VideoUpload
