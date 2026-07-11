'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Newspaper, Megaphone, Users, GraduationCap, Trophy, Calendar,
  Image as ImageIcon, MessageSquare, Mail, FileText, BookOpen, Download,
  Clock, Star, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GPSLocationSetup } from '@/components/admin/GPSLocationSetup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  onNavigate: (section: string) => void
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  delay: number
  onClick?: () => void
}

function StatCard({ title, value, icon, color, delay, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card
        className={`cursor-pointer hover:shadow-lg transition-shadow ${onClick ? '' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  // Fetch counts for various entities
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['admin', 'news'],
    queryFn: async () => {
      const res = await fetch('/api/admin/news')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: teachersData } = useQuery({
    queryKey: ['admin', 'teachers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/teachers')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: studentsData } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      const res = await fetch('/api/admin/students')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['admin', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/achievements')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: galleryData } = useQuery({
    queryKey: ['admin', 'gallery'],
    queryFn: async () => {
      const res = await fetch('/api/admin/gallery')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: ppdbData } = useQuery({
    queryKey: ['admin', 'ppdb'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ppdb')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: contactData } = useQuery({
    queryKey: ['admin', 'contact-messages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/contact-messages')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: suggestionsData } = useQuery({
    queryKey: ['admin', 'suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suggestions')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: eventsData } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const res = await fetch('/api/admin/events')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: faqsData } = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/faqs')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: dakwahData } = useQuery({
    queryKey: ['admin', 'dakwah'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dakwah')
      if (!res.ok) return []
      return res.json()
    },
  })

  // Calculate stats
  const news = Array.isArray(newsData) ? newsData : []
  const announcements = Array.isArray(announcementsData) ? announcementsData : []
  const teachers = Array.isArray(teachersData) ? teachersData : []
  const students = Array.isArray(studentsData) ? studentsData : []
  const achievements = Array.isArray(achievementsData) ? achievementsData : []
  const gallery = Array.isArray(galleryData) ? galleryData : []
  const ppdb = Array.isArray(ppdbData) ? ppdbData : []
  const contacts = Array.isArray(contactData) ? contactData : []
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData : []
  const events = Array.isArray(eventsData) ? eventsData : []
  const faqs = Array.isArray(faqsData) ? faqsData : []
  const dakwah = Array.isArray(dakwahData) ? dakwahData : []

  const unreadContacts = contacts.filter((m: Record<string, unknown>) => !m.isRead).length
  const unreadSuggestions = suggestions.filter((s: Record<string, unknown>) => !s.isRead).length
  const pendingPPDB = ppdb.filter((p: Record<string, unknown>) => p.status === 'pending').length
  const publishedNews = news.filter((n: Record<string, unknown>) => n.isPublished).length

  // Recent PPDB registrations
  const recentPPDB = ppdb.slice(0, 5)
  // Recent contact messages
  const recentContacts = contacts.slice(0, 5)

  const stats: StatCardProps[] = [
    {
      title: 'Total Berita',
      value: newsLoading ? '...' : news.length,
      icon: <Newspaper className="h-6 w-6 text-white" />,
      color: 'bg-emerald-600',
      delay: 0,
      onClick: () => onNavigate('news'),
    },
    {
      title: 'Pengumuman',
      value: announcements.length,
      icon: <Megaphone className="h-6 w-6 text-white" />,
      color: 'bg-amber-600',
      delay: 0.05,
      onClick: () => onNavigate('announcements'),
    },
    {
      title: 'Guru',
      value: teachers.length,
      icon: <Users className="h-6 w-6 text-white" />,
      color: 'bg-blue-600',
      delay: 0.1,
      onClick: () => onNavigate('teachers'),
    },
    {
      title: 'Santri',
      value: students.length,
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      color: 'bg-purple-600',
      delay: 0.15,
      onClick: () => onNavigate('students'),
    },
    {
      title: 'Prestasi',
      value: achievements.length,
      icon: <Trophy className="h-6 w-6 text-white" />,
      color: 'bg-yellow-600',
      delay: 0.2,
      onClick: () => onNavigate('achievements'),
    },
    {
      title: 'Event',
      value: events.length,
      icon: <Calendar className="h-6 w-6 text-white" />,
      color: 'bg-rose-600',
      delay: 0.25,
      onClick: () => onNavigate('events'),
    },
    {
      title: 'Galeri',
      value: gallery.length,
      icon: <ImageIcon className="h-6 w-6 text-white" />,
      color: 'bg-teal-600',
      delay: 0.3,
      onClick: () => onNavigate('gallery'),
    },
    {
      title: 'Dakwah',
      value: dakwah.length,
      icon: <BookOpen className="h-6 w-6 text-white" />,
      color: 'bg-indigo-600',
      delay: 0.35,
      onClick: () => onNavigate('dakwah'),
    },
    {
      title: 'FAQ',
      value: faqs.length,
      icon: <FileText className="h-6 w-6 text-white" />,
      color: 'bg-cyan-600',
      delay: 0.4,
      onClick: () => onNavigate('faqs'),
    },
    {
      title: 'Download',
      value: 0,
      icon: <Download className="h-6 w-6 text-white" />,
      color: 'bg-gray-600',
      delay: 0.45,
      onClick: () => onNavigate('downloads'),
    },
    {
      title: 'Pesan Masuk',
      value: unreadContacts,
      icon: <Mail className="h-6 w-6 text-white" />,
      color: 'bg-orange-600',
      delay: 0.5,
      onClick: () => onNavigate('contact-messages'),
    },
    {
      title: 'PPDB Pending',
      value: pendingPPDB,
      icon: <Star className="h-6 w-6 text-white" />,
      color: 'bg-pink-600',
      delay: 0.55,
      onClick: () => onNavigate('ppdb'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-xl p-6 text-white"
      >
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-emerald-200 mt-1">
          Selamat datang di panel admin MDTA Miftahul Ulum 01
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-xs text-emerald-200">Berita Dipublikasi</p>
            <p className="text-lg font-bold">{publishedNews}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-xs text-emerald-200">Pesan Belum Dibaca</p>
            <p className="text-lg font-bold">{unreadContacts + unreadSuggestions}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-xs text-emerald-200">PPDB Menunggu</p>
            <p className="text-lg font-bold">{pendingPPDB}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent PPDB Registrations */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                Pendaftaran PPDB Terbaru
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => onNavigate('ppdb')}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPPDB.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada pendaftaran</p>
            ) : (
              <div className="space-y-3">
                {recentPPDB.map((reg: Record<string, unknown>) => (
                  <div
                    key={reg.id as string}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reg.name as string}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reg.parentName as string} •{' '}
                        {reg.createdAt
                          ? new Date(reg.createdAt as string).toLocaleDateString('id-ID')
                          : '-'}
                      </p>
                    </div>
                    <Badge
                      className={
                        reg.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : reg.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {reg.status === 'accepted'
                        ? 'Diterima'
                        : reg.status === 'rejected'
                        ? 'Ditolak'
                        : 'Menunggu'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contact Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                Pesan Kontak Terbaru
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-700"
                onClick={() => onNavigate('contact-messages')}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada pesan</p>
            ) : (
              <div className="space-y-3">
                {recentContacts.map((msg: Record<string, unknown>) => (
                  <div
                    key={msg.id as string}
                    className="flex items-start justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {msg.name as string}
                        </p>
                        {!msg.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {(msg.subject as string) || (msg.message as string)?.slice(0, 60)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {msg.createdAt
                        ? new Date(msg.createdAt as string).toLocaleDateString('id-ID')
                        : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Aksi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
              onClick={() => onNavigate('news')}
            >
              <Newspaper className="h-5 w-5" />
              <span className="text-xs">Kelola Berita</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
              onClick={() => onNavigate('announcements')}
            >
              <Megaphone className="h-5 w-5" />
              <span className="text-xs">Pengumuman</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              onClick={() => onNavigate('ppdb')}
            >
              <GraduationCap className="h-5 w-5" />
              <span className="text-xs">PPDB</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
              onClick={() => onNavigate('settings')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Pengaturan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GPS Location Setup */}
      <GPSLocationSetup />
    </div>
  )
}
