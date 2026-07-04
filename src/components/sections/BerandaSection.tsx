'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, Award, GraduationCap, ArrowRight,
  Calendar, Star, ChevronLeft, ChevronRight, Quote,
  MapPin, X, Eye,
} from 'lucide-react'
import { useState, useEffect, useRef, useReducer, useSyncExternalStore } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { CalendarModal } from '@/components/sections/CalendarModal'
import { useAppStore } from '@/store/useAppStore'

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

const masehiMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
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
        <div className="bg-gradient-to-b from-emerald-800 via-emerald-800 to-emerald-900 text-white">
          {/* Hero background image - only render after settings load to avoid flashing fallback image */}
          <div className="absolute inset-0">
            {!settingsLoading && (
              <img
                src={getSetting('madrasah_hero_image') || '/images/hero-madrasah.png'}
                alt="MDTA Miftahul Ulum 01"
                className="w-full h-full object-cover opacity-20"
              />
            )}
            {/* Soft radial overlay for depth (subtle, matches section ambiance) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,95,70,0.0)_0%,rgba(6,78,59,0.4)_100%)]" />
          </div>

          {/* Subtle Islamic pattern overlay (very low opacity, harmonious) */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" aria-hidden style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          {/* Centered hero content */}
          <div className="container mx-auto px-4 py-20 md:py-28 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto text-center flex flex-col items-center"
            >
              {/* Bismillah badge — subtle, smaller */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/25 text-amber-200/90 px-4 py-1.5 rounded-full mb-6"
              >
                <span className="text-xs leading-none text-amber-300/60">✦</span>
                <span className="font-arabic text-sm md:text-base tracking-wide">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </span>
                <span className="text-xs leading-none text-amber-300/60">✦</span>
              </motion.div>

              {/* Madrasah name — gradient text, slightly smaller */}
              <h1
                className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 leading-[1.15] uppercase tracking-wide bg-gradient-to-b from-white via-amber-50 to-amber-200 bg-clip-text text-transparent"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}
              >
                {getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'}
              </h1>

              {/* Decorative divider */}
              <div className="flex items-center gap-3 mb-6" aria-hidden>
                <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-amber-400/80" />
                <span className="text-amber-400 text-sm">◆</span>
                <span className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-amber-400/80" />
              </div>

              {/* Address — badge-style with MapPin icon */}
              <div className="inline-flex items-center gap-2 bg-emerald-700/40 border border-emerald-400/30 text-amber-100 px-5 py-2 rounded-full mb-5 backdrop-blur-sm">
                <MapPin className="h-4 w-4 text-amber-300" />
                <span className="text-sm md:text-base font-semibold tracking-wide">
                  Tawangsari, Pujon
                </span>
              </div>

              {/* Description — italic with typewriter effect */}
              <p className="text-emerald-50/90 text-sm md:text-base mb-8 max-w-2xl leading-relaxed italic min-h-[3rem] flex items-start">
                <span>{typedDescription}</span>
                <span
                  className={`inline-block w-[2px] h-[1.1em] bg-amber-300 ml-1 mt-1 shrink-0 ${typingDone ? 'animate-blink' : ''}`}
                  aria-hidden
                />
              </p>

              {/* CTA buttons — more prominent with hover scale */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => { setCurrentPage('ppdb'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-900 font-bold px-8 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
                  size="lg"
                >
                  Daftar PPDB
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => { setCurrentPage('profil'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="border-2 border-amber-300/40 text-amber-50 bg-white/5 hover:bg-amber-400/10 hover:border-amber-300/70 font-semibold px-8 backdrop-blur-sm hover:scale-105 transition-all"
                  size="lg"
                >
                  Tentang Kami
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Smooth wave transition to next section (cream/white below) */}
          <div className="absolute bottom-0 inset-x-0 leading-none pointer-events-none" aria-hidden>
            <svg
              viewBox="0 0 1440 60"
              preserveAspectRatio="none"
              className="w-full h-[40px] md:h-[60px]"
              fill="#ffffff"
            >
              <path d="M0,32 C240,60 480,60 720,40 C960,20 1200,20 1440,40 L1440,60 L0,60 Z" />
            </svg>
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

      {/* Kalender Hijriyah & Masehi — Professional Calendar Cards */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Kalender</h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            Klik kartu kalender untuk melihat kalender lengkap &amp; hari besar Islam
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Kalender Hijriyah */}
          <Card
            className="border-0 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
            onClick={() => setCalendarModal({ open: true, type: 'hijri' })}
          >
            <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white relative">
              {/* Islamic pattern overlay */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 py-3 bg-emerald-950/40 border-b border-amber-400/20 relative">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">Kalender Hijriyah</h3>
                </div>
                <span className="text-base leading-none" aria-hidden>﷽</span>
              </div>
              {/* Body */}
              <div className="flex items-stretch gap-4 p-5 relative">
                {/* Date box */}
                <div className="flex flex-col items-center justify-center bg-amber-400 text-emerald-900 rounded-xl px-5 py-4 shadow-lg min-w-[96px]">
                  <span className="text-4xl font-extrabold leading-none">
                    {hijriInfo?.day ?? '–'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 opacity-80">
                    {hijriInfo?.monthName?.split(' ')[0] ?? 'Bulan'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-[10px] text-amber-300/90 uppercase tracking-widest mb-1 font-semibold">Penanggalan Islam</p>
                  <p className="text-base md:text-lg font-bold leading-tight">
                    {hijriInfo ? `${hijriInfo.monthName} ${hijriInfo.year} H` : '\u00A0'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-emerald-100/80 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{masehiInfo?.weekday ?? '\u00A0'}</span>
                  </div>
                </div>
              </div>
              {/* Holiday badge */}
              {islamicHoliday && (
                <div className="px-5 pb-3 relative">
                  <div className="bg-amber-400/20 border border-amber-400/40 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
                    <span className="text-xl">{islamicHoliday.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Hari Besar Islam</p>
                      <p className="text-sm font-bold text-amber-100 truncate">{islamicHoliday.name}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Footer hint */}
              <div className="px-5 py-2.5 bg-emerald-950/30 border-t border-amber-400/20 flex items-center justify-center gap-1.5 text-[11px] text-amber-200/80 group-hover:text-amber-100 transition-colors">
                <Eye className="h-3 w-3" />
                <span className="font-medium">Lihat kalender lengkap &amp; hari besar Islam</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Card>

          {/* Kalender Masehi */}
          <Card
            className="border-0 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
            onClick={() => setCalendarModal({ open: true, type: 'masehi' })}
          >
            <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white relative">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" aria-hidden style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 py-3 bg-amber-950/30 border-b border-emerald-400/20 relative">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-200" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">Kalender Masehi</h3>
                </div>
                <span className="text-base" aria-hidden>📅</span>
              </div>
              {/* Body */}
              <div className="flex items-stretch gap-4 p-5 relative">
                {/* Date box */}
                <div className="flex flex-col items-center justify-center bg-emerald-600 text-white rounded-xl px-5 py-4 shadow-lg min-w-[96px]">
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
                  <p className="text-[10px] text-emerald-100/90 uppercase tracking-widest mb-1 font-semibold">Penanggalan Masehi</p>
                  <p className="text-base md:text-lg font-bold leading-tight">
                    {masehiInfo ? `${masehiInfo.monthName} ${masehiInfo.year}` : '\u00A0'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-emerald-50/80 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {masehiInfo?.weekday ?? '\u00A0'}
                      {masehiInfo?.isWeekend && <span className="ml-2 text-amber-200">• Akhir pekan</span>}
                    </span>
                  </div>
                </div>
              </div>
              {/* Holiday badge */}
              {masehiHoliday && (
                <div className="px-5 pb-3 relative">
                  <div className="bg-emerald-600/30 border border-emerald-300/40 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
                    <span className="text-xl">{masehiHoliday.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">Hari Besar Nasional</p>
                      <p className="text-sm font-bold text-emerald-50 truncate">{masehiHoliday.name}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Footer hint */}
              <div className="px-5 py-2.5 bg-amber-950/30 border-t border-emerald-400/20 flex items-center justify-center gap-1.5 text-[11px] text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                <Eye className="h-3 w-3" />
                <span className="font-medium">Lihat kalender lengkap &amp; hari besar nasional</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
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

      {/* Calendar Modal — opened when user clicks calendar cards */}
      <CalendarModal
        open={calendarModal.open}
        onClose={() => setCalendarModal((prev) => ({ ...prev, open: false }))}
        initialType={calendarModal.type}
      />
    </div>
  )
}
