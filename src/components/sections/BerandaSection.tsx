'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, Award, GraduationCap, ArrowRight,
  Calendar, Star, ChevronLeft, ChevronRight, Quote,
  MapPin, X,
} from 'lucide-react'
import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'

// Read a value only on the client (returns null on server) to avoid hydration mismatch
// for time-dependent data like dates.
function useClientValue<T>(getValue: () => T): T | null {
  return useSyncExternalStore(
    () => () => {}, // no subscription needed — value is read once on mount
    getValue, // client snapshot
    () => null // server snapshot (null avoids hydration mismatch)
  )
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = 0
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(start + (target - start) * eased))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <div ref={ref}>{count}</div>
}

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: React.ElementType; label: string; value: number; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="text-center p-6 hover:shadow-lg transition-shadow border-0 bg-white">
        <CardContent className="p-0 flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="text-3xl font-bold text-emerald-800">
            <AnimatedCounter target={value} />
          </div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Approximate Hijri date calculation
function getHijriDate(): string {
  const now = new Date()
  // Simple approximation: 1 Islamic year ≈ 354.36667 days
  // Epoch: July 16, 622 CE (Julian)
  const jd = Math.floor(now.getTime() / 86400000) + 2440587.5
  const l = Math.floor(jd - 1948439.5 + 10632)
  const n = Math.floor((l - 1) / 10631)
  const lPrime = l - 10631 * n + 354
  const j = Math.floor((10985 - lPrime) / 5316) * Math.floor((50 * lPrime) / 17719) + Math.floor(lPrime / 5670) * Math.floor((43 * lPrime) / 15238)
  const lDPrime = lPrime - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const m = Math.floor((24 * lDPrime) / 709)
  const d = lDPrime - Math.floor((709 * m) / 24)
  const y = 30 * n + j - 30
  
  const hijriMonths = ['Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah']
  const month = hijriMonths[m - 1] || 'Muharram'
  
  return `${d} ${month} ${y} H`
}

