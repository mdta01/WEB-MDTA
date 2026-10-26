'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Menu, Search, Home, Info, BookOpen, Newspaper, Award,
  Image as ImageIcon, Megaphone, GraduationCap, HelpCircle, Download,
  BookMarked, Building2, Users, Phone, Mail, X,
} from 'lucide-react'
import { useAppStore, type PageSection } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

type NavItem = { label: string; page: PageSection; icon: React.ElementType }

const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: 'Utama',
    items: [
      { label: 'Beranda', page: 'beranda', icon: Home },
      { label: 'Profil', page: 'profil', icon: Info },
      { label: 'Program', page: 'program', icon: BookOpen },
      { label: 'Kelembagaan', page: 'kelembagaan', icon: Building2 },
    ],
  },
  {
    group: 'Informasi',
    items: [
      { label: 'Berita', page: 'berita', icon: Newspaper },
      { label: 'Pengumuman', page: 'pengumuman', icon: Megaphone },
      { label: 'Prestasi', page: 'prestasi', icon: Award },
      { label: 'Galeri', page: 'galeri', icon: ImageIcon },
      { label: 'Dakwah', page: 'dakwah', icon: BookMarked },
    ],
  },
  {
    group: 'Layanan',
    items: [
      { label: 'Pendaftaran (PPDB)', page: 'ppdb', icon: GraduationCap },
      { label: 'Wali Santri', page: 'wali-santri', icon: Users },
      { label: 'Alumni', page: 'alumni', icon: Users },
      { label: 'FAQ', page: 'faq', icon: HelpCircle },
      { label: 'Download', page: 'download', icon: Download },
      { label: 'Kontak', page: 'kontak', icon: Phone },
    ],
  },
]

// Flatten navItems for desktop nav (preserves original order)
const navItems: { label: string; page: PageSection }[] = navGroups.flatMap(g => g.items)

