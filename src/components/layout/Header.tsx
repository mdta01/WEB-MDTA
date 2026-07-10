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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      {/* Main header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Name */}
            <button
              onClick={() => handleNav('beranda')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img
                  src={madrasahLogo}
                  alt={`Logo ${madrasahName}`}
                  className="w-full h-full object-contain"
                  style={{
                    filter: [
                      // White halo — mengikuti kontur logo (bukan kotak)
                      'drop-shadow(0 0 2px rgba(255,255,255,0.95))',
                      'drop-shadow(0 0 3px rgba(255,255,255,0.9))',
                      'drop-shadow(0 0 4px rgba(255,255,255,0.85))',
                      // Dark shadow untuk depth
                      'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                    ].join(' '),
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-lg leading-tight uppercase tracking-wide">{madrasahName}</span>
                <span className="text-emerald-200 text-[10px] md:text-xs hidden sm:block">
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
                  className={`px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentPage === item.page
                      ? 'bg-amber-500 text-emerald-900'
                      : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="relative group">
                <button className="px-2.5 py-2 rounded-md text-xs font-medium text-emerald-100 hover:bg-emerald-700 hover:text-white flex items-center gap-1">
                  Lainnya <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl py-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {navItems.slice(8).map((item) => (
                    <button
                      key={item.page}
                      onClick={() => handleNav(item.page)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentPage === item.page
                          ? 'bg-emerald-50 text-emerald-800 font-medium'
                          : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                className="text-emerald-100 hover:text-white hover:bg-emerald-700 h-9 w-9"
              >
                <Search className="h-4 w-4" />
              </Button>
              {/* Mobile menu — Premium sidebar */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="xl:hidden text-emerald-100 hover:text-white hover:bg-emerald-700 h-9 w-9"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm bg-emerald-900 text-white border-l border-emerald-700 p-0 flex flex-col">
                  <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>

                  {/* Header dengan gradient + pattern */}
                  <div className="relative bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 border-b border-emerald-700/50 overflow-hidden">
                    {/* Islamic pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                    {/* Top amber strip */}
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    {/* Close button */}
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-200 hover:text-white transition-colors z-10"
                      aria-label="Tutup menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {/* Logo + name */}
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        <img
                          src={madrasahLogo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                          style={{
                            filter: [
                              'drop-shadow(0 0 2px rgba(255,255,255,0.95))',
                              'drop-shadow(0 0 3px rgba(255,255,255,0.9))',
                              'drop-shadow(0 0 4px rgba(255,255,255,0.85))',
                              'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                            ].join(' '),
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm uppercase tracking-wide leading-tight">{madrasahName}</p>
                        <p className="text-[10px] text-amber-300/80 mt-0.5">{madrasahSubtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav items grouped with section labels */}
                  <div className="flex-1 overflow-y-auto py-3">
                    {navGroups.map((group) => (
                      <div key={group.group} className="mb-3">
                        {/* Group label */}
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 px-5 py-2">
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
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                              }`}
                            >
                              {/* Active left bar */}
                              {isActive && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" aria-hidden />
                              )}
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-emerald-300/80'}`} />
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Footer dengan kontak info */}
                  <div className="border-t border-emerald-700/50 bg-emerald-950/40 p-4 space-y-2">
                    <a
                      href={`tel:${getSetting('madrasah_phone') || ''}`}
                      className="flex items-center gap-2.5 text-xs text-emerald-200 hover:text-amber-300 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-700/50 flex items-center justify-center shrink-0">
                        <Phone className="h-3 w-3" />
                      </div>
                      <span className="truncate">{getSetting('madrasah_phone') || '(021) 123-4567'}</span>
                    </a>
                    <a
                      href={`mailto:${getSetting('madrasah_email') || ''}`}
                      className="flex items-center gap-2.5 text-xs text-emerald-200 hover:text-amber-300 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-700/50 flex items-center justify-center shrink-0">
                        <Mail className="h-3 w-3" />
                      </div>
                      <span className="truncate">{getSetting('madrasah_email') || 'info@mdta.sch.id'}</span>
                    </a>
                    <div className="pt-2 mt-2 border-t border-emerald-700/30 text-center">
                      <p className="text-[10px] text-emerald-400/60">
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
