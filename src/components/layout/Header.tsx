'use client'

import { useState, useEffect } from 'react'
import {
  Menu, Lock, Search, ChevronDown, Phone,
} from 'lucide-react'
import { useAppStore, type PageSection } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const navItems: { label: string; page: PageSection }[] = [
  { label: 'Beranda', page: 'beranda' },
  { label: 'Profil', page: 'profil' },
  { label: 'Program', page: 'program' },
  { label: 'Berita', page: 'berita' },
  { label: 'Prestasi', page: 'prestasi' },
  { label: 'Galeri', page: 'galeri' },
  { label: 'Pengumuman', page: 'pengumuman' },
  { label: 'PPDB', page: 'ppdb' },
  { label: 'Download', page: 'download' },
  { label: 'Dakwah', page: 'dakwah' },
  { label: 'Kelembagaan', page: 'kelembagaan' },
  { label: 'Alumni', page: 'alumni' },
  { label: 'Wali Santri', page: 'wali-santri' },
  { label: 'Kontak', page: 'kontak' },
]

export default function Header() {
  const { currentPage, setCurrentPage, setSearchQuery } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      {/* Top bar */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              (021) 123-4567
            </span>
            <span>info@miftahululum01.sch.id</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-300">MDTA Miftahul Ulum 01</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Name */}
            <button
              onClick={() => handleNav('beranda')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-500 flex items-center justify-center text-emerald-900 font-bold text-lg md:text-xl shadow-md group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm md:text-lg leading-tight">MDTA Miftahul Ulum 01</span>
                <span className="text-emerald-200 text-[10px] md:text-xs hidden sm:block">
                  Madrasah Diniyah Takmiliyah Awaliyah
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
              <a href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-emerald-100 hover:text-white hover:bg-emerald-700"
                  title="Admin Panel"
                >
                  <Lock className="h-4 w-4" />
                </Button>
              </a>

              {/* Mobile menu */}
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
                <SheetContent side="right" className="w-80 bg-emerald-900 text-white border-emerald-700 p-0">
                  <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                  <div className="flex items-center justify-between p-4 border-b border-emerald-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-emerald-900 font-bold text-sm">
                        M
                      </div>
                      <span className="font-bold text-sm">MDTA Miftahul Ulum 01</span>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(100vh-64px)] py-2">
                    {navItems.map((item) => (
                      <button
                        key={item.page}
                        onClick={() => handleNav(item.page)}
                        className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
                          currentPage === item.page
                            ? 'bg-amber-500 text-emerald-900'
                            : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-emerald-700 mt-2 pt-2 px-6">
                      <a
                        href="/admin"
                        className="flex items-center gap-2 py-3 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        Admin Panel
                      </a>
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
