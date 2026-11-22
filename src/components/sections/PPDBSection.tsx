'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  GraduationCap, ClipboardList, CreditCard, Calendar, Phone,
  CheckCircle, Send, MapPin, MessageCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { KratonSectionHeader } from '@/components/kraton'
import { toast } from 'sonner'
import { PPDBRegistrationForm } from './ppdb/PPDBRegistrationForm'
import { PPDBFAQ } from './ppdb/PPDBFAQ'

/**
 * PPDBSection — Pendaftaran Peserta Didik Baru.
 *
 * Premium multi-step interactive registration experience:
 *  - Status banner (open/closed) with CTA
 *  - Persyaratan (requirements) — pulled from settings (ppdb_requirements)
 *  - Biaya pendidikan — from /api/payments
 *  - Jadwal pendaftaran — from /api/ppdb/schedules (sync realtime)
 *  - Agenda PPDB — from /api/events (category: ppdb)
 *  - Multi-step registration form (4 steps, file upload, live preview) — PPDBRegistrationForm
 *  - Inline FAQ specific to PPDB — PPDBFAQ
 *  - Contact panitia (WhatsApp) — from settings (ppdb_contact, ppdb_panitia_phone)
 *
 * Brand palette: emerald (#003527) + gold (#cca72f) on parchment (#fbf9f5).
 */
