'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Menu, Search, ChevronDown, Home, Info, BookOpen, Newspaper, Award,
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
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Name */}
            <button
              onClick={() => handleNav('beranda')}
              className="flex items-center gap-3 group"
            >
              <div className="w-11 h-11 md:w-13 md:h-13 group-hover:scale-110 group-active:scale-95 transition-all duration-300 flex items-center justify-center rounded-full bg-[#003527] ring-2 ring-[#cca72f]/40 group-hover:ring-[#cca72f] group-hover:shadow-glow-amber shrink-0 p-1.5">
                <img
                  src={madrasahLogo}
                  alt={`Logo ${madrasahName}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-lg leading-tight uppercase tracking-wide text-[#003527] group-hover:text-[#895033] transition-colors duration-300">{madrasahName}</span>
                <span className="text-[#404944] text-[10px] md:text-xs hidden sm:block">
                  {madrasahSubtitle}
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.slice(0, 8).map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                    currentPage === item.page
                      ? 'bg-[#003527] text-white shadow-md shadow-[#003527]/20'
                      : 'text-[#003527] hover:bg-[#f5f3ef] hover:text-[#064e3b] hover:scale-105'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="relative group">
                <button className="px-3 py-2 rounded-full text-xs font-medium text-[#003527] hover:bg-[#f5f3ef] hover:text-[#064e3b] hover:scale-105 flex items-center gap-1 transition-all duration-300">
                  Lainnya <ChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-[#ffffff]/95 backdrop-blur-xl rounded-2xl shadow-premium-lg py-2 min-w-[200px] border border-[#e4e2de] overflow-hidden">
                    {navItems.slice(8).map((item) => (
                      <button
                        key={item.page}
                        onClick={() => handleNav(item.page)}
                        className={`block w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
                          currentPage === item.page
                            ? 'bg-[#f5f3ef] text-[#003527] font-medium border-l-2 border-[#cca72f]'
                            : 'text-[#404944] hover:bg-[#f5f3ef] hover:text-[#003527] hover:pl-5'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                className="text-[#003527] hover:text-[#064e3b] hover:bg-[#f5f3ef] hover:scale-110 h-9 w-9 rounded-full transition-all duration-300"
              >
                <Search className="h-4 w-4" />
              </Button>
              {/* Mobile menu — Premium sidebar */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="xl:hidden text-[#003527] hover:text-[#064e3b] hover:bg-[#f5f3ef] hover:scale-110 h-9 w-9 rounded-full transition-all duration-300"
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
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#fbf9f5] flex items-center justify-center shrink-0 p-1 ring-2 ring-[#cca72f]/40">
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
  )
}
