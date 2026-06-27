'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, Award, GraduationCap, ArrowRight,
  Calendar, Star, ChevronLeft, ChevronRight, Quote,
  MapPin,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/useAppStore'

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
    { icon: GraduationCap, label: 'Santri Aktif', value: getStat('santri_aktif') || 245, color: 'bg-emerald-600', delay: 0 },
    { icon: Users, label: 'Tenaga Pengajar', value: getStat('guru_aktif') || 18, color: 'bg-teal-600', delay: 0.1 },
    { icon: Award, label: 'Prestasi', value: getStat('prestasi') || 85, color: 'bg-amber-600', delay: 0.2 },
    { icon: BookOpen, label: 'Alumni', value: getStat('alumni') || 1250, color: 'bg-emerald-800', delay: 0.3 },
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
          {/* Hero background image */}
          <div className="absolute inset-0">
            <img 
              src="/images/hero-madrasah.png" 
              alt="MDTA Miftahul Ulum 01" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-900/70 to-emerald-900/50" />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Badge className="bg-amber-500 text-emerald-900 hover:bg-amber-400 mb-4 font-semibold">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  MDTA Miftahul Ulum 01
                </h1>
                <p className="text-emerald-200 text-lg md:text-xl mb-2">
                  Madrasah Diniyah Takmiliyah Awaliyah
                </p>
                <p className="text-emerald-300 text-sm md:text-base mb-8 max-w-xl leading-relaxed">
                  Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas dan menyeluruh.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => { setCurrentPage('ppdb'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="bg-amber-500 hover:bg-amber-600 text-emerald-900 font-bold px-6"
                    size="lg"
                  >
                    Daftar PPDB
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => { setCurrentPage('profil'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-emerald-900 px-6"
                    size="lg"
                  >
                    Tentang Kami
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
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
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 flex flex-col items-center justify-center text-white">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg text-center">Kepala Madrasah</h3>
                <p className="text-emerald-200 text-sm mt-1">Ustadz Ahmad Fauzi, S.Pd.I</p>
              </div>
              <div className="md:col-span-2 p-8">
                <h3 className="font-bold text-emerald-800 text-lg mb-3 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-amber-500" />
                  Sambutan Kepala Madrasah
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Assalamualaikum Warahmatullahi Wabarakatuh. Puji syukur kehadirat Allah SWT yang telah memberikan rahmat dan karunia-Nya. 
                  MDTA Miftahul Ulum 01 berkomitmen untuk memberikan pendidikan Islam yang terbaik bagi putra-putri Anda. 
                  Dengan kurikulum yang berpusat pada Al-Quran dan As-Sunnah, kami berharap dapat mencetak generasi yang berilmu, 
                  berakhlak mulia, dan bermanfaat bagi agama, bangsa, dan negara. Selamat datang di keluarga besar Miftahul Ulum 01.
                </p>
                <p className="text-emerald-700 font-semibold mt-4 text-sm">Wassalamualaikum Warahmatullahi Wabarakatuh</p>
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
                {getHijriDate()}
              </p>
            </div>
          </Card>
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 text-white text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-emerald-300" />
              <h3 className="text-lg font-bold mb-1">Kalender Masehi</h3>
              <p className="text-2xl font-bold text-emerald-200">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
            {news.map((item: { id: string; title: string; excerpt?: string; category: string; createdAt: string; image?: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow group cursor-pointer">
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
                    <h3 className="font-semibold text-emerald-800 line-clamp-2 mb-2">{item.title}</h3>
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
