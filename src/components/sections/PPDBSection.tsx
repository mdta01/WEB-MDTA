'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  GraduationCap, ClipboardList, CreditCard, Calendar, Phone,
  CheckCircle, AlertCircle, Send, User, MapPin, MessageCircle,
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

export default function PPDBSection() {
  const [formData, setFormData] = useState({
    // A. Data Calon Santri
    name: '', nik: '', nokk: '', birthPlace: '', birthDate: '', gender: '',
    // B. Asal Sekolah
    previousSchool: '', schoolClass: '', schoolAddress: '',
    // C. Data Ayah
    fatherName: '', fatherStatus: '', fatherNik: '', fatherBirthPlace: '', fatherBirthDate: '',
    fatherEducation: '', fatherJob: '', fatherAddress: '', fatherPhone: '',
    // C. Data Ibu
    motherName: '', motherStatus: '', motherNik: '', motherBirthPlace: '', motherBirthDate: '',
    motherEducation: '', motherJob: '', motherAddress: '', motherPhone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''
  const ppdbStatus = getSetting('ppdb_status') || 'open'

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments || [])

  const { data: eventsData } = useQuery({
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

  // Format nomor HP ke format WhatsApp (62XXXXXXXXXXX)
  // - Hapus karakter non-digit (spasi, dash, dll)
  // - Ganti leading 0 dengan 62
  // - Hapus leading +62 / 62 jika ada, lalu tambahkan 62
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.birthPlace || !formData.birthDate) {
      toast.error('Harap isi Nama, Tempat Lahir, dan Tanggal Lahir calon santri')
      return
    }
    if (!formData.fatherName && !formData.motherName) {
      toast.error('Harap isi minimal data salah satu orang tua (Ayah atau Ibu)')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ppdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('Pendaftaran berhasil dikirim! Tim panitia akan menghubungi Anda.')
        setSubmitted(true)
        setFormData({ name: '', birthPlace: '', birthDate: '', parentName: '', parentPhone: '', address: '', previousSchool: '' })
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch {
      toast.error('Gagal mengirim pendaftaran. Periksa koneksi internet Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
          Pendaftaran Peserta Didik Baru (PPDB)
        </h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* Status Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-0 shadow-lg overflow-hidden ${ppdbStatus === 'open' ? 'ring-2 ring-emerald-400' : 'ring-2 ring-red-300'}`}>
          <div className={`p-6 text-center ${ppdbStatus === 'open' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' : 'bg-gradient-to-r from-red-500 to-red-700'} text-white`}>
            <GraduationCap className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              {ppdbStatus === 'open' ? 'Pendaftaran Dibuka!' : 'Pendaftaran Ditutup'}
            </h3>
            <p className="text-sm opacity-90">
              {ppdbStatus === 'open'
                ? 'Silakan isi formulir pendaftaran di bawah ini untuk mendaftarkan putra/putri Anda.'
                : 'Pendaftaran saat ini belum dibuka. Pantau pengumuman untuk informasi lebih lanjut.'}
            </p>
            {ppdbStatus === 'open' && (
              <Badge className="mt-3 bg-amber-500 text-emerald-900 font-bold">
                <CheckCircle className="h-3 w-3 mr-1" /> Pendaftaran Dibuka
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>

      {ppdbStatus === 'open' && (
        <>
          {/* Persyaratan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                  Persyaratan Pendaftaran
                </h3>
                {requirements.length > 0 ? (
                  <ul className="space-y-2">
                    {requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic text-sm">Persyaratan pendaftaran belum tersedia.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Biaya Pendidikan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Biaya Pendidikan
                </h3>
                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-50">
                          <TableHead className="font-semibold">Jenis Biaya</TableHead>
                          <TableHead className="font-semibold">Jumlah</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((item: { id: string; title: string; amount: string; description?: string | null }, idx: number) => (
                          <TableRow key={item.id || idx}>
                            <TableCell className="text-sm">{item.title}</TableCell>
                            <TableCell className="font-medium text-emerald-700">{item.amount}</TableCell>
                            <TableCell className="text-sm text-gray-500 hidden md:table-cell">{item.description || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="h-10 w-10 text-emerald-200 mx-auto mb-2" />
                    <p className="text-gray-400 italic text-sm">Informasi biaya pendidikan belum tersedia.</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">* Biaya dapat berubah sewaktu-waktu</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Jadwal Pendaftaran — from PPDBSchedule API (sync realtime) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Jadwal Pendaftaran
                </h3>
                {ppdbSchedulesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border-l-4 border-amber-300 pl-4 py-2">
                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : ppdbSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {ppdbSchedules.map((s: { id: string; title: string; startDate: string; endDate?: string | null; location?: string | null; description?: string | null; order?: number }, idx: number) => {
                      const colors = [
                        'border-emerald-400 bg-emerald-50',
                        'border-amber-400 bg-amber-50',
                        'border-teal-400 bg-teal-50',
                        'border-purple-400 bg-purple-50',
                      ]
                      const start = new Date(s.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      const end = s.endDate ? new Date(s.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null
                      return (
                        <div key={s.id} className={`${colors[idx % 4]} border-l-4 rounded-r-lg p-4`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-emerald-700 border border-emerald-200">
                              {typeof s.order === 'number' ? s.order : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-emerald-800">{s.title}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-amber-500" />
                                  {start}{end ? ` — ${end}` : ''}
                                </span>
                                {s.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-amber-500" />
                                    {s.location}
                                  </span>
                                )}
                              </div>
                              {s.description && (
                                <p className="text-xs text-gray-500 mt-2">{s.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-emerald-200 mx-auto mb-2" />
                    <p className="text-gray-400 italic text-sm">Jadwal pendaftaran belum tersedia. Silakan hubungi panitia untuk informasi lebih lanjut.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Registration Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-6">
                  <Send className="h-5 w-5 text-amber-500" />
                  Formulir Pendaftaran Online
                </h3>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-emerald-800 mb-2">Pendaftaran Berhasil!</h4>
                    <p className="text-gray-500">Data Anda telah terkirim. Tim panitia akan menghubungi Anda melalui nomor yang tercantum.</p>
                    <Button onClick={() => setSubmitted(false)} className="mt-4 bg-emerald-700 hover:bg-emerald-800">
                      Daftar Lagi
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* A. Data Calon Santri */}
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mb-3">
                        A. Data Calon Santri
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap *</Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nama lengkap calon santri" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nik" className="text-sm font-medium">NIK</Label>
                          <Input id="nik" name="nik" value={formData.nik} onChange={handleChange} placeholder="Nomor Induk Kependudukan" maxLength={20} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nokk" className="text-sm font-medium">Nomor KK</Label>
                          <Input id="nokk" name="nokk" value={formData.nokk} onChange={handleChange} placeholder="Nomor Kartu Keluarga" maxLength={20} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="gender" className="text-sm font-medium">Jenis Kelamin</Label>
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          >
                            <option value="">Pilih...</option>
                            <option value="laki-laki">Laki-laki</option>
                            <option value="perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="birthPlace" className="text-sm font-medium">Tempat Lahir *</Label>
                          <Input id="birthPlace" name="birthPlace" value={formData.birthPlace} onChange={handleChange} placeholder="Kota kelahiran" required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="birthDate" className="text-sm font-medium">Tanggal Lahir *</Label>
                          <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>

                    {/* B. Asal Sekolah */}
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mb-3">
                        B. Asal Sekolah
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="previousSchool" className="text-sm font-medium">Nama Sekolah</Label>
                          <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="Nama sekolah asal" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="schoolClass" className="text-sm font-medium">Kelas</Label>
                          <Input id="schoolClass" name="schoolClass" value={formData.schoolClass} onChange={handleChange} placeholder="Kelas (mis: 6 SD)" />
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-4">
                        <Label htmlFor="schoolAddress" className="text-sm font-medium">Alamat Sekolah</Label>
                        <Textarea id="schoolAddress" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} placeholder="Alamat sekolah asal" rows={2} />
                      </div>
                    </div>

                    {/* C. Data Ayah */}
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mb-3">
                        C. Data Ayah
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherName" className="text-sm font-medium">Nama Ayah</Label>
                          <Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Nama lengkap ayah" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherStatus" className="text-sm font-medium">Status</Label>
                          <select id="fatherStatus" name="fatherStatus" value={formData.fatherStatus} onChange={handleChange}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                            <option value="">Pilih...</option>
                            <option value="hidup">Hidup</option>
                            <option value="meninggal">Meninggal</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherNik" className="text-sm font-medium">NIK</Label>
                          <Input id="fatherNik" name="fatherNik" value={formData.fatherNik} onChange={handleChange} placeholder="NIK Ayah" maxLength={20} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherBirthPlace" className="text-sm font-medium">Tempat Lahir</Label>
                          <Input id="fatherBirthPlace" name="fatherBirthPlace" value={formData.fatherBirthPlace} onChange={handleChange} placeholder="Tempat lahir ayah" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherBirthDate" className="text-sm font-medium">Tanggal Lahir</Label>
                          <Input id="fatherBirthDate" name="fatherBirthDate" type="date" value={formData.fatherBirthDate} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherEducation" className="text-sm font-medium">Pendidikan</Label>
                          <Input id="fatherEducation" name="fatherEducation" value={formData.fatherEducation} onChange={handleChange} placeholder="Pendidikan terakhir" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherJob" className="text-sm font-medium">Pekerjaan</Label>
                          <Input id="fatherJob" name="fatherJob" value={formData.fatherJob} onChange={handleChange} placeholder="Pekerjaan ayah" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="fatherPhone" className="text-sm font-medium">No. HP</Label>
                          <Input id="fatherPhone" name="fatherPhone" type="tel" value={formData.fatherPhone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-4">
                        <Label htmlFor="fatherAddress" className="text-sm font-medium">Alamat</Label>
                        <Textarea id="fatherAddress" name="fatherAddress" value={formData.fatherAddress} onChange={handleChange} placeholder="Alamat tempat tinggal ayah" rows={2} />
                      </div>
                    </div>

                    {/* C. Data Ibu */}
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mb-3">
                        D. Data Ibu
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="motherName" className="text-sm font-medium">Nama Ibu</Label>
                          <Input id="motherName" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Nama lengkap ibu" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherStatus" className="text-sm font-medium">Status</Label>
                          <select id="motherStatus" name="motherStatus" value={formData.motherStatus} onChange={handleChange}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                            <option value="">Pilih...</option>
                            <option value="hidup">Hidup</option>
                            <option value="meninggal">Meninggal</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherNik" className="text-sm font-medium">NIK</Label>
                          <Input id="motherNik" name="motherNik" value={formData.motherNik} onChange={handleChange} placeholder="NIK Ibu" maxLength={20} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherBirthPlace" className="text-sm font-medium">Tempat Lahir</Label>
                          <Input id="motherBirthPlace" name="motherBirthPlace" value={formData.motherBirthPlace} onChange={handleChange} placeholder="Tempat lahir ibu" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherBirthDate" className="text-sm font-medium">Tanggal Lahir</Label>
                          <Input id="motherBirthDate" name="motherBirthDate" type="date" value={formData.motherBirthDate} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherEducation" className="text-sm font-medium">Pendidikan</Label>
                          <Input id="motherEducation" name="motherEducation" value={formData.motherEducation} onChange={handleChange} placeholder="Pendidikan terakhir" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherJob" className="text-sm font-medium">Pekerjaan</Label>
                          <Input id="motherJob" name="motherJob" value={formData.motherJob} onChange={handleChange} placeholder="Pekerjaan ibu" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="motherPhone" className="text-sm font-medium">No. HP</Label>
                          <Input id="motherPhone" name="motherPhone" type="tel" value={formData.motherPhone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-4">
                        <Label htmlFor="motherAddress" className="text-sm font-medium">Alamat</Label>
                        <Textarea id="motherAddress" name="motherAddress" value={formData.motherAddress} onChange={handleChange} placeholder="Alamat tempat tinggal ibu" rows={2} />
                      </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3">
                      {submitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Panitia */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-md bg-emerald-50">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-bold text-emerald-800 mb-2">Hubungi Panitia PPDB</h4>
                <p className="text-sm text-gray-600 mb-3">Untuk informasi lebih lanjut, silakan hubungi:</p>

                {/* Primary WhatsApp button — pakai ppdb_panitia_phone jika diisi admin */}
                {panitiaPhone && (
                  <Button
                    asChild
                    className="bg-green-500 hover:bg-green-600 text-white font-bold mb-4"
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

                {contacts.length > 0 ? (
                  <div className="space-y-2 text-sm text-emerald-700">
                    {contacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="font-medium">{contact.name}</span>
                        {contact.phone && (
                          <a
                            href={buildWhatsAppUrl(contact.phone, defaultWaMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
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
                  <p className="text-sm text-gray-400 italic">Kontak panitia belum tersedia.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}
