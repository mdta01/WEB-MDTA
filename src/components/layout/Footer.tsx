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
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const madrasahSubtitle = getSetting('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'
  const madrasahLogo = getSetting('madrasah_logo') || '/images/logo-madin-warna.png'

  const handleNav = (page: PageSection) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#003527] text-[#b0f0d6] mt-auto overflow-hidden">
      {/* Decorative top accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#cca72f]/70 to-transparent" />

      {/* Kraton pattern overlay */}
      <div className="absolute inset-0 kraton-pattern opacity-[0.04] pointer-events-none" aria-hidden />

      {/* Decorative gradient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#064e3b]/40 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#cca72f]/10 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Tentang Kami */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 p-1.5 ring-2 ring-[#cca72f]/30 shadow-glow-amber">
                <img src={madrasahLogo} alt={`Logo ${madrasahName}`} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{madrasahName}</h3>
                <p className="text-[#ffe088]/80 text-xs mt-0.5">{madrasahSubtitle}</p>
              </div>
            </div>
            <p className="text-[#b0f0d6]/90 text-sm leading-relaxed">
              {getSetting('madrasah_footer_description') || 'Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas.'}
            </p>
          </div>

          {/* Link Cepat */}
          <div>
            <h3 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#cca72f] to-[#895033] rounded-full" />
              Link Cepat
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => handleNav(link.page)}
                    className="text-[#b0f0d6]/90 hover:text-[#ffe088] text-sm transition-all duration-300 hover:pl-2 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#064e3b]/80 group-hover:bg-[#cca72f] transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#cca72f] to-[#895033] rounded-full" />
              Kontak
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm group">
                <div className="w-7 h-7 rounded-lg bg-[#064e3b]/60 group-hover:bg-[#cca72f]/20 flex items-center justify-center shrink-0 transition-all duration-300">
                  <MapPin className="h-3.5 w-3.5 text-[#cca72f]" />
                </div>
                <span className="text-[#b0f0d6]/90 group-hover:text-white transition-colors">{getSetting('madrasah_address') || 'Jl. Pesantren No. 01, Kec. Cisauk, Kab. Tangerang, Banten'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm group">
                <div className="w-7 h-7 rounded-lg bg-[#064e3b]/60 group-hover:bg-[#cca72f]/20 flex items-center justify-center shrink-0 transition-all duration-300">
                  <Phone className="h-3.5 w-3.5 text-[#cca72f]" />
                </div>
                <span className="text-[#b0f0d6]/90 group-hover:text-white transition-colors">{getSetting('madrasah_phone') || '(021) 123-4567'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm group">
                <div className="w-7 h-7 rounded-lg bg-[#064e3b]/60 group-hover:bg-[#cca72f]/20 flex items-center justify-center shrink-0 transition-all duration-300">
                  <Mail className="h-3.5 w-3.5 text-[#cca72f]" />
                </div>
                <span className="text-[#b0f0d6]/90 group-hover:text-white transition-colors">{getSetting('madrasah_email') || 'info@miftahululum01.sch.id'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm group">
                <div className="w-7 h-7 rounded-lg bg-[#064e3b]/60 group-hover:bg-[#cca72f]/20 flex items-center justify-center shrink-0 transition-all duration-300">
                  <Clock className="h-3.5 w-3.5 text-[#cca72f]" />
                </div>
                <span className="text-[#b0f0d6]/90 group-hover:text-white transition-colors">{getSetting('madrasah_service_hours') || 'Senin - Sabtu: 08.00 - 16.00 WIB'}</span>
              </li>
            </ul>
          </div>

          {/* Media Sosial */}
          <div>
            <h3 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#cca72f] to-[#895033] rounded-full" />
              Media Sosial
            </h3>
            <p className="text-[#b0f0d6]/90 text-sm mb-5 leading-relaxed">
              Ikuti kami di media sosial untuk informasi terkini.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={getSetting(social.key) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-11 h-11 rounded-xl bg-white/8 hover:bg-gradient-to-br hover:from-[#cca72f] hover:to-[#895033] text-[#b0f0d6] hover:text-[#003527] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:shadow-glow-amber border border-white/10"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-[#064e3b]/60 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#b0f0d6]/80 text-xs">
            &copy; {new Date().getFullYear()} {madrasahName}. Hak cipta dilindungi.
          </p>
          <p className="text-[#ffe088]/80 text-xs font-medium">
            {getSetting('madrasah_copyright') || 'Mencetak Generasi Muslim yang Berilmu & Berakhlak Mulia'}
          </p>
        </div>
      </div>
    </footer>
  )
}
