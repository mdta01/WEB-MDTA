'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CreditCard, Bell, Calendar, MessageSquare,
  Send, Clock, AlertCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'

export default function WaliSantriSection() {
  const { setCurrentPage } = useAppStore()
  const [suggestionForm, setSuggestionForm] = useState({
    name: '', email: '', type: 'saran', message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => fetch('/api/announcements').then(r => r.json()),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])
  const announcements = ((Array.isArray(announcementsData) ? announcementsData : (announcementsData?.announcements || []))).slice(0, 5)

  const meetingSchedule = getSetting('wali_santri_meeting_schedule')
    ? getSetting('wali_santri_meeting_schedule').split('\n').filter(Boolean).map(line => {
        const [title, date, time] = line.split('|')
        return { title: title?.trim() || '', date: date?.trim() || '', time: time?.trim() || '' }
      })
    : []

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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Wali Santri</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Informasi dan layanan untuk orang tua/wali santri</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Payment Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-amber-500" />
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
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-emerald-800">{payment.title}</p>
                          {payment.description && (
                            <p className="text-xs text-gray-500">{payment.description}</p>
                          )}
                          {payment.dueDate && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Jatuh tempo: {new Date(payment.dueDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 font-bold">{payment.amount}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Informasi pembayaran belum tersedia</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcements for Parents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Pengumuman untuk Wali Santri
                </h3>
                {announcements.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {announcements.map((a: { id: string; title: string; type: string; createdAt: string }) => (
                      <div key={a.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">{a.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Belum ada pengumuman</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Meeting Schedule */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Jadwal Pertemuan Wali Santri
                </h3>
                <div className="space-y-3">
                  {meetingSchedule.length > 0 ? (
                    meetingSchedule.map((item, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50 rounded-lg">
                        <p className="font-medium text-sm text-emerald-800">{item.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">Jadwal pertemuan belum tersedia</p>
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
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Kotak Saran & Kritik
                </h3>
                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sug-name" className="text-sm">Nama *</Label>
                    <Input
                      id="sug-name"
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
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
                      value={suggestionForm.message}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tulis saran atau kritik Anda..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-800">
                    {submitting ? 'Mengirim...' : 'Kirim Saran'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
