'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  GraduationCap, ClipboardList, CreditCard, Calendar, Phone,
  CheckCircle, AlertCircle, Send, User, MapPin,
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
    name: '', birthPlace: '', birthDate: '', parentName: '',
    parentPhone: '', address: '', previousSchool: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.birthPlace || !formData.birthDate || !formData.parentName || !formData.parentPhone) {
      toast.error('Harap isi semua kolom yang wajib diisi')
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

          {/* Jadwal Pendaftaran */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Jadwal Pendaftaran
                </h3>
                {ppdbEvents.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {ppdbEvents.map((event: { id: string; title: string; date: string; location?: string | null }, idx: number) => {
                      const colors = [
                        'bg-emerald-50 border-emerald-200',
                        'bg-amber-50 border-amber-200',
                        'bg-teal-50 border-teal-200',
                      ]
                      const formattedDate = new Date(event.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                      return (
                        <div key={event.id} className={`${colors[idx % 3]} border rounded-xl p-4 text-center`}>
                          <p className="font-semibold text-sm text-emerald-800">{event.title}</p>
                          <p className="text-gray-600 text-sm mt-1">{formattedDate}</p>
                          {event.location && (
                            <p className="text-gray-500 text-xs mt-1 flex items-center justify-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </p>
                          )}
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
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nama lengkap calon santri" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthPlace" className="text-sm font-medium">Tempat Lahir *</Label>
                        <Input id="birthPlace" name="birthPlace" value={formData.birthPlace} onChange={handleChange} placeholder="Kota kelahiran" required />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-sm font-medium">Tanggal Lahir *</Label>
                        <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previousSchool" className="text-sm font-medium">Asal Sekolah</Label>
                        <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="Sekolah sebelumnya (jika ada)" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parentName" className="text-sm font-medium">Nama Orang Tua/Wali *</Label>
                        <Input id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} placeholder="Nama ayah/ibu/wali" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentPhone" className="text-sm font-medium">No. HP Orang Tua *</Label>
                        <Input id="parentPhone" name="parentPhone" type="tel" value={formData.parentPhone} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">Alamat Lengkap</Label>
                      <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Alamat lengkap tempat tinggal" rows={3} />
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
                {contacts.length > 0 ? (
                  <div className="space-y-1 text-sm text-emerald-700">
                    {contacts.map((contact, idx) => (
                      <p key={idx}>
                        {contact.name}{contact.phone ? `: ${contact.phone}` : ''}
                      </p>
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
