'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Mail, Clock, Send, MessageSquare,
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { KratonSectionHeader } from '@/components/kraton'

export default function KontakSection() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.message) {
      toast.error('Harap isi nama dan pesan')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('Pesan berhasil dikirim! Kami akan segera merespons.')
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch {
      toast.error('Gagal mengirim pesan. Periksa koneksi internet Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Alamat',
      content: getSetting('madrasah_address') || 'Jl. Pesantren No. 01, Kec. Cisauk, Kab. Tangerang, Banten 15345',
      color: 'bg-[#003527]',
    },
    {
      icon: Phone,
      title: 'Telepon',
      content: getSetting('madrasah_phone') || '(021) 123-4567',
      color: 'bg-[#064e3b]',
    },
    {
      icon: Mail,
      title: 'Email',
      content: getSetting('madrasah_email') || 'info@miftahululum01.sch.id',
      color: 'bg-[#895033]',
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      content: getSetting('madrasah_service_hours') || 'Senin - Sabtu: 08:00 - 16:00 WIB',
      color: 'bg-[#003527]',
    },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <KratonSectionHeader
        badge="Hubungi Kami"
        title="Kontak"
        align="center"
      />

      {/* Contact Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {contactInfo.map((info, idx) => (
          <motion.div
            key={info.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <Card className="border border-[#e4e2de] shadow-premium wood-carved-shadow card-hover h-full rounded-2xl bg-[#ffffff] group">
              <CardContent className="p-5 text-center">
                <div className={`w-12 h-12 rounded-2xl ${info.color} flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <info.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-[#003527] text-sm mb-1">{info.title}</h4>
                <p className="text-[#404944] text-xs leading-relaxed">{info.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.2, duration: 0.6 }}>
          <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow h-full rounded-2xl bg-[#ffffff]">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-[#003527] flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-[#cca72f]" />
                Kirim Pesan
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-sm">Nama *</Label>
                    <Input id="c-name" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Anda" required className="rounded-xl focus-ring focus-visible:ring-[#cca72f]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email" className="text-sm">Email</Label>
                    <Input id="c-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@contoh.com" className="rounded-xl focus-ring focus-visible:ring-[#cca72f]/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-phone" className="text-sm">No. HP</Label>
                    <Input id="c-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" className="rounded-xl focus-ring focus-visible:ring-[#cca72f]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-subject" className="text-sm">Subjek</Label>
                    <Input id="c-subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Perihal pesan" className="rounded-xl focus-ring focus-visible:ring-[#cca72f]/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-message" className="text-sm">Pesan *</Label>
                  <Textarea id="c-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tulis pesan Anda..." rows={5} required className="rounded-xl focus-ring focus-visible:ring-[#cca72f]/30" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-[#003527] hover:bg-[#064e3b] rounded-xl shadow-md shadow-[#003527]/30 hover:scale-[1.02] transition-all">
                  {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map — dari GPS coords yang diset admin */}
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.3, duration: 0.6 }}>
          <Card className="border border-[#e4e2de] shadow-premium-lg wood-carved-shadow overflow-hidden h-full rounded-2xl bg-[#ffffff]">
            <div className="h-full min-h-[400px] bg-[#f5f3ef]">
              {(() => {
                const gpsLat = getSetting('madrasah_gps_lat')
                const gpsLng = getSetting('madrasah_gps_lng')
                // Priority: GPS coords > manual embed URL > default
                if (gpsLat && gpsLng) {
                  return (
                    <iframe
                      src={`https://maps.google.com/maps?q=${gpsLat},${gpsLng}&z=15&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: '400px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Lokasi MDTA Miftahul Ulum 01"
                    />
                  )
                }
                const embedUrl = getSetting('madrasah_maps_embed_url')
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: '400px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Lokasi MDTA Miftahul Ulum 01"
                    />
                  )
                }
                return (
                  <div className="h-full min-h-[400px] flex items-center justify-center text-[#404944]/60 flex-col gap-2">
                    <MapPin className="h-12 w-12 text-[#064e3b]/40" />
                    <p className="text-sm">Peta belum tersedia. Admin belum setup GPS.</p>
                  </div>
                )
              })()}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
