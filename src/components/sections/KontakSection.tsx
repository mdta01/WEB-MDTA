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
      color: 'bg-emerald-600',
    },
    {
      icon: Phone,
      title: 'Telepon',
      content: getSetting('madrasah_phone') || '(021) 123-4567',
      color: 'bg-teal-600',
    },
    {
      icon: Mail,
      title: 'Email',
      content: getSetting('madrasah_email') || 'info@miftahululum01.sch.id',
      color: 'bg-amber-600',
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      content: getSetting('madrasah_service_hours') || 'Senin - Sabtu: 08:00 - 16:00 WIB',
      color: 'bg-emerald-800',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Hubungi Kami</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {contactInfo.map((info, idx) => (
          <motion.div
            key={info.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-xl ${info.color} flex items-center justify-center mx-auto mb-3`}>
                  <info.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-emerald-800 text-sm mb-1">{info.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{info.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                Kirim Pesan
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-sm">Nama *</Label>
                    <Input id="c-name" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Anda" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email" className="text-sm">Email</Label>
                    <Input id="c-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@contoh.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-phone" className="text-sm">No. HP</Label>
                    <Input id="c-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-subject" className="text-sm">Subjek</Label>
                    <Input id="c-subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Perihal pesan" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-message" className="text-sm">Pesan *</Label>
                  <Textarea id="c-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tulis pesan Anda..." rows={5} required />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg overflow-hidden h-full">
            <div className="h-full min-h-[400px] bg-gray-100">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.0!2d106.6!3d-6.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTgnMDAuMCJTIDEwNsKwMzYnMDAuMCJF!5e0!3m2!1sid!2sid!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi MDTA Miftahul Ulum 01"
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
