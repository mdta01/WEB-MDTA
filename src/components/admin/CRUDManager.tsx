'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, X, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { FileUpload } from '@/components/admin/FileUpload'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

// --- Types ---

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'date' | 'image' | 'pdf' | 'richtext'

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  defaultValue?: string | number | boolean
  colSpan?: number // 1 or 2 for grid layout
  // Image-specific options
  uploadFolder?: string // Cloudinary folder, e.g. 'mdta/news'
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide'
  hint?: string
  maxWidth?: string // CSS max-width class for the upload area, e.g. 'max-w-[200px]'
}

export interface ColumnConfig {
  key: string
  label: string
  render?: (value: unknown, item: Record<string, unknown>) => React.ReactNode
  hidden?: boolean
}

export interface CRUDManagerProps {
  title: string
  apiPath: string
  columns: ColumnConfig[]
  formFields: FormFieldConfig[]
  itemName: string
  canCreate?: boolean
  canDelete?: boolean
  canEdit?: boolean
  dataKey?: string // key to extract array from response, defaults to direct array
  pageSize?: number
}

// --- Helper ---

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (value instanceof Date) return value.toLocaleDateString('id-ID')
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    } catch {
      return value
    }
  }
  return String(value)
}

// --- Main Component ---

export default function CRUDManager({
  title,
  apiPath,
  columns,
  formFields,
  itemName,
  canCreate = true,
  canDelete = true,
  canEdit = true,
  dataKey,
  pageSize = 10,
}: CRUDManagerProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null)
  const [deleteItem, setDeleteItem] = useState<Record<string, unknown> | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [viewItem, setViewItem] = useState<Record<string, unknown> | null>(null)

  // Fetch data
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['admin', apiPath],
    queryFn: async () => {
      const res = await fetch(`/api/admin/${apiPath}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || 'Gagal memuat data')
      }
      return res.json()
    },
  })

  // Extract items array
  const items: Record<string, unknown>[] = (() => {
    if (!rawData) return []
    if (Array.isArray(rawData)) return rawData
    if (dataKey && rawData && typeof rawData === 'object' && dataKey in rawData) {
      return (rawData as Record<string, unknown[]>)[dataKey] || []
    }
    // Try common keys
    const obj = rawData as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[]
    }
    return []
  })()

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || 'Gagal membuat data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', apiPath] })
      toast.success(`${itemName} berhasil ditambahkan`)
      closeForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menambahkan data')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/${apiPath}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || 'Gagal mengubah data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', apiPath] })
      toast.success(`${itemName} berhasil diperbarui`)
      closeForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengubah data')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/${apiPath}/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error || 'Gagal menghapus data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', apiPath] })
      toast.success(`${itemName} berhasil dihapus`)
      setDeleteItem(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus data')
    },
  })

  // Search filter
  const searchFields = columns
    .filter((c) => !c.hidden)
    .map((c) => c.key)

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return searchFields.some((key) => {
      const val = getNestedValue(item, key)
      return String(val ?? '').toLowerCase().includes(q)
    })
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  // Form helpers
  const openCreateForm = useCallback(() => {
    const defaults: Record<string, unknown> = {}
    formFields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        defaults[f.name] = f.defaultValue
      } else if (f.type === 'switch') {
        defaults[f.name] = false
      } else if (f.type === 'number') {
        defaults[f.name] = 0
      } else {
        defaults[f.name] = ''
      }
    })
    setFormData(defaults)
    setEditingItem(null)
    setFormOpen(true)
  }, [formFields])

  const openEditForm = useCallback((item: Record<string, unknown>) => {
    const data: Record<string, unknown> = {}
    formFields.forEach((f) => {
      const val = getNestedValue(item, f.name)
      if (val !== undefined && val !== null) {
        data[f.name] = val
      } else if (f.type === 'switch') {
        data[f.name] = false
      } else if (f.type === 'number') {
        data[f.name] = 0
      } else {
        data[f.name] = ''
      }
    })
    // Format date fields for input[type=date]
    formFields.forEach((f) => {
      if (f.type === 'date' && data[f.name]) {
        const d = data[f.name]
        if (typeof d === 'string' && d) {
          data[f.name] = d.slice(0, 10)
        } else if (d instanceof Date) {
          data[f.name] = d.toISOString().slice(0, 10)
        }
      }
    })
    setFormData(data)
    setEditingItem(item)
    setFormOpen(true)
  }, [formFields])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingItem(null)
    setFormData({})
  }, [])

  const handleFormChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleFormSubmit = useCallback(() => {
    // Validate required fields
    const missingField = formFields.find((f) => {
      if (!f.required) return false
      if (f.type === 'switch') return false
      const val = formData[f.name]
      return val === undefined || val === null || val === ''
    })
    if (missingField) {
      toast.error(`Field "${missingField.label}" harus diisi`)
      return
    }

    // Prepare data - clean up empty strings for optional fields
    const cleanData: Record<string, unknown> = { ...formData }
    formFields.forEach((f) => {
      if (f.type !== 'switch' && cleanData[f.name] === '') {
        cleanData[f.name] = null
      }
      // Convert number fields
      if (f.type === 'number' && cleanData[f.name] !== null && cleanData[f.name] !== undefined) {
        cleanData[f.name] = Number(cleanData[f.name])
      }
    })

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id as string, data: cleanData })
    } else {
      createMutation.mutate(cleanData)
    }
  }, [formData, formFields, editingItem, createMutation, updateMutation])

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Reset page when search changes
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600">Gagal memuat data. Silakan coba lagi.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', apiPath] })}
          >
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">Kelola data {itemName.toLowerCase()}</p>
        </div>
        {canCreate && (
          <Button
            onClick={openCreateForm}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah {itemName}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Cari ${itemName.toLowerCase()}...`}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 text-center">#</TableHead>
                {columns
                  .filter((c) => !c.hidden)
                  .map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                <TableHead className="text-center w-32">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => !c.hidden).length + 2}
                    className="text-center py-12"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                    <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.filter((c) => !c.hidden).length + 2}
                    className="text-center py-12"
                  >
                    <p className="text-gray-500">
                      {search ? 'Tidak ada data yang cocok' : `Belum ada data ${itemName.toLowerCase()}`}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item, idx) => (
                  <TableRow key={(item.id as string) || idx}>
                    <TableCell className="text-center text-gray-400 text-xs">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    {columns
                      .filter((c) => !c.hidden)
                      .map((col) => (
                        <TableCell key={col.key}>
                          {col.render
                            ? col.render(getNestedValue(item, col.key), item)
                            : renderDefaultCell(getNestedValue(item, col.key), col.key)}
                        </TableCell>
                      ))}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => setViewItem(item)}
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            onClick={() => openEditForm(item)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => setDeleteItem(item)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredItems.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredItems.length)} dari {filteredItems.length} data
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${itemName}` : `Tambah ${itemName}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Perbarui data ${itemName.toLowerCase()} di bawah ini`
                : `Isi data ${itemName.toLowerCase()} baru di bawah ini`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {formFields.map((field) => (
              <div
                key={field.name}
                className={field.colSpan === 2 ? 'sm:col-span-2' : ''}
              >
                {field.type === 'switch' ? (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor={`field-${field.name}`} className="cursor-pointer">
                      {field.label}
                    </Label>
                    <Switch
                      id={`field-${field.name}`}
                      checked={Boolean(formData[field.name])}
                      onCheckedChange={(checked) => handleFormChange(field.name, checked)}
                    />
                  </div>
                ) : field.type === 'select' ? (
                  <div className="space-y-2">
                    <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                    <Select
                      value={String(formData[field.name] ?? '')}
                      onValueChange={(val) => handleFormChange(field.name, val)}
                    >
                      <SelectTrigger id={`field-${field.name}`}>
                        <SelectValue placeholder={field.placeholder || 'Pilih...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : field.type === 'image' ? (
                  <ImageUpload
                    value={String(formData[field.name] ?? '')}
                    onChange={(url) => handleFormChange(field.name, url)}
                    folder={field.uploadFolder || 'mdta/misc'}
                    label={field.label}
                    placeholder={field.placeholder || 'https://res.cloudinary.com/...'}
                    aspectRatio={field.aspectRatio || 'square'}
                    hint={field.hint}
                    maxWidth={field.maxWidth}
                  />
                ) : field.type === 'pdf' ? (
                  <FileUpload
                    value={String(formData[field.name] ?? '')}
                    onChange={(url) => handleFormChange(field.name, url)}
                    folder={field.uploadFolder || 'mdta/downloads'}
                    label={field.label}
                    placeholder={field.placeholder || 'https://res.cloudinary.com/...'}
                    hint={field.hint}
                  />
                ) : field.type === 'richtext' ? (
                  <RichTextEditor
                    value={String(formData[field.name] ?? '')}
                    onChange={(val) => handleFormChange(field.name, val)}
                    label={field.label}
                    placeholder={field.placeholder || 'Tulis konten dengan format...'}
                  />
                ) : field.type === 'textarea' ? (
                  <div className="space-y-2">
                    <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                    <Textarea
                      id={`field-${field.name}`}
                      placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) => handleFormChange(field.name, e.target.value)}
                      rows={4}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
                    <Input
                      id={`field-${field.name}`}
                      type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) => handleFormChange(field.name, e.target.value)}
                      min={field.type === 'number' ? 0 : undefined}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              Batal
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSaving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                'Perbarui'
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {itemName.toLowerCase()} ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItem?.id) {
                  deleteMutation.mutate(deleteItem.id as string)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => { if (!open) setViewItem(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail {itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewItem && formFields.map((field) => (
              <div key={field.name} className="flex flex-col sm:flex-row sm:items-start gap-1 border-b pb-2">
                <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">
                  {field.label}
                </span>
                <span className="text-sm text-gray-900">
                  {field.type === 'image'
                    ? (viewItem[field.name]
                      ? <img src={String(viewItem[field.name])} alt={field.label} className="max-h-24 rounded border" />
                      : <span className="text-gray-400">-</span>)
                    : field.type === 'switch'
                      ? (viewItem[field.name] ? 'Ya' : 'Tidak')
                      : field.type === 'select' && field.options
                        ? (field.options.find((o) => o.value === viewItem[field.name])?.label ?? String(viewItem[field.name] ?? '-'))
                        : formatCellValue(viewItem[field.name])}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Default Cell Renderer ---

function renderDefaultCell(value: unknown, key: string) {
  if (value === null || value === undefined) return <span className="text-gray-400">-</span>

  if (typeof value === 'boolean') {
    return value
      ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Ya</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">Tidak</Badge>
  }

  if (key === 'status') {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-800' },
      accepted: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
    }
    const s = statusMap[String(value)]
    if (s) return <Badge className={s.className}>{s.label}</Badge>
  }

  if (key === 'isRead') {
    return value
      ? <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Dibaca</Badge>
      : <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Baru</Badge>
  }

  if (key === 'category' || key === 'type' || key === 'level' || key === 'role') {
    return <Badge variant="outline" className="capitalize">{String(value)}</Badge>
  }

  if (key === 'isPublished' || key === 'isActive') {
    return value
      ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aktif</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">Nonaktif</Badge>
  }

  const strVal = formatCellValue(value)
  if (strVal.length > 80) {
    return <span className="text-sm">{strVal.slice(0, 80)}...</span>
  }

  return <span className="text-sm">{strVal}</span>
}
