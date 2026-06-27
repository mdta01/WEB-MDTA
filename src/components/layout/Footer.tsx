'use client'

import { useQuery } from '@tanstack/react-query'
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useAppStore, type PageSection } from '@/store/useAppStore'

const quickLinks: { label: string; page: PageSection }[] = [
  { label: 'Profil Madrasah', page: 'profil' },
  { label: 'Program Pendidikan', page: 'program' },
  { label: 'Pendaftaran (PPDB)', page: 'ppdb' },
  { label: 'Berita & Kegiatan', page: 'berita' },
  { label: 'Prestasi', page: 'prestasi' },
  { label: 'Galeri', page: 'galeri' },
  { label: 'Pengumuman', page: 'pengumuman' },
  { label: 'Kontak', page: 'kontak' },
]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', key: 'madrasah_facebook' },
  { icon: Instagram, label: 'Instagram', key: 'madrasah_instagram' },
  { icon: Youtube, label: 'YouTube', key: 'madrasah_youtube' },
]

export default function Footer() {
  const { setCurrentPage } = useAppStore()

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string; label?: string }) => s.key === key || s.label === key)?.value || ''

  const handleNav = (page: PageSection) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-emerald-900 text-emerald-100 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Tentang Kami */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src="/images/logo-madin-warna.png" alt="Logo MDTA Miftahul Ulum 01" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">MDTA Miftahul Ulum 01</h3>
                <p className="text-emerald-300 text-xs">Madrasah Diniyah Takmiliyah Awaliyah</p>
              </div>
            </div>
            <p className="text-emerald-200 text-sm leading-relaxed">
              Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas.
            </p>
          </div>

          {/* Link Cepat */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              Link Cepat
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => handleNav(link.page)}
                    className="text-emerald-200 hover:text-amber-400 text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              Kontak
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
                <span>{getSetting('madrasah_address') || 'Jl. Pesantren No. 01, Kec. Cisauk, Kab. Tangerang, Banten'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{getSetting('madrasah_phone') || '(021) 123-4567'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{getSetting('madrasah_email') || 'info@miftahululum01.sch.id'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Senin - Sabtu: 08.00 - 16.00 WIB</span>
              </li>
            </ul>
          </div>

          {/* Media Sosial */}
          <div>
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              Media Sosial
            </h3>
            <p className="text-emerald-200 text-sm mb-4">
              Ikuti kami di media sosial untuk informasi terkini.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={getSetting(social.key) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-emerald-800 hover:bg-amber-500 text-emerald-200 hover:text-emerald-900 flex items-center justify-center transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-emerald-800">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-emerald-300 text-xs">
            &copy; {new Date().getFullYear()} MDTA Miftahul Ulum 01. Hak cipta dilindungi.
          </p>
          <p className="text-emerald-400 text-xs">
            Mencetak Generasi Muslim yang Berilmu & Berakhlak Mulia
          </p>
        </div>
      </div>
    </footer>
  )
}
