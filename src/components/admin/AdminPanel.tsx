'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Newspaper, Megaphone, Users, GraduationCap,
  BookOpen, Trophy, ImageIcon, Calendar, MessageSquare, FileText,
  Download, Mail, Lightbulb, Settings, LogOut, Menu, X,
  ChevronRight, Shield, Loader2, Save, DollarSign, Clock, Star,
  UserCheck, UserX, UserPlus, Eye, Filter, ClipboardList, Phone, MapPin,
  Plus, Pencil, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CRUDManager, { type FormFieldConfig, type ColumnConfig } from './CRUDManager'
import { ImageUpload } from './ImageUpload'
import AdminDashboard from './AdminDashboard'

// --- Types ---

type AdminSection =
  | 'dashboard'
  | 'news'
  | 'announcements'
  | 'teachers'
  | 'students'
  | 'programs'
  | 'achievements'
  | 'gallery'
  | 'events'
  | 'testimonials'
  | 'faqs'
  | 'downloads'
  | 'dakwah'
  | 'alumni'
  | 'schedules'
  | 'payments'
  | 'ppdb'
  | 'wali-santri'
  | 'contact-messages'
  | 'suggestions'
  | 'settings'

interface NavItem {
  id: AdminSection
  label: string
  icon: React.ReactNode
  group?: string
}

// --- Navigation Config ---

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'news', label: 'Kelola Berita', icon: <Newspaper className="h-4 w-4" />, group: 'Konten' },
  { id: 'announcements', label: 'Kelola Pengumuman', icon: <Megaphone className="h-4 w-4" />, group: 'Konten' },
  { id: 'dakwah', label: 'Kelola Dakwah', icon: <BookOpen className="h-4 w-4" />, group: 'Konten' },
  { id: 'events', label: 'Kelola Event', icon: <Calendar className="h-4 w-4" />, group: 'Konten' },
  { id: 'gallery', label: 'Kelola Galeri', icon: <ImageIcon className="h-4 w-4" />, group: 'Konten' },
  { id: 'downloads', label: 'Kelola Download', icon: <Download className="h-4 w-4" />, group: 'Konten' },
  { id: 'faqs', label: 'Kelola FAQ', icon: <FileText className="h-4 w-4" />, group: 'Konten' },
  { id: 'teachers', label: 'Kelola Guru', icon: <Users className="h-4 w-4" />, group: 'Akademik' },
  { id: 'students', label: 'Kelola Santri', icon: <GraduationCap className="h-4 w-4" />, group: 'Akademik' },
  { id: 'programs', label: 'Kelola Program', icon: <BookOpen className="h-4 w-4" />, group: 'Akademik' },
  { id: 'schedules', label: 'Kelola Jadwal', icon: <Clock className="h-4 w-4" />, group: 'Akademik' },
  { id: 'achievements', label: 'Kelola Prestasi', icon: <Trophy className="h-4 w-4" />, group: 'Lainnya' },
  { id: 'testimonials', label: 'Kelola Testimoni', icon: <Star className="h-4 w-4" />, group: 'Lainnya' },
  { id: 'alumni', label: 'Kelola Alumni', icon: <GraduationCap className="h-4 w-4" />, group: 'Lainnya' },
  { id: 'payments', label: 'Kelola Pembayaran', icon: <DollarSign className="h-4 w-4" />, group: 'Lainnya' },
  { id: 'ppdb', label: 'Pendaftaran', icon: <ClipboardList className="h-4 w-4" />, group: 'Pendaftaran' },
  { id: 'wali-santri', label: 'Wali Santri', icon: <Users className="h-4 w-4" />, group: 'Pendaftaran' },
  { id: 'contact-messages', label: 'Pesan Kontak', icon: <Mail className="h-4 w-4" />, group: 'Pesan' },
  { id: 'suggestions', label: 'Kritik & Saran', icon: <Lightbulb className="h-4 w-4" />, group: 'Pesan' },
  { id: 'settings', label: 'Pengaturan Website', icon: <Settings className="h-4 w-4" />, group: 'Sistem' },
]

// --- Entity Configurations ---

