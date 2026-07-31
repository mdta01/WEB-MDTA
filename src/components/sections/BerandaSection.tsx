'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, Award, GraduationCap, ArrowRight,
  Calendar, Star, ChevronLeft, ChevronRight, Quote,
  MapPin, X, Eye, BookHeart, User, Play, ExternalLink,
} from 'lucide-react'
import { useState, useEffect, useRef, useReducer, useSyncExternalStore } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { CalendarModal } from '@/components/sections/CalendarModal'
import { MarkdownRenderer } from '@/components/sections/MarkdownRenderer'
import { useAppStore } from '@/store/useAppStore'
import { gregorianToHijri, hijriMonthNames, masehiMonthNames } from '@/lib/hijri'
import { KratonSectionHeader, KratonDivider } from '@/components/kraton'

// Format a Date as "15 Juli 2026 (1 Muharram 1448 H)" — Masehi + Hijri
function formatMasehiHijri(date: Date): string {
  const day = date.getDate()
  const masehiMonth = masehiMonthNames[date.getMonth()]
  const masehiYear = date.getFullYear()
  const h = gregorianToHijri(date)
  const hijriMonth = hijriMonthNames[h.month - 1] || 'Muharram'
  return `${day} ${masehiMonth} ${masehiYear} (${h.day} ${hijriMonth} ${h.year} H)`
}

// External date store — client-only, refreshes every minute for realtime calendar.
// Uses useSyncExternalStore to avoid hydration mismatch (server returns null).
let currentDate: Date | null = null
const dateSubscribers = new Set<() => void>()
let dateInterval: ReturnType<typeof setInterval> | null = null

function subscribeDate(callback: () => void): () => void {
  dateSubscribers.add(callback)
  if (dateInterval === null && typeof window !== 'undefined') {
    currentDate = new Date()
    dateInterval = setInterval(() => {
      currentDate = new Date()
      dateSubscribers.forEach((cb) => cb())
    }, 60_000)
  }
  return () => {
    dateSubscribers.delete(callback)
    if (dateSubscribers.size === 0 && dateInterval) {
      clearInterval(dateInterval)
      dateInterval = null
      currentDate = null
    }
  }
}

function getDateSnapshot(): Date | null {
  return currentDate
}

function getServerDateSnapshot(): Date | null {
  return null
}

function useCurrentDate(): Date | null {
  return useSyncExternalStore(subscribeDate, getDateSnapshot, getServerDateSnapshot)
}

// Typewriter effect — types out text char by char once it becomes available.
// Waits `startDelay` ms before typing starts, types one char every `typeSpeed` ms.
// Returns the currently displayed substring + a `done` flag for cursor control.
// Uses useReducer + dispatch (not setState) in effects to comply with
// react-hooks/set-state-in-effect rule, while still supporting timer-based animation.
type TypewriterState = { count: number; phase: 'idle' | 'starting' | 'typing' | 'done' }
type TypewriterAction =
  | { type: 'reset' }
  | { type: 'begin-typing' }
  | { type: 'type-next' }
  | { type: 'finish' }

function typewriterReducer(state: TypewriterState, action: TypewriterAction): TypewriterState {
  switch (action.type) {
    case 'reset':
      return { count: 0, phase: 'starting' }
    case 'begin-typing':
      return state.phase === 'starting' ? { ...state, phase: 'typing' } : state
    case 'type-next':
      return { ...state, count: state.count + 1 }
    case 'finish':
      return { ...state, phase: 'done' }
    default:
      return state
  }
}

