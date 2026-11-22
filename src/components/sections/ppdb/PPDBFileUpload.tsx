'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, X, Loader2, FileText, ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/cloudinary-direct'

/**
 * PPDBFileUpload — Drag-drop file upload with preview for PPDB registration.
 *
 * Designed for the public PPDB registration form (no admin auth required):
 *  1. Drag-drop or click to pick a file
 *  2. Client-side validation (type + size)
 *  3. Generate preview (image thumbnail or PDF icon)
 *  4. Upload directly to Cloudinary via /api/ppdb/upload-signature (public)
 *  5. On success: store returned URL via onChange, show preview + remove btn
 *  6. On error: show inline error + toast, allow retry
 *
 * Props:
 *  - label: field label (e.g. "Kartu Keluarga")
 *  - hint: sub-label / requirement hint
 *  - accept: comma-separated accept attr (e.g. "image/*,.pdf")
 *  - allowPdf: if true, .pdf is accepted alongside images
 *  - maxSize: max bytes (e.g. 2 * 1024 * 1024 = 2MB)
 *  - value: current Cloudinary URL (controlled)
 *  - onChange: callback with new URL (or '' on clear)
 *  - required: shows asterisk
 */
type PPDBFileUploadProps = {
  label: string
  hint?: string
  accept: string
  allowPdf?: boolean
  maxSize: number
  value: string
  onChange: (url: string) => void
  required?: boolean
}

interface SignatureResponse {
  api_key: string
  timestamp: number
  signature: string
  folder: string
  cloud_name: string
  resource_type: 'image' | 'raw'
  upload_url: string
}

