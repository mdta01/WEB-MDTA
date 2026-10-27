'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, Loader2, FileText, Link2, AlertCircle, FileCheck2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  uploadToCloudinaryDirect,
  CLOUDINARY_LIMITS,
  formatBytes,
} from '@/lib/cloudinary-direct'

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
  const [uploadProgress, setUploadProgress] = useState(0)
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
      // Cloudinary free plan limit: 100MB for raw files
      // (Direct upload bypasses Vercel's 4.5MB body limit)
      if (file.size > CLOUDINARY_LIMITS.raw) {
        toast.error('Ukuran file melebihi batas Cloudinary', {
          description: `File: ${formatBytes(file.size)}. Maksimal ${formatBytes(CLOUDINARY_LIMITS.raw)}.`,
          duration: 6000,
        })
        return
      }

      setUploading(true)
      setUploadProgress(0)

      try {
        // Direct upload to Cloudinary as raw resource (bypasses Vercel 4.5MB limit)
        // Use resource_type 'raw' for documents (PDF, DOCX, etc.)
        // Cloudinary returns URL with original filename preserved
        const result = await uploadToCloudinaryDirect(file, folder, 'raw', (pct) => {
          setUploadProgress(pct)
        })

        onChange(result.url)
        setFileName(file.name)
        toast.success('File berhasil diupload', {
          description: `${file.name} (${formatBytes(file.size)})`,
        })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Gagal upload'
        console.error('[FileUpload] direct upload failed:', errMsg)

        let title = 'Upload gagal'
        let description = errMsg
        if (errMsg.includes('timed out') || errMsg.includes('timeout')) {
          title = 'Upload timeout'
          description = 'File terlalu besar atau koneksi lambat.'
        } else if (errMsg.includes('Unauthorized') || errMsg.includes('signature')) {
          title = 'Auth gagal'
          description = 'Sesi admin berakhir. Refresh halaman & login ulang.'
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
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-[#064e3b]/8/50 border-[#e4e2de]">
          <div className="p-2 rounded-lg bg-[#ba1a1a]/10 shrink-0">
            <FileText className="h-5 w-5 text-[#ba1a1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#003527] truncate flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5 text-[#064e3b] shrink-0" />
              <span className="truncate">{displayName}</span>
            </p>
            <p className="text-xs text-[#404944] truncate mt-0.5" title={value}>
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
              className="text-[#ba1a1a] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#064e3b] shrink-0" />
              {uploadProgress > 0 && (
                <div className="w-16 h-1 bg-[#e4e2de] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#003527] to-[#064e3b] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
            uploading
              ? 'border-emerald-400 bg-[#064e3b]/8 pointer-events-none opacity-70'
              : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#064e3b]" />
              <p className="text-xs text-muted-foreground">Mengupload PDF... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</p>
              {uploadProgress > 0 && (
                <div className="w-32 h-1.5 bg-[#e4e2de] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#003527] to-[#064e3b] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-[#ba1a1a]/10">
                <FileText className="h-6 w-6 text-[#ba1a1a]" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Klik untuk pilih file <span className="font-medium text-[#ba1a1a]">PDF</span>
              </p>
              <p className="text-[10px] text-muted-foreground/70">Maksimal 100 MB • PDF, DOC, DOCX, XLS, PPT, ZIP, TXT</p>
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