function useTypewriter(text: string, opts?: { startDelay?: number; typeSpeed?: number }): { display: string; done: boolean } {
  const startDelay = opts?.startDelay ?? 400
  const typeSpeed = opts?.typeSpeed ?? 35
  const [state, dispatch] = useReducer(typewriterReducer, { count: 0, phase: 'idle' })

  // Reset when text changes (e.g. when settings load from API)
  useEffect(() => {
    if (!text) return // wait until real text is available
    dispatch({ type: 'reset' })
    const startTimer = setTimeout(() => dispatch({ type: 'begin-typing' }), startDelay)
    return () => clearTimeout(startTimer)
  }, [text, startDelay])

  // Type next character
  useEffect(() => {
    if (state.phase !== 'typing') return
    if (state.count >= text.length) {
      dispatch({ type: 'finish' })
      return
    }
    const timer = setTimeout(() => dispatch({ type: 'type-next' }), typeSpeed)
    return () => clearTimeout(timer)
  }, [state.phase, state.count, text, typeSpeed])

  return {
    display: text.slice(0, state.count),
    done: state.phase === 'done' || (state.phase === 'typing' && state.count >= text.length),
  }
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="text-center p-6 card-hover border border-[#e4e2de] bg-[#ffffff] backdrop-blur-sm wood-carved-shadow">
        <CardContent className="p-0 flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="text-3xl font-bold text-gradient-emerald">
            <AnimatedCounter target={value} />
          </div>
          <p className="text-sm text-[#404944] font-medium">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Approximate Hijri date calculation (returns structured data for calendar display)
type HijriInfo = {
  day: number
  month: number // 1-12
  monthName: string
  year: number
  fullString: string
}

const hijriMonths = ['Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah']

function getHijriInfo(date = new Date()): HijriInfo {
  // Simple approximation: 1 Islamic year ≈ 354.36667 days
  // Epoch: July 16, 622 CE (Julian)
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5
  const l = Math.floor(jd - 1948439.5 + 10632)
  const n = Math.floor((l - 1) / 10631)
  const lPrime = l - 10631 * n + 354
  const j = Math.floor((10985 - lPrime) / 5316) * Math.floor((50 * lPrime) / 17719) + Math.floor(lPrime / 5670) * Math.floor((43 * lPrime) / 15238)
  const lDPrime = lPrime - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const m = Math.floor((24 * lDPrime) / 709)
  const d = lDPrime - Math.floor((709 * m) / 24)
  const y = 30 * n + j - 30

  const monthName = hijriMonths[m - 1] || 'Muharram'
  return {
    day: d,
    month: m,
    monthName,
    year: y,
    fullString: `${d} ${monthName} ${y} H`,
  }
}

// Indonesian Islamic holidays by Hijri date (day, month)
// month: 1=Muharram ... 12=Dzulhijjah
const islamicHolidays: { day: number; month: number; name: string; emoji: string }[] = [
  { day: 1, month: 1, name: 'Tahun Baru Hijriyah', emoji: '🌙' },
  { day: 10, month: 1, name: 'Hari Asyura', emoji: '🕯️' },
  { day: 12, month: 3, name: 'Maulid Nabi Muhammad ﷺ', emoji: '🕌' },
  { day: 27, month: 7, name: 'Isra Mi\'raj Nabi ﷺ', emoji: '✨' },
  { day: 15, month: 8, name: 'Nisfu Sya\'ban', emoji: '🌟' },
  { day: 1, month: 9, name: 'Awal Ramadhan', emoji: '🌙' },
  { day: 27, month: 9, name: 'Lailatul Qadr (perkiraan)', emoji: '🤲' },
  { day: 1, month: 10, name: 'Idul Fitri', emoji: '🎉' },
  { day: 2, month: 10, name: 'Hari Raya Idul Fitri', emoji: '🎉' },
  { day: 9, month: 12, name: 'Hari Arafah', emoji: '🕋' },
  { day: 10, month: 12, name: 'Idul Adha', emoji: '🐑' },
  { day: 11, month: 12, name: 'Hari Raya Idul Adha', emoji: '🐑' },
  { day: 12, month: 12, name: 'Hari Raya Idul Adha', emoji: '🐑' },
  { day: 13, month: 12, name: 'Hari Tasyrik', emoji: '🐑' },
]

function getIslamicHoliday(hijri: HijriInfo): { name: string; emoji: string } | null {
  const match = islamicHolidays.find(
    (h) => h.day === hijri.day && h.month === hijri.month
  )
  return match ? { name: match.name, emoji: match.emoji } : null
}

// Special masehi (Gregorian) holidays in Indonesia (fixed dates)
const masehiHolidays: { day: number; month: number; name: string; emoji: string }[] = [
  { day: 1, month: 1, name: 'Tahun Baru Masehi', emoji: '🎊' },
  { day: 17, month: 8, name: 'Hari Kemerdekaan RI', emoji: '🇮🇩' },
  { day: 1, month: 5, name: 'Hari Buruh Internasional', emoji: 'workers' },
  { day: 1, month: 6, name: 'Hari Lahir Pancasila', emoji: '🇮🇩' },
  { day: 2, month: 10, name: 'Hari Batik Nasional', emoji: '🎨' },
  { day: 28, month: 10, name: 'Hari Sumpah Pemuda', emoji: '🇮🇩' },
  { day: 10, month: 11, name: 'Hari Pahlawan', emoji: '🎖️' },
  { day: 25, month: 12, name: 'Hari Natal', emoji: '🎄' },
]

type MasehiInfo = {
  weekday: string
  day: number
  month: number
  monthName: string
  year: number
  fullString: string
  isWeekend: boolean
}

const weekdayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function getMasehiInfo(date = new Date()): MasehiInfo {
  const weekday = weekdayNames[date.getDay()]
  const day = date.getDate()
  const month = date.getMonth() + 1
  const monthName = masehiMonthNames[date.getMonth()]
  const year = date.getFullYear()
  return {
    weekday,
    day,
    month,
    monthName,
    year,
    fullString: `${weekday}, ${day} ${monthName} ${year}`,
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  }
}

function getMasehiHoliday(info: MasehiInfo): { name: string; emoji: string } | null {
  const match = masehiHolidays.find(
    (h) => h.day === info.day && h.month === info.month
  )
  return match ? { name: match.name, emoji: match.emoji } : null
}

export default function BerandaSection() {
  const { setCurrentPage } = useAppStore()
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [selectedNews, setSelectedNews] = useState<{
    id: string; title: string; content: string; excerpt?: string; category: string; createdAt: string; image?: string
  } | null>(null)
  const [selectedDakwah, setSelectedDakwah] = useState<{
    id: string; title: string; content: string; category: string; author?: string; videoUrl?: string; createdAt: string
  } | null>(null)
  const [calendarModal, setCalendarModal] = useState<{ open: boolean; type: 'masehi' | 'hijri' }>({ open: false, type: 'masehi' })

  // Calendar date — client-only (useSyncExternalStore) with realtime minute refresh
  const now = useCurrentDate()
  const masehiInfo = now ? getMasehiInfo(now) : null
  const hijriInfo = now ? getHijriInfo(now) : null
  const islamicHoliday = hijriInfo ? getIslamicHoliday(hijriInfo) : null
  const masehiHoliday = masehiInfo ? getMasehiHoliday(masehiInfo) : null

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  // Description with typewriter effect (starts after settings load)
  const descriptionText = getSetting('madrasah_description') || 'Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas dan menyeluruh.'
  const { display: typedDescription, done: typingDone } = useTypewriter(descriptionText, {
    startDelay: 800,
    typeSpeed: 30,
  })

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

  // Dakwah & kajian terbaru (sort by updatedAt desc — paling update di atas)
  const { data: dakwahData, isLoading: dakwahLoading } = useQuery({
    queryKey: ['dakwah-latest'],
    queryFn: () => fetch('/api/dakwah').then(r => r.json()),
  })

  const statistics = Array.isArray(statsData) ? statsData : (statsData?.statistics || [])
  const getStat = (key: string) => {
    const s = statistics.find((st: { key: string }) => st.key === key)
    return s ? parseInt(s.value) || 0 : 0
  }

  const testimonials = Array.isArray(testimonialsData) ? testimonialsData : (testimonialsData?.testimonials || [])
  const news = ((Array.isArray(newsData) ? newsData : (newsData?.news || []))).slice(0, 3)
  const events = ((Array.isArray(eventsData) ? eventsData : (eventsData?.events || []))).slice(0, 3)
  const dakwahList = ((Array.isArray(dakwahData) ? dakwahData : (dakwahData?.dakwah || []))).slice(0, 3)

  const statsCards = [
    { icon: GraduationCap, label: 'Santri Aktif', value: getStat('santri_aktif') || 0, color: 'bg-[#003527]', delay: 0 },
    { icon: Users, label: 'Tenaga Pengajar', value: getStat('guru_aktif') || 0, color: 'bg-[#064e3b]', delay: 0.1 },
    { icon: Award, label: 'Prestasi', value: getStat('prestasi') || 0, color: 'bg-[#895033]', delay: 0.2 },
    { icon: BookOpen, label: 'Alumni', value: getStat('alumni') || 0, color: 'bg-[#003527]', delay: 0.3 },
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
    <div className="space-y-16 pb-8">
      {/* Hero Section — split layout: dark green left + image right (always side-by-side, image narrower on mobile) */}
      <section className="relative overflow-hidden bg-[#003527]">
        {/* Fixed height — prevents portrait images from forcing the hero too tall */}
        <div className="grid grid-cols-[1fr_140px] sm:grid-cols-[1fr_180px] md:grid-cols-[1fr_240px] lg:grid-cols-2 h-[560px] sm:h-[600px] md:h-[640px] lg:h-[72vh] xl:h-[76vh] min-h-[560px] max-h-[820px]">
          {/* LEFT — dark green bg with text content (wider on mobile for readability) */}
          <div className="relative bg-[#003527] text-white flex items-center overflow-hidden">
            {/* Kraton pattern overlay (very low opacity) */}
            <div className="absolute inset-0 kraton-pattern opacity-[0.05] pointer-events-none" aria-hidden />
            {/* Subtle radial glow at top-left for depth */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#064e3b]/40 rounded-full blur-3xl pointer-events-none" aria-hidden />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="max-w-xl"
              >
                {/* Bismillah badge — glassmorphism */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 text-[#ffe088] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-4 sm:mb-6 md:mb-8 backdrop-blur-sm"
                >
                  <span className="text-[10px] sm:text-xs leading-none text-[#ffe088]/60">✦</span>
                  <span className="font-arabic text-xs sm:text-sm md:text-base tracking-wide">
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                  </span>
                  <span className="text-[10px] sm:text-xs leading-none text-[#ffe088]/60">✦</span>
                </motion.div>

                {/* Madrasah name — white + gold accent on second part */}
                <h1
                  className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-[1.1] tracking-wide uppercase"
                  style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.6))' }}
                >
                  <span className="text-white">MDTA</span>{' '}
                  <span className="text-gradient-amber">Miftahul Ulum 01</span>
                </h1>

                {/* Location pin (clickable ke Google Maps jika GPS tersedia) */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  {(() => {
                    const gpsLat = getSetting('madrasah_gps_lat')
                    const gpsLng = getSetting('madrasah_gps_lng')
                    const mapsUrl = gpsLat && gpsLng
                      ? `https://www.google.com/maps/search/?api=1&query=${gpsLat},${gpsLng}`
                      : null
                    const locClass = 'inline-flex items-center gap-1.5 sm:gap-2 text-[#b0f0d6] text-xs sm:text-sm md:text-base transition-all'
                    if (mapsUrl) {
                      return (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${locClass} hover:text-[#ffe088] cursor-pointer`}
                          title="Klik untuk melihat lokasi di Google Maps"
                        >
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#ffe088]" />
                          <span className="font-medium">Tawangsari, Pujon</span>
                          <ExternalLink className="h-3 w-3 text-[#ffe088]/70 ml-0.5 sm:ml-1" />
                        </a>
                      )
                    }
                    return (
                      <div className={locClass}>
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#ffe088]" />
                        <span className="font-medium">Tawangsari, Pujon</span>
                      </div>
                    )
                  })()}
                </div>

                {/* Gold divider line */}
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-[#cca72f] to-transparent mb-4 sm:mb-5 md:mb-6" />

                {/* Description */}
                <p className="text-white/90 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 md:mb-10 max-w-lg leading-relaxed"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                  <span>{typedDescription}</span>
                  <span
                    className={`inline-block w-[2px] h-[1.1em] bg-[#ffe088] ml-1 mt-1 shrink-0 ${typingDone ? 'animate-blink' : ''}`}
                    aria-hidden
                  />
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button
                    onClick={() => { setCurrentPage('ppdb'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="bg-[#cca72f] hover:bg-[#ffe088] text-[#003527] font-bold px-4 sm:px-7 shadow-lg shadow-[#cca72f]/30 hover:shadow-[#cca72f]/50 hover:scale-105 transition-all rounded-xl text-xs sm:text-sm md:text-base"
                    size="sm"
                  >
                    Daftar PPDB
                    <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    onClick={() => { setCurrentPage('profil'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="border-2 border-[#cca72f]/40 text-white bg-white/5 hover:bg-[#cca72f]/10 hover:border-[#cca72f]/70 font-semibold px-4 sm:px-7 backdrop-blur-sm hover:scale-105 transition-all rounded-xl text-xs sm:text-sm md:text-base"
                    size="sm"
                  >
                    Tentang Kami
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT — school image, always side-by-side with text panel (narrower on mobile) */}
          <div className="relative overflow-hidden">
            {!settingsLoading && (
              <img
                src={getSetting('madrasah_hero_image') || '/images/hero-madrasah.png'}
                alt="MDTA Miftahul Ulum 01"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}
            {/* Left-to-right gradient: dark green on left (blends with text panel), transparent on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#003527] via-[#003527]/50 to-transparent pointer-events-none" />
            {/* Subtle bottom gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#003527]/40 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Smooth wave transition to next section (parchment below) */}
        <div className="absolute bottom-0 inset-x-0 leading-none pointer-events-none" aria-hidden>
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className="w-full h-[40px] md:h-[60px]"
            fill="#fbf9f5"
          >
            <path d="M0,32 C240,60 480,60 720,40 C960,20 1200,20 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Sambutan Kepala Madrasah */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden border-0 shadow-premium-lg rounded-2xl">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-gradient-to-br from-[#064e3b] to-[#003527] p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
                {/* Decorative Kraton pattern */}
                <div className="absolute inset-0 kraton-pattern opacity-5" />
                <div className="relative">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 border-4 border-[#cca72f] shadow-xl ring-4 ring-white/20 bg-white/10">
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
                <p className="text-[#ffe088] text-sm mt-1 font-medium text-center relative">
                  {getSetting('madrasah_principals_name') || 'Kepala Madrasah'}
                </p>
              </div>
              <div className="md:col-span-2 p-8">
                <h3 className="font-bold text-[#003527] text-lg mb-4 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-[#cca72f]" />
                  Sambutan Kepala Madrasah
                </h3>
                {/* Arabic salam (opening) — centered, RTL, slightly smaller to sync with body */}
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-base md:text-lg text-[#003527] font-semibold mb-4 leading-relaxed text-center"
                  style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", "Amiri", serif' }}
                >
                  السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
                </p>
                <div className="text-[#404944] text-sm text-center">
                  <MarkdownRenderer
                    content={getSetting('madrasah_welcome') || "Puji syukur kehadirat Allah SWT yang telah memberikan rahmat dan karunia-Nya. MDTA Miftahul Ulum 01 berkomitmen untuk memberikan pendidikan Islam yang terbaik bagi putra-putri Anda. Dengan kurikulum yang berpusat pada Al-Quran dan As-Sunnah, kami berharap dapat mencetak generasi yang berilmu, berakhlak mulia, dan bermanfaat bagi agama, bangsa, dan negara. Selamat datang di keluarga besar Miftahul Ulum 01."}
                  />
                </div>
                {/* Arabic closing — centered, RTL, slightly smaller to sync with body */}
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-base md:text-lg text-[#003527] font-semibold mt-4 leading-relaxed text-center"
                  style={{ fontFamily: '"Traditional Arabic", "Scheherazade New", "Amiri", serif' }}
                >
                  وَالسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Statistics */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <KratonSectionHeader
          badge="Statistik"
          title="Data Madrasah"
          align="center"
        />
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

      {/* Latest News */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <KratonSectionHeader
            badge="Update Terkini"
            title="Berita Terbaru"
            align="left"
            className="mb-0"
          />
          <Button
            variant="ghost"
            onClick={() => { setCurrentPage('berita'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="text-[#003527] hover:text-[#064e3b] hover:gap-2 transition-all rounded-full shrink-0"
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <Card
                  className="overflow-hidden border border-[#e4e2de] shadow-premium card-hover group cursor-pointer rounded-2xl bg-[#ffffff]"
                  onClick={() => setSelectedNews(item as typeof selectedNews)}
                >
                  <div className="h-48 bg-gradient-to-br from-[#064e3b] to-[#003527] relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-[#cca72f] text-[#003527] text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#404944]/70 mb-1">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-semibold text-[#003527] line-clamp-2 mb-2 group-hover:text-[#064e3b] transition-colors">{item.title}</h3>
                    <p className="text-sm text-[#404944] line-clamp-2">{item.excerpt || ''}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0">
            <BookOpen className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
            <p className="text-[#404944]">Belum ada berita</p>
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
                <DialogTitle className="text-xl font-bold text-[#003527] pr-8">
                  {selectedNews.title}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-[#cca72f]/20 text-[#895033]">
                    {selectedNews.category}
                  </Badge>
                  <span className="text-xs text-[#404944]/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedNews.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {selectedNews.image && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-auto" />
                  </div>
                )}
                <div className="mt-4">
                  <MarkdownRenderer content={selectedNews.content} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* Dakwah & Kajian Terbaru */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <KratonSectionHeader
            badge="Inspirasi Islami"
            title={<span className="inline-flex items-center gap-2"><BookHeart className="h-7 w-7 text-[#cca72f]" /> Dakwah & Kajian</span>}
            align="left"
            className="mb-0"
          />
          <Button
            variant="ghost"
            onClick={() => { setCurrentPage('dakwah'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="text-[#003527] hover:text-[#064e3b] hover:gap-2 transition-all rounded-full shrink-0"
          >
            Selengkapnya <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {dakwahLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden border-0">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : dakwahList.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {dakwahList.map((item: { id: string; title: string; content: string; category: string; author?: string; image?: string; videoUrl?: string; createdAt: string }, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <Card
                  className="overflow-hidden border border-[#e4e2de] shadow-premium card-hover group cursor-pointer h-full flex flex-col rounded-2xl bg-[#ffffff]"
                  onClick={() => setSelectedDakwah(item)}
                >
                  {/* Image or gradient header */}
                  <div className="h-32 bg-gradient-to-br from-[#064e3b] to-[#895033] relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookHeart className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                    {/* Video play indicator */}
                    {item.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                          <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-[#cca72f] text-[#003527] text-xs capitalize">
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-[#003527] line-clamp-2 mb-2 group-hover:text-[#064e3b] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#404944] line-clamp-2 mb-3 flex-1">
                      {item.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#404944]/70 mt-auto">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.author || 'Tim Dakwah'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-0">
            <BookHeart className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
            <p className="text-[#404944]">Belum ada konten dakwah</p>
          </Card>
        )}

        {/* Dakwah Detail Dialog */}
        <Dialog open={!!selectedDakwah} onOpenChange={() => setSelectedDakwah(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            {selectedDakwah && (
              <>
                <DialogTitle className="text-xl font-bold text-[#003527] pr-8">
                  {selectedDakwah.title}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-[#cca72f]/20 text-[#895033] capitalize">
                    {selectedDakwah.category}
                  </Badge>
                  <span className="text-xs text-[#404944]/70 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedDakwah.author || 'Tim Dakwah'}
                  </span>
                  <span className="text-xs text-[#404944]/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedDakwah.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {/* Image (if no video) */}
                {selectedDakwah.image && !selectedDakwah.videoUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <img src={selectedDakwah.image} alt={selectedDakwah.title} className="w-full h-auto" />
                  </div>
                )}
                {/* Video embed */}
                {selectedDakwah.videoUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-black">
                    <iframe src={selectedDakwah.videoUrl} className="w-full h-full" allowFullScreen />
                  </div>
                )}
                <div className="mt-4">
                  <MarkdownRenderer content={selectedDakwah.content} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* Kalender Hijriyah & Masehi — Professional Calendar Cards */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <KratonSectionHeader
          badge="Penanggalan"
          title="Kalender"
          align="center"
          subtitle={<span className="inline-flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5 text-[#003527]" /> Klik kartu kalender untuk melihat kalender lengkap & hari besar Islam</span>}
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Kalender Hijriyah */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
          <Card
            className="border-0 shadow-premium-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group rounded-2xl"
            onClick={() => setCalendarModal({ open: true, type: 'hijri' })}
          >
            <div className="bg-gradient-to-br from-[#003527] via-[#064e3b] to-[#003527] text-white relative">
              {/* Kraton pattern overlay */}
              <div className="absolute inset-0 kraton-pattern opacity-[0.07] pointer-events-none" aria-hidden />
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#003527]/40 border-b border-[#cca72f]/20 relative">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#cca72f]" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">Kalender Hijriyah</h3>
                </div>
                <span className="text-base leading-none" aria-hidden>﷽</span>
              </div>
              {/* Body */}
              <div className="flex items-stretch gap-4 p-5 relative">
                {/* Date box */}
                <div className="flex flex-col items-center justify-center bg-[#cca72f] text-[#003527] rounded-xl px-5 py-4 shadow-lg min-w-[96px]">
                  <span className="text-4xl font-extrabold leading-none">
                    {hijriInfo?.day ?? '–'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 opacity-80">
                    {hijriInfo?.monthName?.split(' ')[0] ?? 'Bulan'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-[10px] text-[#ffe088]/90 uppercase tracking-widest mb-1 font-semibold">Penanggalan Islam</p>
                  <p className="text-base md:text-lg font-bold leading-tight">
                    {hijriInfo ? `${hijriInfo.monthName} ${hijriInfo.year} H` : '\u00A0'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[#b0f0d6]/80 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{masehiInfo?.weekday ?? '\u00A0'}</span>
                  </div>
                </div>
              </div>
              {/* Holiday badge */}
              {islamicHoliday && (
                <div className="px-5 pb-3 relative">
                  <div className="bg-[#cca72f]/20 border border-[#cca72f]/40 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
                    <span className="text-xl">{islamicHoliday.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#ffe088] uppercase tracking-wider font-semibold">Hari Besar Islam</p>
                      <p className="text-sm font-bold text-[#ffe088] truncate">{islamicHoliday.name}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Footer hint */}
              <div className="px-5 py-2.5 bg-[#003527]/30 border-t border-[#cca72f]/20 flex items-center justify-center gap-1.5 text-[11px] text-[#ffe088]/80 group-hover:text-[#ffe088] transition-colors">
                <Eye className="h-3 w-3" />
                <span className="font-medium">Lihat kalender lengkap &amp; hari besar Islam</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Card>
          </motion.div>

          {/* Kalender Masehi */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
          <Card
            className="border-0 shadow-premium-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group rounded-2xl"
            onClick={() => setCalendarModal({ open: true, type: 'masehi' })}
          >
            <div className="bg-gradient-to-br from-[#895033] via-[#a86644] to-[#895033] text-white relative">
              {/* Decorative Kraton pattern */}
              <div className="absolute inset-0 kraton-pattern opacity-[0.06] pointer-events-none" aria-hidden />
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#895033]/30 border-b border-[#cca72f]/20 relative">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#ffe088]" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">Kalender Masehi</h3>
                </div>
                <span className="text-base" aria-hidden>📅</span>
              </div>
              {/* Body */}
              <div className="flex items-stretch gap-4 p-5 relative">
                {/* Date box */}
                <div className="flex flex-col items-center justify-center bg-[#003527] text-white rounded-xl px-5 py-4 shadow-lg min-w-[96px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1.5">
                    {masehiInfo?.weekday?.substring(0, 3) ?? 'Hari'}
                  </span>
                  <span className="text-4xl font-extrabold leading-none">
                    {masehiInfo?.day ?? '–'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 opacity-80">
                    {masehiInfo?.monthName ?? 'Bulan'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-[10px] text-[#ffe088]/90 uppercase tracking-widest mb-1 font-semibold">Penanggalan Masehi</p>
                  <p className="text-base md:text-lg font-bold leading-tight">
                    {masehiInfo ? `${masehiInfo.monthName} ${masehiInfo.year}` : '\u00A0'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[#ffe088]/80 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {masehiInfo?.weekday ?? '\u00A0'}
                      {masehiInfo?.isWeekend && <span className="ml-2 text-[#ffe088]">• Akhir pekan</span>}
                    </span>
                  </div>
                </div>
              </div>
              {/* Holiday badge */}
              {masehiHoliday && (
                <div className="px-5 pb-3 relative">
                  <div className="bg-[#003527]/30 border border-[#cca72f]/40 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
                    <span className="text-xl">{masehiHoliday.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#ffe088] uppercase tracking-wider font-semibold">Hari Besar Nasional</p>
                      <p className="text-sm font-bold text-[#ffe088] truncate">{masehiHoliday.name}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Footer hint */}
              <div className="px-5 py-2.5 bg-[#895033]/30 border-t border-[#cca72f]/20 flex items-center justify-center gap-1.5 text-[11px] text-[#ffe088]/80 group-hover:text-[#ffe088] transition-colors">
                <Eye className="h-3 w-3" />
                <span className="font-medium">Lihat kalender lengkap &amp; hari besar nasional</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Card>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="relative bg-mesh-emerald py-12 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#064e3b]/20 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <KratonSectionHeader
              badge="Kata Mereka"
              title="Testimoni"
              align="center"
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="border border-white/40 shadow-premium-lg glass rounded-2xl">
                <CardContent className="p-8 text-center">
                  <Quote className="h-10 w-10 text-[#cca72f] mx-auto mb-4" />
                  <p className="text-[#404944] italic leading-relaxed mb-6">
                    &ldquo;{testimonials[testimonialIdx]?.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#003527] flex items-center justify-center text-white font-bold">
                      {testimonials[testimonialIdx]?.name?.charAt(0) || 'W'}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#003527] text-sm">{testimonials[testimonialIdx]?.name}</p>
                      <p className="text-[#404944] text-xs">{testimonials[testimonialIdx]?.role}</p>
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
                              i === testimonialIdx ? 'bg-[#cca72f]' : 'bg-[#064e3b]/30'
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
            </motion.div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="bg-[#cca72f]/5 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <KratonSectionHeader
              badge="Agenda"
              title="Kegiatan Mendatang"
              align="center"
            />
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: { id: string; title: string; description?: string; date: string; location?: string }, idx: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <Card className="border border-[#e4e2de] shadow-premium card-hover rounded-2xl bg-[#ffffff]">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="bg-[#003527] text-white rounded-xl p-3 text-center min-w-[60px]">
                          <div className="text-xl font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xs uppercase">
                            {new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#003527] mb-1">{event.title}</h3>
                          <p className="text-xs text-[#003527] flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3" />
                            {formatMasehiHijri(new Date(event.date))}
                          </p>
                          {event.location && (
                            <p className="text-xs text-[#404944] flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-[#404944] mt-1 line-clamp-2">{event.description}</p>
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

      {/* Calendar Modal — opened when user clicks calendar cards */}
      <CalendarModal
        open={calendarModal.open}
        onClose={() => setCalendarModal((prev) => ({ ...prev, open: false }))}
        initialType={calendarModal.type}
      />
    </div>
  )
}
