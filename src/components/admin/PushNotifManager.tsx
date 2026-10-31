'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Send, Bell, Users, AlertCircle, CheckCircle2, Loader2,
  Smartphone, Monitor, Globe, Trash2, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

/**
 * PushNotifManager — admin UI for sending push notifications.
 *
 * Features:
 * — Compose & send push notification to all subscribers
 * — Shows subscriber count (FCM + VAPID tokens)
 * — Quick templates (News, Event, General announcement)
 * — Optional URL to open when notification clicked
 * — Live preview of how notification will look
 * — Send history (last 5 sends)
 */
export default function PushNotifManager() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/')
  const [tag, setTag] = useState('mdta-push')
  const [history, setHistory] = useState<Array<{
    title: string
    body: string
    ts: string
    fcmSent: number
    vapidSent: number
  }>>([])

  // Fetch subscriber count
  const { data: fcmCountData, refetch: refetchFcm } = useQuery({
    queryKey: ['admin', 'fcm-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/fcm-register')
      if (!res.ok) return { count: 0 }
      return res.json()
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; url?: string; tag?: string }) => {
      const res = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Gagal mengirim push notification')
      }
      return data
    },
    onSuccess: (data) => {
      const fcmSent = data.fcmSent || 0
      const vapidSent = data.vapidSent || 0
      const total = data.total || (fcmSent + vapidSent)

      if (total > 0) {
        toast.success(`Push notification terkirim!`, {
          description: `FCM: ${fcmSent} • VAPID: ${vapidSent} • Total: ${total} device`,
          duration: 6000,
        })
        setHistory((prev) => [
          { title, body, ts: new Date().toISOString(), fcmSent, vapidSent },
          ...prev.slice(0, 4), // keep last 5
        ])
        setTitle('')
        setBody('')
        refetchFcm()
      } else {
        toast.warning('Push notification tidak terkirim', {
          description: 'Belum ada subscriber. Pastikan visitor sudah aktifkan notifikasi.',
          duration: 8000,
        })
      }
    },
    onError: (error: Error) => {
      toast.error('Gagal kirim push notification', {
        description: error.message,
        duration: 8000,
      })
    },
  })

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title dan pesan harus diisi')
      return
    }
    sendMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      url: url || '/',
      tag: tag || 'mdta-push',
    })
  }

  // Quick templates
  const templates = [
    { label: 'Berita Baru', title: '📰 Berita Baru!', body: 'Ada berita terbaru dari MDTA Miftahul Ulum 01. Klik untuk membaca.', url: '/?page=berita' },
    { label: 'Pengumuman', title: '📢 Pengumuman', body: 'Pengumuman penting dari madrasah. Silakan cek detailnya.', url: '/?page=pengumuman' },
    { label: 'Event Kegiatan', title: '📅 Kegiatan Mendatang', body: 'Ada kegiatan madrasah yang akan datang. Lihat jadwal lengkap.', url: '/?page=berita' },
    { label: 'Prestasi', title: '🏆 Prestasi Santri', body: 'Santri kami meraih prestasi lagi! Selamat keluarga besar MDTA.', url: '/?page=prestasi' },
  ]

  const applyTemplate = (t: typeof templates[0]) => {
    setTitle(t.title)
    setBody(t.body)
    setUrl(t.url)
  }

  const fcmCount = fcmCountData?.count || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 sm:p-6 text-white"
        style={{ background: 'linear-gradient(to right, #003527, #064e3b)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#cca72f]" />
              Push Notifikasi
            </h1>
            <p className="text-[#b0f0d6] mt-1">
              Kirim notifikasi push ke semua subscriber (FCM + VAPID)
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-[#b0f0d6]">Subscriber FCM</p>
              <p className="text-2xl font-bold text-[#cca72f]">{fcmCount}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchFcm()}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Compose form (left, 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-[#003527]" />
                Kirim Push Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick templates */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Template Cepat</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[#e4e2de] bg-[#f5f3ef] hover:bg-[#003527] hover:text-white transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="push-title" className="text-sm font-medium">
                  Judul Notifikasi <span className="text-[#ba1a1a]">*</span>
                </Label>
                <Input
                  id="push-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Berita Baru!"
                  maxLength={100}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">{title.length}/100</p>
              </div>

              {/* Body */}
              <div>
                <Label htmlFor="push-body" className="text-sm font-medium">
                  Pesan <span className="text-[#ba1a1a]">*</span>
                </Label>
                <Textarea
                  id="push-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tulis pesan notifikasi di sini..."
                  maxLength={500}
                  rows={3}
                  className="mt-1 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">{body.length}/500</p>
              </div>

              {/* URL (optional) */}
              <div>
                <Label htmlFor="push-url" className="text-sm font-medium">
                  URL Tujuan (opsional)
                </Label>
                <Input
                  id="push-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/?page=berita"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Halaman yang dibuka saat user klik notifikasi
                </p>
              </div>

              {/* Send button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending || !title.trim() || !body.trim()}
                  className="bg-[#003527] hover:bg-[#064e3b] text-white"
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Kirim ke {fcmCount > 0 ? `${fcmCount} subscriber` : 'semua subscriber'}
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Notifikasi akan dikirim via FCM (background) & VAPID (fallback)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#064e3b]" />
                  Riwayat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="border-l-2 border-[#cca72f] pl-3 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[#003527] truncate">{h.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(h.ts).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{h.body}</p>
                      <div className="flex gap-2 mt-1">
                        {h.fcmSent > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            FCM: {h.fcmSent}
                          </Badge>
                        )}
                        {h.vapidSent > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            VAPID: {h.vapidSent}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (right, 1 col) */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#895033]" />
                Preview Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1b1c1a] rounded-xl p-3">
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#003527] to-[#064e3b] flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-[#cca72f]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#003527] truncate">
                        {title || 'Judul notifikasi'}
                      </p>
                      <p className="text-xs text-[#404944] line-clamp-2">
                        {body || 'Isi pesan notifikasi akan muncul di sini...'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        mdta-tawangsari.vercel.app • sekarang
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-[#064e3b]/5 border-[#064e3b]/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-[#064e3b] shrink-0 mt-0.5" />
                <div className="text-xs text-[#404944] space-y-2">
                  <p>
                    <strong className="text-[#003527]">FCM (Firebase Cloud Messaging):</strong> Notifikasi terkirim
                    bahkan saat browser ditutup. Support iOS Safari 16.4+, Android, desktop.
                  </p>
                  <p>
                    <strong className="text-[#003527]">VAPID (Web Push):</strong> Fallback untuk browser
                    yang tidak support FCM (rare).
                  </p>
                  <p>
                    <strong className="text-[#895033]">Tips:</strong> Visitor harus klik icon 🔔 di pojok
                    kanan bawah website & grant permission sekali untuk subscribe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
