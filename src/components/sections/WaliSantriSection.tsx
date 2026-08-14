'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CreditCard, Bell, Calendar, MessageSquare,
  Send, Clock, AlertCircle, MapPin, X, Megaphone, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'

export default function WaliSantriSection() {
  const { setCurrentPage } = useAppStore()
  const [suggestionForm, setSuggestionForm] = useState({
    name: '', email: '', type: 'saran', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<{ id: string; title: string; content?: string; type: string; createdAt: string } | null>(null)

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })

  // Pengumuman khusus wali santri (type='wali_santri') — sync realtime via API
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['wali-santri-announcements'],
    queryFn: () => fetch('/api/wali-santri/announcements').then(r => r.json()),
  })

  // Jadwal pertemuan wali santri — sync realtime via API
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['wali-santri-meetings'],
    queryFn: () => fetch('/api/wali-santri/meetings').then(r => r.json()),
  })

  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])
  const announcements = Array.isArray(announcementsData) ? announcementsData : (announcementsData?.announcements || [])
  const meetings = Array.isArray(meetingsData) ? meetingsData : (meetingsData?.meetings || [])

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestionForm.name || !suggestionForm.message) {
      toast.error('Harap isi nama dan pesan')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestionForm),
      })
      if (res.ok) {
        toast.success('Saran/kritik berhasil dikirim. Terima kasih!')
        setSuggestionForm({ name: '', email: '', type: 'saran', message: '' })
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch {
      toast.error('Gagal mengirim. Periksa koneksi internet Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#003527]">Wali Santri</h2>
        <div className="w-20 h-1 bg-[#cca72f] mx-auto mt-2 rounded-full" />
        <p className="text-[#404944] mt-3 text-sm">Informasi dan layanan untuk orang tua/wali santri</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Payment Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-[#e4e2de] shadow-md card-hover rounded-2xl bg-[#ffffff]">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-[#cca72f]" />
                  Informasi Pembayaran
                </h3>
                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment: { id: string; title: string; amount: string; description?: string; dueDate?: string }) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-[#064e3b]/5 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-[#003527]">{payment.title}</p>
                          {payment.description && (
                            <p className="text-xs text-[#404944]">{payment.description}</p>
                          )}
                          {payment.dueDate && (
                            <p className="text-xs text-[#404944]/70 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Jatuh tempo: {new Date(payment.dueDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-[#cca72f]/20 text-[#895033] font-bold">{payment.amount}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#404944]/70 text-sm">Informasi pembayaran belum tersedia</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcements for Parents — prominent, urgent highlight */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow rounded-2xl bg-[#ffffff] overflow-hidden">
              {/* Top accent strip — gold for importance */}
              <div className="h-1 bg-gradient-to-r from-[#003527] via-[#cca72f] to-[#003527]" aria-hidden />
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 font-display">
                    <span className="w-8 h-8 rounded-lg bg-[#cca72f]/15 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-[#895033]" />
                    </span>
                    Pengumuman Wali Santri
                  </h3>
                  {announcements.length > 0 && (
                    <span className="text-xs text-[#404944]/70 bg-[#f5f3ef] px-2 py-1 rounded-full">
                      {announcements.length} pengumuman
                    </span>
                  )}
                </div>

                {/* Helper text — guide parents */}
                {announcements.length > 0 && (
                  <p className="text-xs text-[#895033] bg-[#cca72f]/8 px-3 py-2 rounded-lg mb-4 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Klik pengumuman untuk membaca selengkapnya. Pastikan Anda membaca semua pengumuman penting di bawah ini.</span>
                  </p>
                )}

                {announcementsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : announcements.length > 0 ? (
                  <div className="space-y-2.5">
                    {announcements.map((a: { id: string; title: string; content?: string; type: string; createdAt: string }, idx: number) => {
                      // First 2 announcements marked as "new/urgent" visually
                      const isRecent = idx < 2
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAnnouncement(a)}
                          className={`w-full text-left flex items-start gap-3 p-3 sm:p-4 rounded-xl transition-all cursor-pointer group ${
                            isRecent
                              ? 'bg-[#003527]/5 hover:bg-[#003527]/8 border border-[#003527]/15'
                              : 'bg-[#f5f3ef] hover:bg-[#cca72f]/8 border border-transparent'
                          }`}
                        >
                          {/* Icon — alert for recent, megaphone for others */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isRecent ? 'bg-[#cca72f]/20 text-[#895033]' : 'bg-[#003527]/10 text-[#003527]'
                          }`}>
                            {isRecent ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Title row with "Baru" badge for recent */}
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-[#003527] leading-tight">{a.title}</p>
                              {isRecent && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#cca72f] text-[#003527] text-[9px] font-bold uppercase tracking-wide shrink-0">
                                  Baru
                                </span>
                              )}
                            </div>
                            {/* Content preview */}
                            {a.content && (
                              <p className="text-xs text-[#404944] mt-0.5 line-clamp-2">{a.content}</p>
                            )}
                            {/* Date + read more */}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-[#404944]/70 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {a.content && a.content.length > 120 && (
                                <span className="text-[10px] text-[#003527] font-semibold group-hover:underline flex items-center gap-0.5">
                                  Baca selengkapnya
                                  <ChevronRight className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-10 w-10 text-[#064e3b]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#404944]">Belum ada pengumuman untuk wali santri</p>
                    <p className="text-xs text-[#404944]/60 mt-1">Periksa kembali secara berkala</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Meeting Schedule */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border border-[#e4e2de] shadow-md card-hover rounded-2xl bg-[#ffffff]">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-[#cca72f]" />
                  Jadwal Pertemuan Wali Santri
                </h3>
                <div className="space-y-3">
                  {meetingsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                  ) : meetings.length > 0 ? (
                    meetings.map((m: { id: string; title: string; date: string; time: string; location?: string; description?: string }) => (
                      <div key={m.id} className="p-3 bg-[#064e3b]/5 rounded-lg border-l-4 border-[#cca72f]">
                        <p className="font-medium text-sm text-[#003527]">{m.title}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#404944]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#cca72f]" />
                            {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#cca72f]" />
                            {m.time}
                          </span>
                          {m.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#cca72f]" />
                              {m.location}
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-xs text-[#404944] mt-2 line-clamp-2">{m.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[#404944]/70 text-sm">Jadwal pertemuan belum tersedia</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Suggestion Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border border-[#e4e2de] shadow-md card-hover rounded-2xl bg-[#ffffff]">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-[#cca72f]" />
                  Kotak Saran & Kritik
                </h3>
                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sug-name" className="text-sm">Nama *</Label>
                    <Input
                      id="sug-name"
                      name="name"
                      value={suggestionForm.name}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama Anda"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sug-email" className="text-sm">Email</Label>
                    <Input
                      id="sug-email"
                      name="email"
                      type="email"
                      value={suggestionForm.email}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Jenis</Label>
                    <div className="flex gap-2">
                      {['saran', 'kritik', 'keluhan'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSuggestionForm(prev => ({ ...prev, type }))}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                            suggestionForm.type === type
                              ? 'bg-[#003527] text-white'
                              : 'bg-[#f5f3ef] text-[#003527] hover:bg-[#efeeea]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sug-message" className="text-sm">Pesan *</Label>
                    <Textarea
                      id="sug-message"
                      name="message"
                      value={suggestionForm.message}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tulis saran atau kritik Anda..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#003527] hover:bg-[#064e3b]">
                    {submitting ? 'Mengirim...' : 'Kirim Saran'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* Announcement Detail Dialog — buka pengumuman penuh dengan MarkdownRenderer */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          {selectedAnnouncement && (
            <>
              <DialogTitle className="text-xl font-bold text-[#003527] pr-8">
                {selectedAnnouncement.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-[#cca72f]/20 text-[#895033] capitalize">
                  {selectedAnnouncement.type || 'pengumuman'}
                </Badge>
                <span className="text-xs text-[#404944]/70 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(selectedAnnouncement.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="mt-4">
                {selectedAnnouncement.content
                  ? <MarkdownRenderer content={selectedAnnouncement.content} />
                  : <p className="text-sm text-[#404944]/70 italic">Tidak ada isi pengumuman.</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