export default function BerandaSection() {
  const { setCurrentPage } = useAppStore()
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [selectedNews, setSelectedNews] = useState<{
    id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string
  } | null>(null)
  // Read dates on client only to avoid hydration mismatch (server vs client timezone/day)
  const masehiDate = useClientValue(() =>
    new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  )
  const hijriDate = useClientValue(() => getHijriDate())

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => fetch('/api/statistics').then(r => r.json()),
  })

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => fetch('/api/testimonials').then(r => r.json()),
  })

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['news-latest'],
    queryFn: () => fetch('/api/news').then(r => r.json()),
  })

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
  })

  const statistics = Array.isArray(statsData) ? statsData : (statsData?.statistics || [])
  const getStat = (key: string) => {
    const s = statistics.find((st: { key: string }) => st.key === key)
    return s ? parseInt(s.value) || 0 : 0
  }

  const testimonials = Array.isArray(testimonialsData) ? testimonialsData : (testimonialsData?.testimonials || [])
  const news = ((Array.isArray(newsData) ? newsData : (newsData?.news || []))).slice(0, 3)
  const events = ((Array.isArray(eventsData) ? eventsData : (eventsData?.events || []))).slice(0, 3)

  const statsCards = [
    { icon: GraduationCap, label: 'Santri Aktif', value: getStat('santri_aktif') || 0, color: 'bg-emerald-600', delay: 0 },
    { icon: Users, label: 'Tenaga Pengajar', value: getStat('guru_aktif') || 0, color: 'bg-teal-600', delay: 0.1 },
    { icon: Award, label: 'Prestasi', value: getStat('prestasi') || 0, color: 'bg-amber-600', delay: 0.2 },
    { icon: BookOpen, label: 'Alumni', value: getStat('alumni') || 0, color: 'bg-emerald-800', delay: 0.3 },
  ]

  const nextTestimonial = () => {
    if (testimonials.length > 0) {
      setTestimonialIdx((prev) => (prev + 1) % testimonials.length)
    }
  }
  const prevTestimonial = () => {
    if (testimonials.length > 0) {
      setTestimonialIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white">
          {/* Hero background image - only render after settings load to avoid flashing fallback image */}
          <div className="absolute inset-0">
            {!settingsLoading && (
              <img
                src={getSetting('madrasah_hero_image') || '/images/hero-madrasah.png'}
                alt="MDTA Miftahul Ulum 01"
                className="w-full h-full object-cover opacity-30"
              />
            )}
            {/* Radial vignette + bottom fade for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,78,59,0.65)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-950 to-transparent" />
          </div>

          {/* Decorative top border (islamic pattern strip) */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

          {/* Decorative corner ornaments */}
          <div className="absolute top-6 left-6 opacity-20 hidden md:block" aria-hidden>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M40 4 L48 32 L76 40 L48 48 L40 76 L32 48 L4 40 L32 32 Z" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
              <circle cx="40" cy="40" r="6" stroke="#fbbf24" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <div className="absolute top-6 right-6 opacity-20 hidden md:block" aria-hidden>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M40 4 L48 32 L76 40 L48 48 L40 76 L32 48 L4 40 L32 32 Z" stroke="#fbbf24" strokeWidth="1.5" fill="none"/>
              <circle cx="40" cy="40" r="6" stroke="#fbbf24" strokeWidth="1" fill="none"/>
            </svg>
          </div>

          {/* Centered hero content */}
          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto text-center flex flex-col items-center"
            >
              {/* Bismillah badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/40 text-amber-300 px-5 py-2 rounded-full text-base md:text-lg mb-6 backdrop-blur-sm"
              >
                <span className="text-2xl leading-none">✦</span>
                <span className="font-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
                <span className="text-2xl leading-none">✦</span>
              </motion.div>

              {/* Madrasah name */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-lg uppercase tracking-wide">
                {getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'}
              </h1>

              {/* Decorative divider */}
              <div className="flex items-center gap-3 mb-5" aria-hidden>
                <span className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-amber-400" />
                <MapPin className="h-5 w-5 text-amber-400" />
                <span className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-amber-400" />
              </div>

              {/* Address (hardcoded for hero — different from header subtitle) */}
              <p className="text-amber-300 text-lg md:text-xl mb-4 font-medium tracking-wide">
                Tawangsari, Pujon
              </p>

              {/* Description */}
              <p className="text-emerald-100/90 text-sm md:text-base mb-8 max-w-2xl leading-relaxed">
                {getSetting('madrasah_description') || 'Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas dan menyeluruh.'}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => { setCurrentPage('ppdb'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="bg-amber-500 hover:bg-amber-600 text-emerald-900 font-bold px-7 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow"
                  size="lg"
                >
                  Daftar PPDB
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => { setCurrentPage('profil'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-emerald-900 font-semibold px-7 backdrop-blur-sm transition-colors"
                  size="lg"
                >
                  Tentang Kami
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Decorative bottom border (mirror) */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
        </div>
      </section>

      {/* Sambutan Kepala Madrasah */}
      <section className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                <div className="relative">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 border-4 border-amber-400 shadow-xl ring-4 ring-white/20 bg-white/10">
                    {settingsLoading ? (
                      <div className="w-full h-full bg-white/20 animate-pulse" />
                    ) : (
                      <img
                        src={getSetting('madrasah_principal_photo') || '/images/kepala-madrasah.png'}
                        alt="Kepala Madrasah"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-center relative">Kepala Madrasah</h3>
                <p className="text-amber-300 text-sm mt-1 font-medium text-center relative">
                  {getSetting('madrasah_principals_name') || 'Kepala Madrasah'}
                </p>
              </div>
              <div className="md:col-span-2 p-8">
                <h3 className="font-bold text-emerald-800 text-lg mb-3 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-amber-500" />
                  Sambutan Kepala Madrasah
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {getSetting('madrasah_welcome') || "Assalamu'alaikum Warahmatullahi Wabarakatuh. Puji syukur kehadirat Allah SWT yang telah memberikan rahmat dan karunia-Nya. MDTA Miftahul Ulum 01 berkomitmen untuk memberikan pendidikan Islam yang terbaik bagi putra-putri Anda. Dengan kurikulum yang berpusat pada Al-Quran dan As-Sunnah, kami berharap dapat mencetak generasi yang berilmu, berakhlak mulia, dan bermanfaat bagi agama, bangsa, dan negara. Selamat datang di keluarga besar Miftahul Ulum 01."}
                </p>
                <p className="text-emerald-700 font-semibold mt-4 text-sm">Wassalamu'alaikum Warahmatullahi Wabarakatuh</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Statistics */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Data Madrasah</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        </div>
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 text-center border-0">
                <Skeleton className="w-14 h-14 rounded-2xl mx-auto mb-3" />
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statsCards.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        )}
      </section>

      {/* Kalender Hijriyah & Masehi */}
      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <h3 className="text-lg font-bold mb-1">Kalender Hijriyah</h3>
              <p className="text-2xl font-bold text-amber-400" id="hijri-date">
                {hijriDate ?? '\u00A0'}
              </p>
            </div>
          </Card>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 text-white text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-emerald-300" />
              <h3 className="text-lg font-bold mb-1">Kalender Masehi</h3>
              <p className="text-2xl font-bold text-emerald-200">
                {masehiDate ?? '\u00A0'}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-emerald-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Testimoni</h2>
              <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
            </div>
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Quote className="h-10 w-10 text-amber-400 mx-auto mb-4" />
                  <p className="text-gray-600 italic leading-relaxed mb-6">
                    &ldquo;{testimonials[testimonialIdx]?.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {testimonials[testimonialIdx]?.name?.charAt(0) || 'W'}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-emerald-800 text-sm">{testimonials[testimonialIdx]?.name}</p>
                      <p className="text-gray-500 text-xs">{testimonials[testimonialIdx]?.role}</p>
                    </div>
                  </div>
                  {testimonials.length > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button variant="outline" size="icon" onClick={prevTestimonial} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {testimonials.map((_: unknown, i: number) => (
                          <button
                            key={i}
                            onClick={() => setTestimonialIdx(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === testimonialIdx ? 'bg-amber-500' : 'bg-emerald-200'
                            }`}
                          />
                        ))}
                      </div>
                      <Button variant="outline" size="icon" onClick={nextTestimonial} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Latest News */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Berita Terbaru</h2>
            <div className="w-20 h-1 bg-amber-500 mt-2 rounded-full" />
          </div>
          <Button
            variant="ghost"
            onClick={() => { setCurrentPage('berita'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="text-emerald-600 hover:text-emerald-800"
          >
            Selengkapnya <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {newsLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden border-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {news.map((item: { id: string; title: string; excerpt?: string; content?: string; category: string; createdAt: string; image?: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => setSelectedNews(item as typeof selectedNews)}
                >
                  <div className="h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-amber-500 text-emerald-900 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-semibold text-emerald-800 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.excerpt || ''}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0">
            <BookOpen className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada berita</p>
          </Card>
        )}

        {/* News Detail Dialog */}
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            {selectedNews && (
              <>
                <DialogTitle className="text-xl font-bold text-emerald-800 pr-8">
                  {selectedNews.title}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-amber-100 text-amber-800">
                    {selectedNews.category}
                  </Badge>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedNews.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {selectedNews.image && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-auto" />
                  </div>
                )}
                <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedNews.content}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="bg-amber-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Kegiatan Mendatang</h2>
              <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: { id: string; title: string; description?: string; date: string; location?: string }, idx: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="bg-emerald-600 text-white rounded-xl p-3 text-center min-w-[60px]">
                          <div className="text-xl font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-emerald-800 mb-1">{event.title}</h3>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