interface EntityConfig {
  title: string
  apiPath: string
  itemName: string
  columns: ColumnConfig[]
  formFields: FormFieldConfig[]
  canCreate?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

const entityConfigs: Record<string, EntityConfig> = {
  news: {
    title: 'Kelola Berita',
    apiPath: 'news',
    itemName: 'Berita',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'category', label: 'Kategori' },
      { key: 'isPublished', label: 'Status' },
      { key: 'createdAt', label: 'Tanggal' },
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Judul berita', colSpan: 2 },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Kegiatan', value: 'kegiatan' },
        { label: 'PHBI', value: 'phbi' },
        { label: 'Keagamaan', value: 'keagamaan' },
        { label: 'Lomba', value: 'lomba' },
        { label: 'Prestasi', value: 'prestasi' },
      ]},
      { name: 'isPublished', label: 'Dipublikasi', type: 'switch' },
      { name: 'excerpt', label: 'Ringkasan', type: 'textarea', placeholder: 'Ringkasan singkat berita', colSpan: 2 },
      { name: 'image', label: 'Gambar Berita', type: 'image', uploadFolder: 'mdta/news', aspectRatio: 'video', placeholder: 'https://...', colSpan: 2, hint: 'Upload gambar berita (rasio 16:9 disarankan)' },
      { name: 'content', label: 'Konten', type: 'textarea', required: true, placeholder: 'Isi berita lengkap', colSpan: 2 },
    ],
  },
  announcements: {
    title: 'Kelola Pengumuman',
    apiPath: 'announcements',
    itemName: 'Pengumuman',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'type', label: 'Tipe' },
      { key: 'priority', label: 'Prioritas' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Judul pengumuman', colSpan: 2 },
      { name: 'type', label: 'Tipe', type: 'select', options: [
        { label: 'Umum', value: 'general' },
        { label: 'Ujian', value: 'exam' },
        { label: 'Libur', value: 'holiday' },
        { label: 'Acara', value: 'event' },
        { label: 'PPDB', value: 'ppdb' },
        { label: 'Wali Santri', value: 'wali_santri' },
      ]},
      { name: 'priority', label: 'Prioritas', type: 'number', placeholder: '0' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
      { name: 'content', label: 'Konten', type: 'textarea', required: true, placeholder: 'Isi pengumuman', colSpan: 2 },
    ],
  },
  teachers: {
    title: 'Kelola Guru',
    apiPath: 'teachers',
    itemName: 'Guru',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'position', label: 'Jabatan' },
      { key: 'subject', label: 'Mata Pelajaran' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, placeholder: 'Nama lengkap guru' },
      { name: 'position', label: 'Jabatan', type: 'text', required: true, placeholder: 'Jabatan/posisi' },
      { name: 'subject', label: 'Mata Pelajaran', type: 'text', placeholder: 'Mata pelajaran yang diampu' },
      { name: 'phone', label: 'No. Telepon', type: 'text', placeholder: '08xxx' },
      { name: 'order', label: 'Urutan', type: 'number', placeholder: '0' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
      { name: 'image', label: 'Foto Guru', type: 'image', uploadFolder: 'mdta/teachers', aspectRatio: 'portrait', placeholder: 'https://...', colSpan: 2, hint: 'Upload foto guru (rasio 3:4 disarankan)' },
    ],
  },
  students: {
    title: 'Kelola Santri',
    apiPath: 'students',
    itemName: 'Santri',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'class', label: 'Kelas' },
      { key: 'nis', label: 'NIS' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, placeholder: 'Nama lengkap santri' },
      { name: 'class', label: 'Kelas', type: 'text', required: true, placeholder: 'Kelas' },
      { name: 'nis', label: 'NIS', type: 'text', placeholder: 'Nomor Induk Santri' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
    ],
  },
  programs: {
    title: 'Kelola Program',
    apiPath: 'programs',
    itemName: 'Program',
    columns: [
      { key: 'title', label: 'Nama Program' },
      { key: 'category', label: 'Kategori' },
      { key: 'order', label: 'Urutan' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'title', label: 'Nama Program', type: 'text', required: true, placeholder: 'Nama program', colSpan: 2 },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Kelas', value: 'kelas' },
        { label: 'Kurikulum', value: 'kurikulum' },
        { label: 'Unggulan', value: 'unggulan' },
        { label: 'Ekstrakurikuler', value: 'ekstrakurikuler' },
      ]},
      { name: 'order', label: 'Urutan', type: 'number', placeholder: '0' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
      { name: 'icon', label: 'Ikon', type: 'text', placeholder: 'Nama ikon Lucide', colSpan: 2 },
      { name: 'description', label: 'Deskripsi', type: 'textarea', required: true, placeholder: 'Deskripsi program', colSpan: 2 },
    ],
  },
  achievements: {
    title: 'Kelola Prestasi',
    apiPath: 'achievements',
    itemName: 'Prestasi',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'achiever', label: 'Pencapaian Oleh' },
      { key: 'category', label: 'Kategori' },
      { key: 'level', label: 'Tingkat' },
      { key: 'year', label: 'Tahun' },
    ],
    formFields: [
      { name: 'title', label: 'Judul Prestasi', type: 'text', required: true, placeholder: 'Judul prestasi', colSpan: 2 },
      { name: 'achiever', label: 'Pencapaian Oleh', type: 'text', required: true, placeholder: 'Nama orang/kelompok' },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Santri', value: 'santri' },
        { label: 'Guru', value: 'guru' },
      ]},
      { name: 'level', label: 'Tingkat', type: 'select', options: [
        { label: 'Kecamatan', value: 'kecamatan' },
        { label: 'Kabupaten', value: 'kabupaten' },
        { label: 'Provinsi', value: 'provinsi' },
        { label: 'Nasional', value: 'nasional' },
      ]},
      { name: 'year', label: 'Tahun', type: 'text', required: true, placeholder: '2024' },
      { name: 'image', label: 'Foto Prestasi', type: 'image', uploadFolder: 'mdta/achievements', aspectRatio: 'video', placeholder: 'https://...', colSpan: 2, hint: 'Upload foto prestasi/sertifikat' },
      { name: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi prestasi', colSpan: 2 },
    ],
  },
  gallery: {
    title: 'Kelola Galeri',
    apiPath: 'gallery',
    itemName: 'Galeri',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'category', label: 'Kategori' },
      { key: 'type', label: 'Tipe' },
      { key: 'year', label: 'Tahun' },
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Judul galeri' },
      { name: 'image', label: 'Gambar Galeri', type: 'image', required: true, uploadFolder: 'mdta/gallery', aspectRatio: 'square', placeholder: 'https://...', hint: 'Upload foto galeri (wajib)' },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Kegiatan', value: 'kegiatan' },
        { label: 'Acara', value: 'acara' },
        { label: 'Tahunan', value: 'tahunan' },
      ]},
      { name: 'type', label: 'Tipe', type: 'select', options: [
        { label: 'Foto', value: 'foto' },
        { label: 'Video', value: 'video' },
      ]},
      { name: 'year', label: 'Tahun', type: 'text', placeholder: '2024', defaultValue: new Date().getFullYear().toString() },
    ],
  },
  events: {
    title: 'Kelola Event',
    apiPath: 'events',
    itemName: 'Event',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'date', label: 'Tanggal' },
      { key: 'location', label: 'Lokasi' },
      { key: 'category', label: 'Kategori' },
    ],
    formFields: [
      { name: 'title', label: 'Judul Event', type: 'text', required: true, placeholder: 'Judul event', colSpan: 2 },
      { name: 'date', label: 'Tanggal', type: 'date', required: true },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Kegiatan', value: 'kegiatan' },
        { label: 'PHBI', value: 'phbi' },
        { label: 'Keagamaan', value: 'keagamaan' },
        { label: 'Lomba', value: 'lomba' },
      ]},
      { name: 'location', label: 'Lokasi', type: 'text', placeholder: 'Lokasi acara', colSpan: 2 },
      { name: 'image', label: 'Gambar Event', type: 'image', uploadFolder: 'mdta/events', aspectRatio: 'video', placeholder: 'https://...', colSpan: 2, hint: 'Upload gambar event/kegiatan' },
      { name: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi event', colSpan: 2 },
    ],
  },
  testimonials: {
    title: 'Kelola Testimoni',
    apiPath: 'testimonials',
    itemName: 'Testimoni',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'role', label: 'Peran' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, placeholder: 'Nama pemberi testimoni' },
      { name: 'role', label: 'Peran', type: 'select', required: true, options: [
        { label: 'Wali Santri', value: 'wali_santri' },
        { label: 'Alumni', value: 'alumni' },
      ]},
      { name: 'isActive', label: 'Aktif', type: 'switch' },
      { name: 'image', label: 'Foto Testimoni', type: 'image', uploadFolder: 'mdta/testimonials', aspectRatio: 'square', placeholder: 'https://...', hint: 'Upload foto penulis testimoni' },
      { name: 'content', label: 'Testimoni', type: 'textarea', required: true, placeholder: 'Isi testimoni', colSpan: 2 },
    ],
  },
  faqs: {
    title: 'Kelola FAQ',
    apiPath: 'faqs',
    itemName: 'FAQ',
    columns: [
      { key: 'question', label: 'Pertanyaan' },
      { key: 'order', label: 'Urutan' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'question', label: 'Pertanyaan', type: 'text', required: true, placeholder: 'Pertanyaan yang sering diajukan', colSpan: 2 },
      { name: 'answer', label: 'Jawaban', type: 'textarea', required: true, placeholder: 'Jawaban pertanyaan', colSpan: 2 },
      { name: 'order', label: 'Urutan', type: 'number', placeholder: '0' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
    ],
  },
  downloads: {
    title: 'Kelola Download',
    apiPath: 'downloads',
    itemName: 'Download',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'category', label: 'Kategori' },
      { key: 'fileUrl', label: 'File', render: (value: unknown) => {
        const url = String(value || '')
        if (!url) return <span className="text-gray-400">-</span>
        const fileName = url.split('/').pop()?.split('?')[0] || 'file.pdf'
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" download
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 hover:underline max-w-[180px] truncate">
            <FileText className="h-3 w-3 shrink-0 text-red-600" />
            <span className="truncate">{fileName}</span>
          </a>
        )
      }},
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Judul file download' },
      { name: 'category', label: 'Kategori', type: 'select', required: true, options: [
        { label: 'Formulir', value: 'formulir' },
        { label: 'Kalender', value: 'kalender' },
        { label: 'Tata Tertib', value: 'tata_tertib' },
        { label: 'Jadwal', value: 'jadwal' },
        { label: 'Surat Edaran', value: 'surat_edaran' },
        { label: 'Lainnya', value: 'lainnya' },
      ]},
      { name: 'fileUrl', label: 'File PDF', type: 'pdf', required: true, uploadFolder: 'mdta/downloads', placeholder: 'https://res.cloudinary.com/...', colSpan: 2, hint: 'Upload file PDF (maks 25 MB) — atau klik "Mode URL" untuk input manual' },
    ],
  },
  dakwah: {
    title: 'Kelola Dakwah',
    apiPath: 'dakwah',
    itemName: 'Dakwah',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'category', label: 'Kategori' },
      { key: 'author', label: 'Penulis' },
      { key: 'isPublished', label: 'Status' },
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'Judul dakwah', colSpan: 2 },
      { name: 'category', label: 'Kategori', type: 'select', options: [
        { label: 'Kajian', value: 'kajian' },
        { label: 'Artikel', value: 'artikel' },
        { label: 'Kultum', value: 'kultum' },
        { label: 'Video', value: 'video' },
        { label: 'Materi', value: 'materi' },
      ]},
      { name: 'isPublished', label: 'Dipublikasi', type: 'switch' },
      { name: 'author', label: 'Penulis', type: 'text', placeholder: 'Nama penulis/ustadz' },
      { name: 'videoUrl', label: 'URL Video', type: 'text', placeholder: 'https://youtube.com/...', colSpan: 2 },
      { name: 'image', label: 'Gambar Dakwah', type: 'image', uploadFolder: 'mdta/dakwah', aspectRatio: 'video', placeholder: 'https://...', colSpan: 2, hint: 'Upload gambar artikel/video dakwah' },
      { name: 'content', label: 'Konten', type: 'textarea', required: true, placeholder: 'Isi dakwah', colSpan: 2 },
    ],
  },
  alumni: {
    title: 'Kelola Alumni',
    apiPath: 'alumni',
    itemName: 'Alumni',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'year', label: 'Tahun Lulus' },
      { key: 'currentActivity', label: 'Aktivitas Saat Ini' },
    ],
    formFields: [
      { name: 'name', label: 'Nama', type: 'text', required: true, placeholder: 'Nama lengkap alumni' },
      { name: 'year', label: 'Tahun Lulus', type: 'text', required: true, placeholder: '2024' },
      { name: 'currentActivity', label: 'Aktivitas Saat Ini', type: 'text', placeholder: 'Kuliah/Bekerja/dll' },
      { name: 'image', label: 'Foto Alumni', type: 'image', uploadFolder: 'mdta/alumni', aspectRatio: 'square', placeholder: 'https://...', hint: 'Upload foto alumni' },
      { name: 'testimony', label: 'Testimoni', type: 'textarea', placeholder: 'Testimoni alumni', colSpan: 2 },
    ],
  },
  schedules: {
    title: 'Kelola Jadwal',
    apiPath: 'schedules',
    itemName: 'Jadwal',
    columns: [
      { key: 'title', label: 'Mata Pelajaran' },
      { key: 'day', label: 'Hari' },
      { key: 'timeStart', label: 'Mulai' },
      { key: 'timeEnd', label: 'Selesai' },
      { key: 'class', label: 'Kelas' },
    ],
    formFields: [
      { name: 'title', label: 'Mata Pelajaran', type: 'text', required: true, placeholder: 'Nama mata pelajaran' },
      { name: 'day', label: 'Hari', type: 'select', required: true, options: [
        { label: 'Sabtu', value: 'Sabtu' },
        { label: 'Ahad/Minggu', value: 'Ahad' },
        { label: 'Senin', value: 'Senin' },
        { label: 'Selasa', value: 'Selasa' },
        { label: 'Rabu', value: 'Rabu' },
        { label: 'Kamis', value: 'Kamis' },
        { label: 'Jumat (Libur)', value: 'Jumat' },
      ]},
      { name: 'timeStart', label: 'Jam Mulai', type: 'text', required: true, placeholder: '07:00' },
      { name: 'timeEnd', label: 'Jam Selesai', type: 'text', required: true, placeholder: '08:30' },
      { name: 'subject', label: 'Pelajaran', type: 'text', placeholder: 'Nama pelajaran' },
      { name: 'teacher', label: 'Guru', type: 'text', placeholder: 'Nama guru pengajar' },
      { name: 'class', label: 'Kelas', type: 'text', placeholder: 'Kelas' },
    ],
  },
  payments: {
    title: 'Kelola Pembayaran',
    apiPath: 'payments',
    itemName: 'Pembayaran',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'amount', label: 'Jumlah' },
      { key: 'dueDate', label: 'Jatuh Tempo' },
      { key: 'isActive', label: 'Status' },
    ],
    formFields: [
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'SPP Bulan ...', colSpan: 2 },
      { name: 'amount', label: 'Jumlah', type: 'text', required: true, placeholder: 'Rp 150.000' },
      { name: 'dueDate', label: 'Jatuh Tempo', type: 'date' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
      { name: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Keterangan pembayaran', colSpan: 2 },
    ],
  },
}