export function PPDBFileUpload({
  label,
  hint,
  accept,
  allowPdf = false,
  maxSize,
  value,
  onChange,
  required = false,
}: PPDBFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Validate file type + size client-side before uploading.
   * Returns an error message string, or '' if valid.
   */
  const validateFile = useCallback(
    (f: File): string => {
      const isImage = f.type.startsWith('image/')
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')

      if (!isImage && !isPdf) {
        return 'Format tidak didukung. Hanya gambar (JPG/PNG)' + (allowPdf ? ' atau PDF.' : '.')
      }
      if (isPdf && !allowPdf) {
        return 'File PDF tidak diterima untuk kolom ini. Mohon unggah gambar.'
      }
      if (f.size > maxSize) {
        return `Ukuran file ${formatBytes(f.size)} melebihi batas ${formatBytes(maxSize)}.`
      }
      return ''
    },
    [allowPdf, maxSize]
  )

  /**
   * Generate a local preview URL for the file (image data URL or just a flag for PDFs).
   * For images, use URL.createObjectURL so we get a thumbnail.
   */
  const generatePreview = useCallback((f: File) => {
    if (f.type.startsWith('image/')) {
      try {
        const url = URL.createObjectURL(f)
        setPreview(url)
      } catch {
        setPreview('')
      }
    } else {
      // PDF — no inline preview, just show file icon
      setPreview('pdf')
    }
  }, [])

  /**
   * Upload file directly to Cloudinary using signature from /api/ppdb/upload-signature.
   * Uses XMLHttpRequest to track upload progress (fetch doesn't support upload progress).
   */
  const uploadToCloudinary = useCallback(
    (f: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const resourceType = f.type === 'application/pdf' ? 'raw' : 'image'

        // Step 1: get signature from public PPDB upload endpoint
        fetch('/api/ppdb/upload-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceType }),
        })
          .then((r) => {
            if (!r.ok) {
              throw new Error('Gagal mendapatkan izin upload. Coba lagi.')
            }
            return r.json()
          })
          .then((sig: SignatureResponse) => {
            // Step 2: build FormData for Cloudinary
            const formData = new FormData()
            formData.append('file', f)
            formData.append('api_key', sig.api_key)
            formData.append('timestamp', String(sig.timestamp))
            formData.append('signature', sig.signature)
            formData.append('folder', sig.folder)

            // Step 3: POST to Cloudinary directly (bypasses Vercel 4.5MB limit)
            const xhr = new XMLHttpRequest()
            xhr.open('POST', sig.upload_url)
            xhr.timeout = 2 * 60 * 1000 // 2 min timeout

            if (xhr.upload) {
              xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                  setProgress(Math.round((e.loaded / e.total) * 100))
                }
              })
            }

            xhr.addEventListener('load', () => {
              try {
                const response = JSON.parse(xhr.responseText)
                if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
                  resolve(response.secure_url as string)
                } else {
                  const errMsg =
                    response?.error?.message ||
                    response?.error ||
                    `Upload gagal (HTTP ${xhr.status})`
                  reject(new Error(errMsg))
                }
              } catch {
                reject(new Error('Response Cloudinary tidak valid. Coba lagi.'))
              }
            })
            xhr.addEventListener('error', () =>
              reject(new Error('Koneksi error saat upload. Periksa internet Anda.'))
            )
            xhr.addEventListener('abort', () => reject(new Error('Upload dibatalkan')))
            xhr.addEventListener('timeout', () =>
              reject(new Error('Upload timeout. Coba file lebih kecil.'))
            )
            xhr.send(formData)
          })
          .catch((err) => {
            reject(
              err instanceof Error
                ? err
                : new Error('Gagal terhubung ke layanan upload')
            )
          })
      })
    },
    []
  )

  const handleFile = useCallback(
    async (f: File) => {
      setError('')
      const validationError = validateFile(f)
      if (validationError) {
        setError(validationError)
        toast.error(validationError)
        return
      }
      setFile(f)
      generatePreview(f)
      setUploading(true)
      setProgress(0)
      try {
        const url = await uploadToCloudinary(f)
        onChange(url)
        toast.success(`${f.name} berhasil diunggah`, {
          description: formatBytes(f.size),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload gagal'
        setError(msg)
        toast.error('Upload gagal', { description: msg })
        // Reset file state but keep error message visible
        setFile(null)
        setPreview('')
      } finally {
        setUploading(false)
        setProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [generatePreview, onChange, uploadToCloudinary, validateFile]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
  }

  // Drag-drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  const handleRemove = () => {
    // Revoke object URL to free memory
    if (preview && preview !== 'pdf' && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview('')
    setError('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasUploaded = Boolean(value)
  const showPreview = hasUploaded || (file && (preview || uploading))

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`ppdb-upload-${label}`} required={required}>
        {label}
      </Label>

      <input
        ref={fileInputRef}
        id={`ppdb-upload-${label}`}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      <AnimatePresence mode="wait">
        {showPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative rounded-xl border border-[#e4e2de] bg-white p-3',
              'flex items-center gap-3 shadow-sm'
            )}
          >
            {/* Thumbnail */}
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#064e3b]/8 border border-[#e4e2de] flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#064e3b]" />
              ) : preview && preview !== 'pdf' && preview.startsWith('blob:') ? (
                <img
                  src={preview}
                  alt={`${label} preview`}
                  className="h-full w-full object-cover"
                />
              ) : preview === 'pdf' ? (
                <FileText className="h-7 w-7 text-[#ba1a1a]" />
              ) : (
                <ImageIcon className="h-6 w-6 text-[#064e3b]" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#003527] truncate flex items-center gap-1.5">
                {hasUploaded && !uploading && (
                  <CheckCircle2 className="h-4 w-4 text-[#064e3b] shrink-0" />
                )}
                <span className="truncate">{file?.name || 'Berkas terunggah'}</span>
              </p>
              <p className="text-xs text-[#404944] mt-0.5">
                {uploading
                  ? `Mengunggah... ${progress}%`
                  : file
                    ? formatBytes(file.size)
                    : 'File tersimpan di server'}
              </p>
              {uploading && (
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#e4e2de]">
                  <div
                    className="h-full bg-gradient-to-r from-[#003527] to-[#064e3b] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Remove / Replace buttons */}
            {!uploading && (
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2 py-1 rounded-md text-[#003527] hover:bg-[#064e3b]/8 font-medium"
                  aria-label={`Ganti ${label}`}
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs px-2 py-1 rounded-md text-[#ba1a1a] hover:bg-[#ba1a1a]/8 font-medium inline-flex items-center gap-1 justify-center"
                  aria-label={`Hapus ${label}`}
                >
                  <X className="h-3 w-3" /> Hapus
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            className={cn(
              'cursor-pointer rounded-xl border-2 border-dashed p-5 sm:p-6 flex flex-col items-center justify-center gap-2 transition-all',
              dragging
                ? 'border-[#cca72f] bg-[#cca72f]/8 scale-[1.01]'
                : 'border-[#e4e2de] bg-white hover:border-[#064e3b] hover:bg-[#064e3b]/4',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca72f]/40'
            )}
          >
            <div className="p-2.5 rounded-full bg-[#064e3b]/8">
              <UploadCloud className="h-6 w-6 text-[#003527]" />
            </div>
            <p className="text-sm font-medium text-[#003527] text-center">
              Tarik & lepas file di sini, atau{' '}
              <span className="text-[#cca72f] underline">pilih file</span>
            </p>
            <p className="text-xs text-[#404944] text-center">
              {allowPdf ? 'Gambar (JPG/PNG) atau PDF' : 'Gambar saja (JPG/PNG)'} • Maks{' '}
              {formatBytes(maxSize)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      {error && (
        <p className="text-xs text-[#ba1a1a] flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs text-[#404944]/80">{hint}</p>
      )}
    </div>
  )
}

/**
 * Lightweight Label component (avoids circular imports in some setups).
 * Marks required fields with an asterisk.
 */
function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-[#003527] font-body flex items-center gap-1"
    >
      {children}
      {required && <span className="text-[#cca72f]" aria-hidden>*</span>}
    </label>
  )
}