export default function Header() {
  const { currentPage, setCurrentPage, setSearchQuery } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNav = (page: PageSection) => {
    setCurrentPage(page)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = () => {
    setSearchQuery('')
    setCurrentPage('search')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const madrasahSubtitle = getSetting('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'
  const madrasahLogo = getSetting('madrasah_logo') || '/images/logo-madin-warna.png'

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-500 bg-[#ffffff] border-b border-[#e4e2de] ${
        scrolled ? 'shadow-premium-lg' : 'shadow-sm'
      }`}
    >
      {/* Subtle top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#cca72f]/60 to-transparent" />

      {/* Main header */}
      <div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo & Name */}
            <button
              onClick={() => handleNav('beranda')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 group-hover:scale-110 group-active:scale-95 transition-all duration-300 shrink-0">
                <img
                  src={madrasahLogo}
                  alt={`Logo ${madrasahName}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-base leading-tight uppercase tracking-wide text-[#003527] group-hover:text-[#895033] transition-colors duration-300">{madrasahName}</span>
                <span className="text-[#404944] text-[10px] md:text-xs hidden sm:block">
                  {madrasahSubtitle}
                </span>
              </div>
            </button>

            {/* Action buttons — search + hamburger menu (all viewports) */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                aria-label="Cari"
                className="text-[#003527] hover:text-[#064e3b] hover:bg-[#f5f3ef] hover:scale-110 h-9 w-9 rounded-full transition-all duration-300"
              >
                <Search className="h-4 w-4" />
              </Button>
              {/* Menu — hamburger for ALL viewports (mobile bottom nav + desktop sidebar) */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Buka menu navigasi"
                    className="text-[#003527] hover:text-[#064e3b] hover:bg-[#f5f3ef] hover:scale-110 h-9 w-9 rounded-full transition-all duration-300"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm bg-[#003527] text-white border-l border-[#064e3b] p-0 flex flex-col">
                  <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>

                  {/* Header dengan gradient + pattern */}
                  <div className="relative bg-[#003527] p-5 border-b border-[#064e3b]/50 overflow-hidden">
                    {/* Kraton pattern overlay */}
                    <div className="absolute inset-0 kraton-pattern opacity-[0.06] pointer-events-none" aria-hidden />
                    {/* Top gold strip */}
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#cca72f] to-transparent" />
                    {/* Close button */}
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#b0f0d6] hover:text-white transition-colors z-10"
                      aria-label="Tutup menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {/* Logo + name */}
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0">
                        <img
                          src={madrasahLogo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm uppercase tracking-wide leading-tight">{madrasahName}</p>
                        <p className="text-[10px] text-[#ffe088]/80 mt-0.5">{madrasahSubtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav items grouped with section labels */}
                  <div className="flex-1 overflow-y-auto py-3">
                    {navGroups.map((group) => (
                      <div key={group.group} className="mb-3">
                        {/* Group label */}
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffe088]/70 px-5 py-2">
                          {group.group}
                        </p>
                        {/* Nav items */}
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const isActive = currentPage === item.page
                          return (
                            <button
                              key={item.page}
                              onClick={() => handleNav(item.page)}
                              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors relative ${
                                isActive
                                  ? 'active-nav-pill bg-[#064e3b] text-[#ffe088]'
                                  : 'text-[#b0f0d6] hover:bg-[#064e3b]/30 hover:text-white'
                              }`}
                            >
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#ffe088]' : 'text-[#b0f0d6]/80'}`} />
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Footer dengan kontak info */}
                  <div className="border-t border-[#064e3b]/50 bg-[#003527]/40 p-4 space-y-2">
                    <a
                      href={`tel:${getSetting('madrasah_phone') || ''}`}
                      className="flex items-center gap-2.5 text-xs text-[#b0f0d6] hover:text-[#ffe088] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#064e3b]/50 flex items-center justify-center shrink-0">
                        <Phone className="h-3 w-3" />
                      </div>
                      <span className="truncate">{getSetting('madrasah_phone') || '(021) 123-4567'}</span>
                    </a>
                    <a
                      href={`mailto:${getSetting('madrasah_email') || ''}`}
                      className="flex items-center gap-2.5 text-xs text-[#b0f0d6] hover:text-[#ffe088] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#064e3b]/50 flex items-center justify-center shrink-0">
                        <Mail className="h-3 w-3" />
                      </div>
                      <span className="truncate">{getSetting('madrasah_email') || 'info@mdta.sch.id'}</span>
                    </a>
                    <div className="pt-2 mt-2 border-t border-[#064e3b]/30 text-center">
                      <p className="text-[10px] text-[#b0f0d6]/60">
                        © {new Date().getFullYear()} {madrasahName}
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation — fixed at bottom, always accessible when scrolling */}
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#ffffff] border-t border-[#e4e2de] shadow-premium-lg"
      aria-label="Navigasi cepat"
    >
      {/* Top gold accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#cca72f]/60 to-transparent" />

      <div className="grid grid-cols-5 h-14">
        {/* 5 quick nav items */}
        {[
          { label: 'Beranda', page: 'beranda' as PageSection, icon: Home },
          { label: 'Berita', page: 'berita' as PageSection, icon: Newspaper },
          { label: 'Pengumuman', page: 'pengumuman' as PageSection, icon: Megaphone },
          { label: 'Galeri', page: 'galeri' as PageSection, icon: ImageIcon },
          { label: 'Menu', page: null, icon: Menu },
        ].map((item) => {
          const Icon = item.icon
          const isActive = item.page && currentPage === item.page
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.page) {
                  handleNav(item.page)
                } else {
                  // Open full menu sidebar
                  setMobileOpen(true)
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                isActive
                  ? 'text-[#003527]'
                  : 'text-[#404944] hover:text-[#003527]'
              }`}
              aria-label={item.label}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0.5 w-1 h-1 rounded-full bg-[#cca72f]" aria-hidden />
              )}
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#003527]' : 'text-[#404944]/70'}`} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
    </>
  )
}