export default function PPDBSection() {
  // ============ Data fetching ============
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''
  const ppdbStatus = getSetting('ppdb_status') || 'open'

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
  })
  const events = Array.isArray(eventsData) ? eventsData : (eventsData?.events || [])
  const ppdbEvents = events.filter((e: { category: string }) => e.category === 'ppdb')

  // Fetch PPDB schedules (jadwal pendaftaran) — sync realtime via API
  const { data: ppdbSchedulesData, isLoading: ppdbSchedulesLoading } = useQuery({
    queryKey: ['ppdb-schedules'],
    queryFn: () => fetch('/api/ppdb/schedules').then(r => r.json()),
  })
  const ppdbSchedules = Array.isArray(ppdbSchedulesData) ? ppdbSchedulesData : (ppdbSchedulesData?.schedules || [])

  // Parse requirements from settings (newline-separated)
  const requirements = getSetting('ppdb_requirements')
    ? getSetting('ppdb_requirements').split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0)
    : []

  // Parse contacts from settings (format: "name|phone", one per line)
  const contacts = getSetting('ppdb_contact')
    ? getSetting('ppdb_contact').split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0).map((line: string) => {
        const parts = line.split('|')
        return { name: parts[0]?.trim() || '', phone: parts[1]?.trim() || '' }
      })
    : []

  // Nomor WhatsApp utama panitia (setting terpisah, opsional)
  const panitiaPhone = getSetting('ppdb_panitia_phone') || ''

  // ============ WhatsApp helpers ============
  // Format nomor HP ke format WhatsApp (62XXXXXXXXXXX)
  function formatWhatsAppNumber(raw: string): string {
    let digits = (raw || '').replace(/\D/g, '')
    if (digits.startsWith('62')) {
      // already international format
    } else if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1)
    } else {
      digits = '62' + digits
    }
    return digits
  }

  function buildWhatsAppUrl(raw: string, message: string): string {
    return `https://wa.me/${formatWhatsAppNumber(raw)}?text=${encodeURIComponent(message)}`
  }

  const defaultWaMessage = 'Assalamualaikum, saya ingin bertanya tentang pendaftaran PPDB di MDTA Miftahul Ulum 01'

  // ============ Render ============
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* Section header — Kraton brand */}
      <KratonSectionHeader
        badge="Penerimaan Santri Baru"
        title="Pendaftaran Peserta Didik Baru (PPDB)"
        subtitle="Bergabunglah bersama kami dalam membentuk generasi Qur'ani yang berakhlak mulia. Isi formulir online di bawah untuk mendaftarkan putra/putri Anda."
        align="center"
      />

      {/* ============ Status Banner ============ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {settingsLoading ? (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-2/3 mx-auto" />
            </div>
          </Card>
        ) : (
          <Card className={`border-0 shadow-premium overflow-hidden ${ppdbStatus === 'open' ? 'ring-2 ring-[#064e3b]/40' : 'ring-2 ring-red-300'}`}>
            <div className={`p-6 text-center ${ppdbStatus === 'open' ? 'bg-gradient-to-r from-[#003527] to-[#064e3b]' : 'bg-gradient-to-r from-red-500 to-red-700'} text-white`}>
              <GraduationCap className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2 font-display">
                {ppdbStatus === 'open' ? 'Pendaftaran Dibuka!' : 'Pendaftaran Ditutup'}
              </h3>
              <p className="text-sm opacity-90 font-body max-w-lg mx-auto">
                {ppdbStatus === 'open'
                  ? 'Silakan isi formulir pendaftaran online di bawah ini untuk mendaftarkan putra/putri Anda.'
                  : 'Pendaftaran saat ini belum dibuka. Pantau pengumuman untuk informasi lebih lanjut.'}
              </p>
              {ppdbStatus === 'open' && (
                <Badge className="mt-3 bg-[#cca72f] text-[#003527] font-bold hover:bg-[#cca72f]">
                  <CheckCircle className="h-3 w-3 mr-1" /> Pendaftaran Dibuka
                </Badge>
              )}
            </div>
          </Card>
        )}
      </motion.div>

      {ppdbStatus === 'open' && (
        <>
          {/* ============ Persyaratan Pendaftaran ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-premium rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4 font-display">
                  <ClipboardList className="h-5 w-5 text-[#cca72f]" />
                  Persyaratan Pendaftaran
                </h3>
                {settingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : requirements.length > 0 ? (
                  <ul className="space-y-2">
                    {requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#404944] font-body">
                        <CheckCircle className="h-4 w-4 text-[#003527] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState illustration="ppdb" variant="compact" title="Persyaratan belum tersedia" message="Silakan hubungi panitia PPDB untuk informasi terkini." />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============ Biaya Pendidikan ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-premium rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4 font-display">
                  <CreditCard className="h-5 w-5 text-[#cca72f]" />
                  Biaya Pendidikan
                </h3>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#064e3b]/10">
                          <TableHead className="font-semibold">Jenis Biaya</TableHead>
                          <TableHead className="font-semibold">Jumlah</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((item: { id: string; title: string; amount: string; description?: string | null }, idx: number) => (
                          <TableRow key={item.id || idx}>
                            <TableCell className="text-sm">{item.title}</TableCell>
                            <TableCell className="font-medium text-[#003527]">{item.amount}</TableCell>
                            <TableCell className="text-sm text-[#404944] hidden md:table-cell">{item.description || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState illustration="ppdb" variant="compact" title="Biaya pendidikan belum tersedia" message="Hubungi panitia PPDB untuk rincian biaya." />
                )}
                <p className="text-xs text-[#404944]/80 mt-3">* Biaya dapat berubah sewaktu-waktu</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============ Jadwal Pendaftaran ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-premium rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4 font-display">
                  <Calendar className="h-5 w-5 text-[#cca72f]" />
                  Jadwal Pendaftaran
                </h3>
                {ppdbSchedulesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border-l-4 border-[#cca72f]/50 pl-4 py-2">
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : ppdbSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {ppdbSchedules.map((s: { id: string; title: string; startDate: string; endDate?: string | null; location?: string | null; description?: string | null; order?: number }, idx: number) => {
                      const colors = [
                        'border-[#003527] bg-[#003527]/5',
                        'border-[#cca72f] bg-[#cca72f]/5',
                        'border-[#064e3b] bg-[#064e3b]/5',
                        'border-[#895033] bg-[#895033]/5',
                      ]
                      const start = new Date(s.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      const end = s.endDate ? new Date(s.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null
                      return (
                        <div key={s.id} className={`${colors[idx % 4]} border-l-4 rounded-r-lg p-4`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#003527] border border-[#e4e2de]">
                              {typeof s.order === 'number' ? s.order : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[#003527] font-body">{s.title}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#404944] font-body">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-[#cca72f]" />
                                  {start}{end ? ` — ${end}` : ''}
                                </span>
                                {s.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-[#cca72f]" />
                                    {s.location}
                                  </span>
                                )}
                              </div>
                              {s.description && (
                                <p className="text-xs text-[#404944] mt-2 font-body">{s.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState illustration="ppdb" variant="compact" title="Jadwal belum tersedia" message="Silakan hubungi panitia untuk informasi lebih lanjut." />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============ Agenda PPDB ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.225 }}>
            <Card className="border-0 shadow-premium rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-4 font-display">
                  <Calendar className="h-5 w-5 text-[#cca72f]" />
                  Agenda PPDB
                </h3>
                {eventsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : ppdbEvents.length > 0 ? (
                  <div className="space-y-3">
                    {ppdbEvents.map((e: { id: string; title: string; description?: string | null; date: string; location?: string | null }, idx: number) => {
                      const eventDate = new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      return (
                        <div key={e.id || idx} className="flex gap-4 p-3 rounded-lg bg-[#064e3b]/5">
                          <div className="bg-[#003527] text-white rounded-lg p-2 text-center min-w-[50px]">
                            <div className="text-base font-bold">
                              {new Date(e.date).getDate()}
                            </div>
                            <div className="text-xs uppercase">
                              {new Date(e.date).toLocaleDateString('id-ID', { month: 'short' })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#003527] font-body">{e.title}</p>
                            <p className="text-xs text-[#404944] flex items-center gap-1 mt-1 font-body">
                              <Calendar className="h-3 w-3 text-[#cca72f]" />
                              {eventDate}
                            </p>
                            {e.location && (
                              <p className="text-xs text-[#404944] flex items-center gap-1 mt-1 font-body">
                                <MapPin className="h-3 w-3 text-[#cca72f]" /> {e.location}
                              </p>
                            )}
                            {e.description && (
                              <p className="text-xs text-[#404944] mt-1 line-clamp-2 font-body">{e.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState illustration="ppdb" variant="compact" title="Agenda belum tersedia" message="Pantau pengumuman untuk informasi agenda PPDB terkini." />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============ Premium Multi-Step Registration Form ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <PPDBRegistrationForm />
          </motion.div>

          {/* ============ Inline FAQ specific to PPDB ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.275 }}>
            <PPDBFAQ />
          </motion.div>

          {/* ============ Contact Panitia ============ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-premium rounded-2xl bg-[#064e3b]/5 overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="inline-flex p-3 rounded-full bg-[#003527] mb-3">
                  <Phone className="h-6 w-6 text-[#ffe088]" />
                </div>
                <h4 className="font-bold text-[#003527] mb-2 font-display text-lg">Hubungi Panitia PPDB</h4>
                <p className="text-sm text-[#404944] mb-4 font-body max-w-md mx-auto">
                  Untuk informasi lebih lanjut atau pertanyaan seputar pendaftaran, silakan hubungi panitia kami.
                </p>

                {/* Primary WhatsApp button — pakai ppdb_panitia_phone jika diisi admin */}
                {panitiaPhone && (
                  <Button
                    asChild
                    className="bg-[#003527] hover:bg-[#064e3b] text-white font-bold mb-4 rounded-xl shadow-md"
                  >
                    <a
                      href={buildWhatsAppUrl(panitiaPhone, defaultWaMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat WhatsApp Panitia
                    </a>
                  </Button>
                )}

                {settingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="space-y-2 text-sm text-[#003527]">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="font-medium font-body">{contact.name}</span>
                        {contact.phone && (
                          <a
                            href={buildWhatsAppUrl(contact.phone, defaultWaMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#064e3b]/10 hover:bg-[#064e3b]/20 text-[#003527] px-3 py-1 rounded-full text-xs font-semibold transition-colors border border-[#064e3b]/15"
                            title={`Chat WhatsApp ${contact.name}`}
                          >
                            <MessageCircle className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState illustration="ppdb" variant="compact" title="Kontak panitia belum tersedia" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}