// --- Special Components ---

function PPDBManager() {
  const queryClient = useQueryClient()
  const [selectedReg, setSelectedReg] = useState<Record<string, unknown> | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [detailReg, setDetailReg] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<'pendaftar' | 'jadwal' | 'settings'>('pendaftar')
  // PPDB schedule form + delete state
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string
    title: string
    startDate: string
    endDate: string
    location: string
    description: string
    order: number
    isActive: boolean
  } | null>(null)
  const [deleteSchedule, setDeleteSchedule] = useState<Record<string, unknown> | null>(null)

  // Fetch pendaftar
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ppdb'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ppdb')
      if (!res.ok) return []
      return res.json()
    },
  })

  // Fetch PPDB settings (sync dengan publik)
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  // PPDB settings: derive base values from settings, track user edits separately
  const ppdbBase = {
    ppdb_status: getSetting('ppdb_status') || 'open',
    ppdb_info: getSetting('ppdb_info') || '',
    ppdb_requirements: getSetting('ppdb_requirements') || '',
    ppdb_contact: getSetting('ppdb_contact') || '',
  }
  const [ppdbOverrides, setPpdbOverrides] = useState<Record<string, string>>({})
  // Merge: user overrides take precedence over base values
  const ppdbEdits = { ...ppdbBase, ...ppdbOverrides }
  const setPpdbEdit = (key: string, value: string) => setPpdbOverrides(prev => ({ ...prev, [key]: value }))

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/ppdb/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Gagal mengubah status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ppdb'] })
      toast.success('Status pendaftaran berhasil diperbarui')
      setSelectedReg(null)
    },
    onError: () => {
      toast.error('Gagal mengubah status')
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: async (edits: Record<string, string>) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: Object.entries(edits).map(([key, value]) => ({ key, value })) }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setPpdbOverrides({}) // clear overrides after save (base will refresh from server)
      toast.success('Pengaturan PPDB berhasil disimpan')
    },
    onError: () => {
      toast.error('Gagal menyimpan pengaturan')
    },
  })

  // Fetch PPDB schedules (admin)
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['admin', 'ppdb-schedules'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ppdb/schedules')
      if (!res.ok) return []
      return res.json()
    },
  })
  const schedules: Record<string, unknown>[] = Array.isArray(schedulesData) ? schedulesData : []

  // Schedule mutations
  const saveScheduleMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const isEdit = !!data.id
      const url = isEdit ? `/api/admin/ppdb/schedules/${data.id}` : '/api/admin/ppdb/schedules'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Gagal menyimpan')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ppdb-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['ppdb-schedules'] })
      toast.success('Jadwal pendaftaran berhasil disimpan')
      setScheduleForm(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ppdb/schedules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ppdb-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['ppdb-schedules'] })
      toast.success('Jadwal pendaftaran berhasil dihapus')
      setDeleteSchedule(null)
    },
    onError: () => toast.error('Gagal menghapus'),
  })

  const openCreateSchedule = () => {
    setScheduleForm({ title: '', startDate: '', endDate: '', location: '', description: '', order: 0, isActive: true })
  }
  const openEditSchedule = (s: Record<string, unknown>) => {
    setScheduleForm({
      id: s.id as string,
      title: s.title as string,
      startDate: s.startDate ? new Date(s.startDate as string).toISOString().slice(0, 10) : '',
      endDate: s.endDate ? new Date(s.endDate as string).toISOString().slice(0, 10) : '',
      location: (s.location as string) || '',
      description: (s.description as string) || '',
      order: (s.order as number) || 0,
      isActive: s.isActive !== false,
    })
  }

  const items: Record<string, unknown>[] = Array.isArray(data) ? data : []

  // Statistik
  const stats = useMemo(() => {
    const total = items.length
    const pending = items.filter(i => i.status === 'pending').length
    const accepted = items.filter(i => i.status === 'accepted').length
    const rejected = items.filter(i => i.status === 'rejected').length
    return { total, pending, accepted, rejected }
  }, [items])

  // Filter by status
  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter(i => i.status === statusFilter)
  }, [items, statusFilter])

  // Export CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }
    const headers = ['Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Nama Orang Tua', 'No. HP', 'Alamat', 'Sekolah Asal', 'Status', 'Tanggal Daftar']
    const rows = filteredItems.map(reg => [
      reg.name as string,
      reg.birthPlace as string,
      reg.birthDate ? new Date(reg.birthDate as string).toLocaleDateString('id-ID') : '-',
      reg.parentName as string,
      reg.parentPhone as string,
      (reg.address as string) || '-',
      (reg.previousSchool as string) || '-',
      reg.status === 'accepted' ? 'Diterima' : reg.status === 'rejected' ? 'Ditolak' : 'Menunggu',
      reg.createdAt ? new Date(reg.createdAt as string).toLocaleDateString('id-ID') : '-',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ppdb-export-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredItems.length} pendaftar ke CSV`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Pendaftaran Santri Baru (PPDB)
          </h2>
          <p className="text-sm text-gray-500">Kelola pendaftaran & pengaturan PPDB</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('pendaftar')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'pendaftar'
              ? 'text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4 inline mr-1" />
          Pendaftar
          <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            {stats.total}
          </span>
          {activeTab === 'pendaftar' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'jadwal'
              ? 'text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1" />
          Jadwal Pendaftaran
          <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            {schedules.length}
          </span>
          {activeTab === 'jadwal' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'settings'
              ? 'text-emerald-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4 inline mr-1" />
          Pengaturan PPDB
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600" />
          )}
        </button>
      </div>

      {/* Tab: Pendaftar */}
      {activeTab === 'pendaftar' && (
        <>
          {/* Statistik cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total Pendaftar</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Menunggu</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.accepted}</p>
                <p className="text-xs text-gray-500 mt-1">Diterima</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5 text-red-700" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{stats.rejected}</p>
                <p className="text-xs text-gray-500 mt-1">Ditolak</p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filter:</span>
            {[
              { value: 'all', label: 'Semua', count: stats.total },
              { value: 'pending', label: 'Menunggu', count: stats.pending },
              { value: 'accepted', label: 'Diterima', count: stats.accepted },
              { value: 'rejected', label: 'Ditolak', count: stats.rejected },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>#</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Orang Tua</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tgl Daftar</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        {items.length === 0 ? 'Belum ada pendaftaran' : 'Tidak ada pendaftar untuk filter ini'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((reg, idx) => (
                      <TableRow key={reg.id as string} className="hover:bg-emerald-50/50">
                        <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{reg.name as string}</TableCell>
                        <TableCell>{reg.parentName as string}</TableCell>
                        <TableCell>
                          <a href={`tel:${reg.parentPhone as string}`} className="text-emerald-700 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reg.parentPhone as string}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              reg.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : reg.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {reg.status === 'accepted' ? 'Diterima' : reg.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {reg.createdAt ? new Date(reg.createdAt as string).toLocaleDateString('id-ID') : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8"
                              onClick={() => setDetailReg(reg)}
                              title="Lihat detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 h-8"
                              onClick={() => {
                                setSelectedReg(reg)
                                setNewStatus(reg.status as string)
                              }}
                              title="Ubah status"
                            >
                              Ubah Status
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Jadwal Pendaftaran */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateSchedule} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="h-4 w-4 mr-1" /> Tambah Jadwal
            </Button>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Urutan</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulesLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-600" /></TableCell></TableRow>
                  ) : schedules.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Belum ada jadwal pendaftaran</TableCell></TableRow>
                  ) : (
                    schedules.map((s) => (
                      <TableRow key={s.id as string} className="hover:bg-emerald-50/50">
                        <TableCell className="text-sm text-gray-500">{(s.order as number) || 0}</TableCell>
                        <TableCell className="font-medium text-emerald-800">{s.title as string}</TableCell>
                        <TableCell className="text-sm">{s.startDate ? new Date(s.startDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</TableCell>
                        <TableCell className="text-sm">{s.endDate ? new Date(s.endDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{(s.location as string) || '-'}</TableCell>
                        <TableCell>
                          <Badge className={s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>
                            {s.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 h-8" onClick={() => openEditSchedule(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-8" onClick={() => setDeleteSchedule(s)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Form Dialog */}
      <Dialog open={!!scheduleForm} onOpenChange={(open) => { if (!open) setScheduleForm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{scheduleForm?.id ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
            <DialogDescription>Jadwal tahapan pendaftaran PPDB</DialogDescription>
          </DialogHeader>
          {scheduleForm && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Judul *</Label>
                <Input value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })} placeholder="Pendaftaran Tahap 1 / Tes Seleksi / Daftar Ulang..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Tanggal Mulai *</Label>
                  <Input type="date" value={scheduleForm.startDate} onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tanggal Selesai</Label>
                  <Input type="date" value={scheduleForm.endDate} onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Lokasi</Label>
                <Input value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="Madrasah MDTA Miftahul Ulum 01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Deskripsi</Label>
                <Textarea value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })} rows={3} placeholder="Keterangan jadwal..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Urutan</Label>
                  <Input type="number" value={scheduleForm.order} onChange={(e) => setScheduleForm({ ...scheduleForm, order: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 mt-5">
                  <Label htmlFor="sched-active" className="cursor-pointer text-sm">Aktif</Label>
                  <Switch id="sched-active" checked={scheduleForm.isActive} onCheckedChange={(checked) => setScheduleForm({ ...scheduleForm, isActive: checked })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleForm(null)}>Batal</Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={saveScheduleMutation.isPending}
              onClick={() => scheduleForm && saveScheduleMutation.mutate(scheduleForm)}
            >
              {saveScheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Confirmation */}
      <AlertDialog open={!!deleteSchedule} onOpenChange={(open) => { if (!open) setDeleteSchedule(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>{deleteSchedule?.title as string}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteSchedule && deleteScheduleMutation.mutate(deleteSchedule.id as string)}
            >
              {deleteScheduleMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tab: Settings PPDB (sync dengan publik) */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-600" />
                Pengaturan PPDB
              </CardTitle>
              <p className="text-xs text-gray-500">
                Pengaturan ini akan otomatis sinkron dengan halaman PPDB publik.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status PPDB */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status PPDB</Label>
                <Select
                  value={ppdbEdits.ppdb_status || 'open'}
                  onValueChange={(val) => setPpdbEdit('ppdb_status', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">🟢 Dibuka</SelectItem>
                    <SelectItem value="closed">🔴 Ditutup</SelectItem>
                    <SelectItem value="soon">🟡 Segera Dibuka</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Menentukan apakah form pendaftaran di halaman publik aktif atau tidak.
                </p>
              </div>

              {/* Info PPDB */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Info PPDB</Label>
                <Textarea
                  value={ppdbEdits.ppdb_info || ''}
                  onChange={(e) => setPpdbEdit('ppdb_info', e.target.value)}
                  placeholder="Informasi umum PPDB (tahun ajaran, jadwal, dll)"
                  rows={3}
                />
              </div>

              {/* Persyaratan */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Persyaratan</Label>
                <Textarea
                  value={ppdbEdits.ppdb_requirements || ''}
                  onChange={(e) => setPpdbEdit('ppdb_requirements', e.target.value)}
                  placeholder="Satu persyaratan per baris"
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  Tulis satu persyaratan per baris. Akan tampil sebagai list di halaman publik.
                </p>
              </div>

              {/* Kontak PPDB */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kontak PPDB</Label>
                <Textarea
                  value={ppdbEdits.ppdb_contact || ''}
                  onChange={(e) => setPpdbEdit('ppdb_contact', e.target.value)}
                  placeholder="Satu kontak per baris (Nama - No. HP)"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Format: &quot;Nama - No. HP&quot; per baris. Akan tampil sebagai list kontak di halaman publik.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => saveSettingsMutation.mutate(ppdbEdits)}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={!!selectedReg} onOpenChange={(open) => { if (!open) setSelectedReg(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Status Pendaftaran</DialogTitle>
            <DialogDescription>
              Ubah status pendaftaran untuk {selectedReg?.name as string}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="accepted">Diterima</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedReg && (
              <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
                <p><span className="text-gray-500">Nama:</span> <span className="font-medium">{selectedReg.name as string}</span></p>
                <p><span className="text-gray-500">Tempat, Tanggal Lahir:</span> {selectedReg.birthPlace as string}, {selectedReg.birthDate ? new Date(selectedReg.birthDate as string).toLocaleDateString('id-ID') : '-'}</p>
                <p><span className="text-gray-500">Orang Tua:</span> {selectedReg.parentName as string}</p>
                <p><span className="text-gray-500">No. HP:</span> {selectedReg.parentPhone as string}</p>
                {selectedReg.address && <p><span className="text-gray-500">Alamat:</span> {selectedReg.address as string}</p>}
                {selectedReg.previousSchool && <p><span className="text-gray-500">Sekolah Asal:</span> {selectedReg.previousSchool as string}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReg(null)}>Batal</Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => {
                if (selectedReg && newStatus) {
                  updateMutation.mutate({ id: selectedReg.id as string, status: newStatus })
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog — view full pendaftar info */}
      <Dialog open={!!detailReg} onOpenChange={(open) => { if (!open) setDetailReg(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              Detail Pendaftar
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap pendaftar
            </DialogDescription>
          </DialogHeader>
          {detailReg && (
            <div className="space-y-3 py-2">
              <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-lg p-4 border border-emerald-100">
                <p className="font-bold text-lg text-emerald-900">{detailReg.name as string}</p>
                <Badge
                  className="mt-1.5"
                  variant="secondary"
                >
                  {detailReg.status === 'accepted' ? '✅ Diterima' : detailReg.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu'}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Tempat Lahir:</span>
                  <span className="font-medium">{detailReg.birthPlace as string}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Tanggal Lahir:</span>
                  <span className="font-medium">
                    {detailReg.birthDate ? new Date(detailReg.birthDate as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Nama Orang Tua:</span>
                  <span className="font-medium">{detailReg.parentName as string}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0">No. HP Ortu:</span>
                  <a href={`tel:${detailReg.parentPhone as string}`} className="font-medium text-emerald-700 hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {detailReg.parentPhone as string}
                  </a>
                </div>
                {detailReg.address && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32 shrink-0">Alamat:</span>
                    <span className="font-medium">{detailReg.address as string}</span>
                  </div>
                )}
                {detailReg.previousSchool && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32 shrink-0">Sekolah Asal:</span>
                    <span className="font-medium">{detailReg.previousSchool as string}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Tanggal Daftar:</span>
                  <span className="font-medium">
                    {detailReg.createdAt ? new Date(detailReg.createdAt as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailReg(null)}>Tutup</Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => {
                if (detailReg) {
                  setSelectedReg(detailReg)
                  setNewStatus(detailReg.status as string)
                  setDetailReg(null)
                }
              }}
            >
              Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WaliSantriManager() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'meetings' | 'announcements'>('meetings')
  const [meetingForm, setMeetingForm] = useState<{
    id?: string
    title: string
    date: string
    time: string
    location: string
    description: string
    isActive: boolean
  } | null>(null)
  const [deleteMeeting, setDeleteMeeting] = useState<Record<string, unknown> | null>(null)
  const [announcementForm, setAnnouncementForm] = useState<{
    id?: string
    title: string
    content: string
    priority: number
    isActive: boolean
  } | null>(null)
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<Record<string, unknown> | null>(null)

  // Fetch meetings (admin)
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['admin', 'wali-santri-meetings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/wali-santri/meetings')
      if (!res.ok) return []
      return res.json()
    },
  })
  const meetings: Record<string, unknown>[] = Array.isArray(meetingsData) ? meetingsData : []

  // Fetch announcements (filter type='wali_santri' from admin announcements)
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements')
      if (!res.ok) return []
      return res.json()
    },
  })
  const allAnnouncements: Record<string, unknown>[] = Array.isArray(announcementsData) ? announcementsData : (announcementsData?.announcements || [])
  const waliAnnouncements = allAnnouncements.filter((a) => a.type === 'wali_santri')

  // Meeting mutations
  const saveMeetingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const isEdit = !!data.id
      const url = isEdit ? `/api/admin/wali-santri/meetings/${data.id}` : '/api/admin/wali-santri/meetings'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Gagal menyimpan')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wali-santri-meetings'] })
      queryClient.invalidateQueries({ queryKey: ['wali-santri-meetings'] })
      toast.success('Jadwal pertemuan berhasil disimpan')
      setMeetingForm(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/wali-santri/meetings/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wali-santri-meetings'] })
      queryClient.invalidateQueries({ queryKey: ['wali-santri-meetings'] })
      toast.success('Jadwal pertemuan berhasil dihapus')
      setDeleteMeeting(null)
    },
    onError: () => toast.error('Gagal menghapus'),
  })

  // Announcement mutations (reuse existing /api/admin/announcements)
  const saveAnnouncementMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const isEdit = !!data.id
      const url = isEdit ? `/api/admin/announcements/${data.id}` : '/api/admin/announcements'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'wali_santri' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Gagal menyimpan')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['wali-santri-announcements'] })
      toast.success('Pengumuman wali santri berhasil disimpan')
      setAnnouncementForm(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['wali-santri-announcements'] })
      toast.success('Pengumuman berhasil dihapus')
      setDeleteAnnouncement(null)
    },
    onError: () => toast.error('Gagal menghapus'),
  })

  const openCreateMeeting = () => {
    setMeetingForm({ title: '', date: '', time: '', location: '', description: '', isActive: true })
  }
  const openEditMeeting = (m: Record<string, unknown>) => {
    setMeetingForm({
      id: m.id as string,
      title: m.title as string,
      date: m.date ? new Date(m.date as string).toISOString().slice(0, 10) : '',
      time: m.time as string,
      location: (m.location as string) || '',
      description: (m.description as string) || '',
      isActive: m.isActive !== false,
    })
  }

  const openCreateAnnouncement = () => {
    setAnnouncementForm({ title: '', content: '', priority: 0, isActive: true })
  }
  const openEditAnnouncement = (a: Record<string, unknown>) => {
    setAnnouncementForm({
      id: a.id as string,
      title: a.title as string,
      content: a.content as string,
      priority: (a.priority as number) || 0,
      isActive: a.isActive !== false,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          Wali Santri
        </h2>
        <p className="text-sm text-gray-500">Kelola jadwal pertemuan & pengumuman untuk wali santri</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'meetings' ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1" />
          Jadwal Pertemuan
          <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            {meetings.length}
          </span>
          {activeTab === 'meetings' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600" />}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'announcements' ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone className="h-4 w-4 inline mr-1" />
          Pengumuman
          <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            {waliAnnouncements.length}
          </span>
          {activeTab === 'announcements' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-600" />}
        </button>
      </div>

      {/* Tab: Meetings */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateMeeting} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="h-4 w-4 mr-1" /> Tambah Pertemuan
            </Button>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetingsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-600" /></TableCell></TableRow>
                  ) : meetings.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Belum ada jadwal pertemuan</TableCell></TableRow>
                  ) : (
                    meetings.map((m) => (
                      <TableRow key={m.id as string} className="hover:bg-emerald-50/50">
                        <TableCell className="font-medium text-emerald-800">{m.title as string}</TableCell>
                        <TableCell className="text-sm">{m.date ? new Date(m.date as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</TableCell>
                        <TableCell className="text-sm">{m.time as string}</TableCell>
                        <TableCell className="text-sm text-gray-500">{(m.location as string) || '-'}</TableCell>
                        <TableCell>
                          <Badge className={m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>
                            {m.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 h-8" onClick={() => openEditMeeting(m)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-8" onClick={() => setDeleteMeeting(m)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateAnnouncement} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="h-4 w-4 mr-1" /> Tambah Pengumuman
            </Button>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Judul</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcementsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-600" /></TableCell></TableRow>
                  ) : waliAnnouncements.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Belum ada pengumuman wali santri</TableCell></TableRow>
                  ) : (
                    waliAnnouncements.map((a) => (
                      <TableRow key={a.id as string} className="hover:bg-emerald-50/50">
                        <TableCell className="font-medium text-emerald-800">{a.title as string}</TableCell>
                        <TableCell className="text-sm">{(a.priority as number) || 0}</TableCell>
                        <TableCell>
                          <Badge className={a.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>
                            {a.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{a.createdAt ? new Date(a.createdAt as string).toLocaleDateString('id-ID') : '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 h-8" onClick={() => openEditAnnouncement(a)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-8" onClick={() => setDeleteAnnouncement(a)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Form Dialog */}
      <Dialog open={!!meetingForm} onOpenChange={(open) => { if (!open) setMeetingForm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{meetingForm?.id ? 'Edit Pertemuan' : 'Tambah Pertemuan'}</DialogTitle>
            <DialogDescription>Jadwal pertemuan wali santri</DialogDescription>
          </DialogHeader>
          {meetingForm && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Judul *</Label>
                <Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Pertemuan Wali Santri Semester..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Tanggal *</Label>
                  <Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Waktu *</Label>
                  <Input value={meetingForm.time} onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })} placeholder="09:00 - 11:00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Lokasi</Label>
                <Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Aula Madrasah" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Deskripsi</Label>
                <Textarea value={meetingForm.description} onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })} rows={3} placeholder="Agenda pertemuan..." />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="meeting-active" className="cursor-pointer">Aktif (tampil di publik)</Label>
                <Switch id="meeting-active" checked={meetingForm.isActive} onCheckedChange={(checked) => setMeetingForm({ ...meetingForm, isActive: checked })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingForm(null)}>Batal</Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={saveMeetingMutation.isPending}
              onClick={() => meetingForm && saveMeetingMutation.mutate(meetingForm)}
            >
              {saveMeetingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Form Dialog */}
      <Dialog open={!!announcementForm} onOpenChange={(open) => { if (!open) setAnnouncementForm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{announcementForm?.id ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</DialogTitle>
            <DialogDescription>Pengumuman khusus untuk wali santri</DialogDescription>
          </DialogHeader>
          {announcementForm && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Judul *</Label>
                <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Pengumuman untuk wali santri..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Konten *</Label>
                <Textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={4} placeholder="Isi pengumuman..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Prioritas</Label>
                  <Input type="number" value={announcementForm.priority} onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 mt-5">
                  <Label htmlFor="ann-active" className="cursor-pointer text-sm">Aktif</Label>
                  <Switch id="ann-active" checked={announcementForm.isActive} onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, isActive: checked })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementForm(null)}>Batal</Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={saveAnnouncementMutation.isPending}
              onClick={() => announcementForm && saveAnnouncementMutation.mutate(announcementForm)}
            >
              {saveAnnouncementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteMeeting} onOpenChange={(open) => { if (!open) setDeleteMeeting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal Pertemuan?</AlertDialogTitle>
            <AlertDialogDescription>{deleteMeeting?.title as string}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteMeeting && deleteMeetingMutation.mutate(deleteMeeting.id as string)}
            >
              {deleteMeetingMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAnnouncement} onOpenChange={(open) => { if (!open) setDeleteAnnouncement(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>{deleteAnnouncement?.title as string}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteAnnouncement && deleteAnnouncementMutation.mutate(deleteAnnouncement.id as string)}
            >
              {deleteAnnouncementMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ContactMessagesManager() {
  const queryClient = useQueryClient()
  const [selectedMsg, setSelectedMsg] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'contact-messages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/contact-messages')
      if (!res.ok) return []
      return res.json()
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Gagal menandai pesan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact-messages'] })
      toast.success('Pesan ditandai sebagai dibaca')
      setSelectedMsg(null)
    },
    onError: () => {
      toast.error('Gagal menandai pesan')
    },
  })

  const items: Record<string, unknown>[] = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pesan Kontak</h2>
        <p className="text-sm text-gray-500">Lihat pesan dari pengunjung website</p>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>#</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    Belum ada pesan
                  </TableCell>
                </TableRow>
              ) : (
                items.map((msg, idx) => (
                  <TableRow key={msg.id as string} className={!msg.isRead ? 'bg-amber-50/50' : ''}>
                    <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                        {msg.name as string}
                      </div>
                    </TableCell>
                    <TableCell>{(msg.email as string) || '-'}</TableCell>
                    <TableCell>{(msg.subject as string) || '-'}</TableCell>
                    <TableCell>
                      <Badge className={msg.isRead ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}>
                        {msg.isRead ? 'Dibaca' : 'Baru'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {msg.createdAt ? new Date(msg.createdAt as string).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          onClick={() => setSelectedMsg(msg)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {!msg.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-800"
                            onClick={() => markReadMutation.mutate(msg.id as string)}
                          >
                            <Mail className="h-4 w-4" />
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
      </div>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={(open) => { if (!open) setSelectedMsg(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Nama</Label>
                  <p className="text-sm font-medium">{selectedMsg.name as string}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="text-sm">{(selectedMsg.email as string) || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Telepon</Label>
                  <p className="text-sm">{(selectedMsg.phone as string) || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tanggal</Label>
                  <p className="text-sm">
                    {selectedMsg.createdAt ? new Date(selectedMsg.createdAt as string).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    }) : '-'}
                  </p>
                </div>
              </div>
              {(selectedMsg.subject as string) && (
                <div>
                  <Label className="text-xs text-gray-500">Subjek</Label>
                  <p className="text-sm font-medium">{selectedMsg.subject as string}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Pesan</Label>
                <div className="bg-gray-50 rounded-lg p-3 mt-1">
                  <p className="text-sm whitespace-pre-wrap">{selectedMsg.message as string}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedMsg && !selectedMsg.isRead && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => markReadMutation.mutate(selectedMsg.id as string)}
                disabled={markReadMutation.isPending}
              >
                Tandai Dibaca
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedMsg(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SuggestionsManager() {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suggestions')
      if (!res.ok) return []
      return res.json()
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Gagal menandai')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] })
      toast.success('Saran ditandai sebagai dibaca')
      setSelectedItem(null)
    },
    onError: () => {
      toast.error('Gagal menandai saran')
    },
  })

  const items: Record<string, unknown>[] = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Kritik & Saran</h2>
        <p className="text-sm text-gray-500">Lihat kritik dan saran dari pengunjung</p>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>#</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    Belum ada saran
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={item.id as string} className={!item.isRead ? 'bg-amber-50/50' : ''}>
                    <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                        {item.name as string}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{(item.type as string) || 'saran'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{(item.message as string)?.slice(0, 60)}</TableCell>
                    <TableCell>
                      <Badge className={item.isRead ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}>
                        {item.isRead ? 'Dibaca' : 'Baru'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.createdAt ? new Date(item.createdAt as string).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => setSelectedItem(item)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {!item.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => markReadMutation.mutate(item.id as string)}
                          >
                            <Mail className="h-4 w-4" />
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
      </div>

      {/* View Suggestion Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Saran</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Nama</Label>
                  <p className="text-sm font-medium">{selectedItem.name as string}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tipe</Label>
                  <Badge variant="outline" className="capitalize">{(selectedItem.type as string) || 'saran'}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Pesan</Label>
                <div className="bg-gray-50 rounded-lg p-3 mt-1">
                  <p className="text-sm whitespace-pre-wrap">{selectedItem.message as string}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tanggal</Label>
                <p className="text-sm">
                  {selectedItem.createdAt ? new Date(selectedItem.createdAt as string).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }) : '-'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedItem && !selectedItem.isRead && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => markReadMutation.mutate(selectedItem.id as string)}
                disabled={markReadMutation.isPending}
              >
                Tandai Dibaca
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingsManager() {
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: statisticsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'statistics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/statistics')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: institutionData, isLoading: institutionLoading } = useQuery({
    queryKey: ['admin', 'institution'],
    queryFn: async () => {
      const res = await fetch('/api/admin/institution')
      if (!res.ok) return []
      return res.json()
    },
  })

  // Track local edits separate from API data
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({})
  const [statsEdits, setStatsEdits] = useState<Record<string, string>>({})
  const [institutionEdits, setInstitutionEdits] = useState<Record<string, { value: string; label: string }>>({})

  // Derive current values from API data + local edits
  const settingsValues = useMemo(() => {
    const map: Record<string, string> = {}
    if (Array.isArray(settingsData)) {
      settingsData.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
    }
    return { ...map, ...settingsEdits }
  }, [settingsData, settingsEdits])

  // Map of setting key -> label from API
  const settingsLabels = useMemo(() => {
    const map: Record<string, string> = {}
    if (Array.isArray(settingsData)) {
      settingsData.forEach((s: { key: string; value: string; label?: string }) => { map[s.key] = s.label || '' })
    }
    return map
  }, [settingsData])

  const statsValues = useMemo(() => {
    const map: Record<string, string> = {}
    if (Array.isArray(statisticsData)) {
      statisticsData.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
    }
    return { ...map, ...statsEdits }
  }, [statisticsData, statsEdits])

  const institutionValues = useMemo(() => {
    const map: Record<string, { value: string; label: string }> = {}
    if (Array.isArray(institutionData)) {
      institutionData.forEach((s: { key: string; value: string; label: string }) => {
        map[s.key] = { value: s.value, label: s.label }
      })
    }
    // Merge edits
    const merged = { ...map }
    Object.entries(institutionEdits).forEach(([key, val]) => {
      merged[key] = { ...merged[key], ...val }
    })
    return merged
  }, [institutionData, institutionEdits])

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const settings = Object.entries(settingsValues).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      toast.success('Pengaturan berhasil disimpan')
    },
    onError: () => {
      toast.error('Gagal menyimpan pengaturan')
    },
  })

  const saveStatsMutation = useMutation({
    mutationFn: async () => {
      const statistics = Object.entries(statsValues).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/statistics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statistics }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan statistik')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] })
      toast.success('Statistik berhasil disimpan')
    },
    onError: () => {
      toast.error('Gagal menyimpan statistik')
    },
  })

  const saveInstitutionMutation = useMutation({
    mutationFn: async () => {
      const data = Object.entries(institutionValues).map(([key, { value, label }]) => ({ key, value, label }))
      const res = await fetch('/api/admin/institution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan data lembaga')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institution'] })
      toast.success('Data lembaga berhasil disimpan')
    },
    onError: () => {
      toast.error('Gagal menyimpan data lembaga')
    },
  })

  const [activeTab, setActiveTab] = useState<'settings' | 'statistics' | 'institution'>('settings')

  if (settingsLoading || statsLoading || institutionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pengaturan Website</h2>
        <p className="text-sm text-gray-500">Kelola pengaturan dan data website</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'settings' as const, label: 'Pengaturan' },
          { id: 'statistics' as const, label: 'Statistik' },
          { id: 'institution' as const, label: 'Data Lembaga' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === tab.id ? 'bg-emerald-700 hover:bg-emerald-800' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pengaturan Website</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Image Settings - Cloudinary Upload */}
            {(['madrasah_principal_photo', 'madrasah_hero_image', 'madrasah_logo'] as const).map((imgKey) =>
              settingsValues[imgKey] !== undefined && (
                <div key={imgKey} className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0">
                    <ImageUpload
                      value={settingsValues[imgKey] || ''}
                      onChange={(url) => setSettingsEdits((prev) => ({ ...prev, [imgKey]: url }))}
                      folder={`mdta/settings/${imgKey.replace('madrasah_', '').replace('_photo', '').replace('_image', '')}`}
                      label={imgKey === 'madrasah_principal_photo' ? 'Foto Kepala' :
                             imgKey === 'madrasah_hero_image' ? 'Hero' : 'Logo'}
                      placeholder="/images/... atau upload baru"
                      aspectRatio={imgKey === 'madrasah_logo' ? 'square' : imgKey === 'madrasah_hero_image' ? 'wide' : 'portrait'}
                      hint="Upload atau klik 'Mode URL'"
                      maxWidth={
                        imgKey === 'madrasah_principal_photo' ? 'w-32 sm:w-36' :
                        imgKey === 'madrasah_logo' ? 'w-24 sm:w-28' :
                        'w-full sm:w-64'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {imgKey === 'madrasah_principal_photo' ? 'Foto Kepala Madrasah' :
                       imgKey === 'madrasah_hero_image' ? 'Gambar Hero Beranda' : 'Logo Madrasah'}
                    </p>
                    <p className="text-xs text-amber-700/80">
                      {imgKey === 'madrasah_principal_photo'
                        ? 'Foto profil kepala madrasah. Rasio 3:4 (portrait) disarankan.'
                        : imgKey === 'madrasah_hero_image'
                        ? 'Gambar latar belakang section hero di halaman beranda. Rasio 16:9 (wide) disarankan.'
                        : 'Logo madrasah. Format persegi (1:1) dengan latar transparan (PNG/SVG) disarankan.'}
                    </p>
                    <p className="text-[11px] text-amber-600/70 mt-2">
                      Format: JPEG, PNG, WebP, GIF, SVG. Maksimal 10 MB.
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Grouped Settings */}
            {(() => {
              const imageKeys = ['madrasah_principal_photo', 'madrasah_hero_image', 'madrasah_logo']
              const longTextKeys = ['madrasah_history', 'madrasah_welcome', 'madrasah_mission', 'madrasah_goals', 'madrasah_struktur_organisasi', 'ppdb_requirements', 'wali_santri_meeting_schedule']
              const filteredEntries = Object.entries(settingsValues).filter(([key]) => !imageKeys.includes(key))
              
              const groups: Record<string, string[]> = {
                'Identitas Madrasah': ['madrasah_name', 'madrasah_subtitle', 'madrasah_description', 'madrasah_history_year', 'madrasah_footer_description', 'madrasah_copyright'],
                'Kontak & Sosial Media': ['madrasah_address', 'madrasah_phone', 'madrasah_email', 'madrasah_service_hours', 'madrasah_facebook', 'madrasah_instagram', 'madrasah_youtube', 'madrasah_tiktok', 'madrasah_whatsapp_number', 'madrasah_whatsapp_message'],
                'Profil Madrasah': ['madrasah_welcome', 'madrasah_vision', 'madrasah_mission', 'madrasah_goals', 'madrasah_history', 'madrasah_struktur_organisasi', 'madrasah_principals_name'],
                'Kelembagaan': ['madrasah_yayasan', 'madrasah_nsdt', 'madrasah_sk', 'madrasah_izin', 'madrasah_akreditasi', 'madrasah_maps', 'madrasah_maps_embed_url'],
                'PPDB': ['ppdb_status', 'ppdb_info', 'ppdb_requirements', 'ppdb_contact'],
                'Wali Santri': ['wali_santri_meeting_schedule'],
              }

              const groupedKeys = new Set(Object.values(groups).flat())
              const otherEntries = filteredEntries.filter(([key]) => !groupedKeys.has(key))

              return (
                <div className="space-y-6">
                  {Object.entries(groups).map(([groupName, keys]) => {
                    const groupEntries = keys.filter(k => settingsValues[k] !== undefined).map(k => [k, settingsValues[k]] as [string, string])
                    if (groupEntries.length === 0) return null
                    return (
                      <div key={groupName}>
                        <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-amber-500 rounded-full" />
                          {groupName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupEntries.map(([key, value]) => (
                            <div key={key} className={longTextKeys.includes(key) ? 'md:col-span-2' : ''}>
                              <Label className="text-xs text-gray-500">
                                {settingsLabels[key] || key.replace(/_/g, ' ').replace(/madrasah/g, '').trim() || key}
                              </Label>
                              {longTextKeys.includes(key) ? (
                                <Textarea
                                  value={value}
                                  onChange={(e) => setSettingsEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                  rows={4}
                                  className="mt-1"
                                />
                              ) : (
                                <Input
                                  value={value}
                                  onChange={(e) => setSettingsEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="mt-1"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {otherEntries.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                        Lainnya
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {otherEntries.map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-xs text-gray-500">
                              {settingsLabels[key] || key.replace(/_/g, ' ').replace(/madrasah/g, '').trim() || key}
                            </Label>
                            <Input
                              value={value}
                              onChange={(e) => setSettingsEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(settingsValues).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada pengaturan. Data akan muncul setelah pertama kali disimpan.
                    </p>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Statistik Website</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => saveStatsMutation.mutate()}
                disabled={saveStatsMutation.isPending}
              >
                {saveStatsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(statsValues).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) => setStatsEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {Object.keys(statsValues).length === 0 && (
                <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                  Belum ada statistik. Data akan muncul setelah pertama kali disimpan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Institution Tab */}
      {activeTab === 'institution' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Data Kelembagaan</CardTitle>
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => saveInstitutionMutation.mutate()}
                disabled={saveInstitutionMutation.isPending}
              >
                {saveInstitutionMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(institutionValues).map(([key, { value, label }]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-gray-500">{label || key.replace(/_/g, ' ')}</Label>
                  <Input
                    value={value}
                    onChange={(e) => setInstitutionEdits((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], value: e.target.value },
                    }))}
                  />
                </div>
              ))}
              {Object.keys(institutionValues).length === 0 && (
                <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                  Belum ada data lembaga. Data akan muncul setelah pertama kali disimpan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Main AdminPanel Component ---

interface AdminPanelProps {
  adminName?: string
  onLogout?: () => void
}

export default function AdminPanel({ adminName: adminNameProp, onLogout }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const adminName = adminNameProp || 'Admin'

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = '/admin'
    }
  }

  const handleNavigate = (section: string) => {
    setActiveSection(section as AdminSection)
    setSidebarOpen(false)
  }

  // Get breadcrumb
  const getBreadcrumb = () => {
    const item = navItems.find((n) => n.id === activeSection)
    return item?.label || 'Dashboard'
  }

  // Render content
  const renderContent = () => {
    if (activeSection === 'dashboard') {
      return <AdminDashboard onNavigate={handleNavigate} />
    }
    if (activeSection === 'ppdb') {
      return <PPDBManager />
    }
    if (activeSection === 'wali-santri') {
      return <WaliSantriManager />
    }
    if (activeSection === 'contact-messages') {
      return <ContactMessagesManager />
    }
    if (activeSection === 'suggestions') {
      return <SuggestionsManager />
    }
    if (activeSection === 'settings') {
      return <SettingsManager />
    }
    const config = entityConfigs[activeSection]
    if (config) {
      return (
        <CRUDManager
          title={config.title}
          apiPath={config.apiPath}
          columns={config.columns}
          formFields={config.formFields}
          itemName={config.itemName}
          canCreate={config.canCreate}
          canDelete={config.canDelete}
          canEdit={config.canEdit}
        />
      )
    }
    return <AdminDashboard onNavigate={handleNavigate} />
  }

  // Group nav items
  const groupedNav: { group: string; items: NavItem[] }[] = []
  let currentGroup = '__none__'
  navItems.forEach((item) => {
    const group = item.group || ''
    if (group !== currentGroup) {
      groupedNav.push({ group, items: [item] })
      currentGroup = group
    } else {
      groupedNav[groupedNav.length - 1].items.push(item)
    }
  })

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-emerald-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow">
                  <img src="/images/logo-madin-warna.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">MDTA Miftahul Ulum</p>
                  <p className="text-emerald-300 text-xs">Admin Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-emerald-200 hover:text-white hover:bg-emerald-700 h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-2">
            <div className="px-3">
              {groupedNav.map((group) => (
                <div key={group.group || 'main'} className="mb-2">
                  {group.group && (
                    <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider px-3 py-2 mt-2">
                      {group.group}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === item.id
                          ? 'bg-emerald-700 text-white font-medium'
                          : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* User & Logout */}
          <div className="p-4 border-t border-emerald-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <img src="/images/logo-madin-warna.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{adminName || 'Admin'}</p>
                  <p className="text-xs text-emerald-400">Administrator</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-emerald-300 hover:text-white hover:bg-emerald-700 h-8 w-8 shrink-0"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-xs text-emerald-300 hover:text-amber-400 transition-colors"
            >
              ← Kembali ke Website
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-900 font-medium">{getBreadcrumb()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  <span className="hidden sm:inline">Lihat Website</span>
                  <span className="sm:hidden">Website</span>
                </Button>
              </a>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                  {(adminName || 'A').charAt(0).toUpperCase()}
                </div>
                <span>{adminName || 'Admin'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
