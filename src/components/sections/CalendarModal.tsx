'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, Sun, MapPin, CalendarDays } from 'lucide-react'
import {
  gregorianToHijri,
  hijriToGregorian,
  getHijriMonthLength,
  hijriMonthNames,
  masehiMonthNames,
  weekdayNames,
  islamicHolidays,
  getIslamicHolidaysInMonth,
  getMasehiHolidaysInMonth,
} from '@/lib/hijri'

interface CalendarModalProps {
  open: boolean
  onClose: () => void
  initialType?: 'masehi' | 'hijri'
}

type ViewType = 'masehi' | 'hijri'

function formatDualDate(date: Date): string {
  const masehi = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const h = gregorianToHijri(date)
  const hijri = `${h.day} ${hijriMonthNames[h.month - 1]} ${h.year} H`
  return `${masehi} (${hijri})`
}

export function CalendarModal({ open, onClose, initialType = 'masehi' }: CalendarModalProps) {
  const [viewType, setViewType] = useState<ViewType>(initialType)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Hijri view state — always initialized from TODAY's hijri date
  const todayHijri = useMemo(() => gregorianToHijri(today), [])
  const [hijriViewYear, setHijriViewYear] = useState(todayHijri.year)
  const [hijriViewMonth, setHijriViewMonth] = useState(todayHijri.month)

  // Fetch events
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
    enabled: open,
  })
  const allEvents: Array<{ id: string; title: string; date: string; location?: string | null; description?: string | null }> =
    Array.isArray(eventsData) ? eventsData : (eventsData?.events || [])

  // Reset to today when modal opens
  useEffect(() => {
    if (open) {
      setViewType(initialType)
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
      const h = gregorianToHijri(today)
      setHijriViewYear(h.year)
      setHijriViewMonth(h.month)
      setSelectedDate(null)
    }
  }, [open, initialType])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', handleKey)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [open, onClose])

  const goPrev = () => {
    if (viewType === 'masehi') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
      else setViewMonth(m => m - 1)
    } else {
      if (hijriViewMonth === 1) { setHijriViewMonth(12); setHijriViewYear(y => y - 1) }
      else setHijriViewMonth(m => m - 1)
    }
    setSelectedDate(null)
  }

  const goNext = () => {
    if (viewType === 'masehi') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    } else {
      if (hijriViewMonth === 12) { setHijriViewMonth(1); setHijriViewYear(y => y + 1) }
      else setHijriViewMonth(m => m + 1)
    }
    setSelectedDate(null)
  }

  // "Today" button — jump to current month
  const goToToday = () => {
    if (viewType === 'masehi') {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
    } else {
      const h = gregorianToHijri(today)
      setHijriViewYear(h.year)
      setHijriViewMonth(h.month)
    }
    setSelectedDate(null)
  }

  const getEventsOnDate = (date: Date) => {
    return allEvents.filter(e => {
      const d = new Date(e.date)
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    })
  }

  // Masehi grid
  const masehiGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const holidays = getMasehiHolidaysInMonth(viewYear, viewMonth)
    const islamicHols = getIslamicHolidaysInMonth(viewYear, viewMonth)
    const cells: Array<{ day: number | null; date: Date | null; isToday: boolean; holiday?: { name: string; emoji: string }; islamicHoliday?: { name: string; emoji: string }; events: typeof allEvents }> = []
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null, isToday: false, events: [] })
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day)
      cells.push({
        day, date, isToday: day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear(),
        holiday: holidays.find(h => h.day === day),
        islamicHoliday: islamicHols.find(h => h.day === day),
        events: getEventsOnDate(date),
      })
    }
    return cells
  }, [viewYear, viewMonth, allEvents])

  // Hijri grid
  const hijriGrid = useMemo(() => {
    const monthLength = getHijriMonthLength(hijriViewYear, hijriViewMonth)
    const firstGreg = hijriToGregorian({ day: 1, month: hijriViewMonth, year: hijriViewYear })
    const firstDayOfWeek = firstGreg.getDay()
    const cells: Array<{ hijriDay: number | null; gregDate: Date | null; isToday: boolean; holiday?: { name: string; emoji: string }; events: typeof allEvents }> = []
    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ hijriDay: null, gregDate: null, isToday: false, events: [] })
    for (let day = 1; day <= monthLength; day++) {
      const greg = hijriToGregorian({ day, month: hijriViewMonth, year: hijriViewYear })
      cells.push({
        hijriDay: day, gregDate: greg,
        isToday: greg.getDate() === today.getDate() && greg.getMonth() === today.getMonth() && greg.getFullYear() === today.getFullYear(),
        holiday: islamicHolidays.find(h => h.day === day && h.month === hijriViewMonth),
        events: getEventsOnDate(greg),
      })
    }
    return cells
  }, [hijriViewYear, hijriViewMonth, allEvents])

  // Sidebar events
  const monthEvents = useMemo(() => {
    if (viewType === 'masehi') {
      return allEvents.filter(e => { const d = new Date(e.date); return d.getMonth() === viewMonth && d.getFullYear() === viewYear })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
    return allEvents.filter(e => { const h = gregorianToHijri(new Date(e.date)); return h.year === hijriViewYear })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [allEvents, viewType, viewYear, viewMonth, hijriViewYear])

  // Holidays sidebar
  const holidaysList = useMemo(() => {
    if (viewType === 'hijri') {
      return islamicHolidays.map(h => ({ ...h, gregorian: hijriToGregorian({ day: h.day, month: h.month, year: hijriViewYear }), monthName: hijriMonthNames[h.month - 1] }))
        .sort((a, b) => a.gregorian.getTime() - b.gregorian.getTime())
    }
    const isl = getIslamicHolidaysInMonth(viewYear, viewMonth).map(h => ({ ...h, type: 'islamic' as const }))
    const mas = getMasehiHolidaysInMonth(viewYear, viewMonth).map(h => ({ ...h, type: 'masehi' as const }))
    return [...isl, ...mas].sort((a, b) => a.day - b.day)
  }, [viewType, viewYear, viewMonth, hijriViewYear])

  const selectedDateEvents = selectedDate ? getEventsOnDate(selectedDate) : []

  // Header label
  const headerLabel = viewType === 'masehi'
    ? `${masehiMonthNames[viewMonth]} ${viewYear}`
    : `${hijriMonthNames[hijriViewMonth - 1]} ${hijriViewYear} H`

  const headerSubLabel = viewType === 'hijri' ? (() => {
    const start = hijriToGregorian({ day: 1, month: hijriViewMonth, year: hijriViewYear })
    const len = getHijriMonthLength(hijriViewYear, hijriViewMonth)
    const end = hijriToGregorian({ day: len, month: hijriViewMonth, year: hijriViewYear })
    return `${start.getDate()} ${masehiMonthNames[start.getMonth()].slice(0,3)} - ${end.getDate()} ${masehiMonthNames[end.getMonth()].slice(0,3)} ${end.getFullYear()}`
  })() : undefined

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#ffffff] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white px-4 sm:px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="h-5 w-5 text-[#cca72f] shrink-0" />
                  <div>
                    <h2 className="font-bold text-base sm:text-lg leading-tight">Kalender & Agenda</h2>
                    <p className="text-[10px] sm:text-xs text-[#b0f0d6]">Klik tanggal untuk lihat agenda</p>
                  </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle + Today button */}
            <div className="bg-[#064e3b]/8/50 px-4 py-2 flex items-center justify-between gap-2 shrink-0 border-b border-emerald-100">
              <div className="flex gap-1.5">
                <button onClick={() => setViewType('masehi')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${viewType === 'masehi' ? 'bg-[#cca72f] text-white' : 'bg-[#ffffff] text-[#003527] hover:bg-[#cca72f]/8'}`}>
                  <Sun className="h-3 w-3" /> Masehi
                </button>
                <button onClick={() => setViewType('hijri')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${viewType === 'hijri' ? 'bg-[#003527] text-white' : 'bg-[#ffffff] text-[#003527] hover:bg-[#064e3b]/8'}`}>
                  <Moon className="h-3 w-3" /> Hijriyah
                </button>
              </div>
              <button onClick={goToToday} className="px-3 py-1 rounded-full text-xs font-medium bg-[#003527]/8 text-[#003527] hover:bg-[#003527]/10 transition-colors">
                Hari Ini
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-5 gap-0">
                {/* Calendar — 3 cols on desktop */}
                <div className="md:col-span-3 p-4 sm:p-5">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={goPrev} className="w-8 h-8 rounded-lg hover:bg-[#064e3b]/8 flex items-center justify-center text-[#003527] transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="text-center">
                      <h3 className="font-bold text-[#003527] text-sm sm:text-base">{headerLabel}</h3>
                      {headerSubLabel && <p className="text-[10px] text-[#404944]/70">{headerSubLabel}</p>}
                    </div>
                    <button onClick={goNext} className="w-8 h-8 rounded-lg hover:bg-[#064e3b]/8 flex items-center justify-center text-[#003527] transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {weekdayNames.map((day, i) => (
                      <div key={day} className={`text-center text-[10px] sm:text-xs font-bold py-1.5 ${i === 0 ? 'text-[#ba1a1a]/70' : i === 5 ? 'text-[#064e3b]' : 'text-[#404944]/70'}`}>{day}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {viewType === 'masehi'
                      ? masehiGrid.map((cell, idx) => (
                          <DayCell key={idx} day={cell.day} isToday={cell.isToday} holiday={cell.holiday} islamicHoliday={cell.islamicHoliday}
                            hasEvent={cell.events.length > 0}
                            isSelected={selectedDate && cell.date ? selectedDate.getTime() === cell.date.getTime() : false}
                            onClick={() => cell.date && setSelectedDate(cell.date)} />
                        ))
                      : hijriGrid.map((cell, idx) => (
                          <DayCell key={idx} day={cell.hijriDay} isToday={cell.isToday} holiday={cell.holiday}
                            sublabel={cell.gregDate ? `${cell.gregDate.getDate()}` : undefined} sublabelType="greg"
                            hasEvent={cell.events.length > 0}
                            isSelected={selectedDate && cell.gregDate ? selectedDate.getTime() === cell.gregDate.getTime() : false}
                            onClick={() => cell.gregDate && setSelectedDate(cell.gregDate)} />
                        ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-2 sm:gap-3 text-[10px] text-[#404944]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#cca72f]" /> Hari ini</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#064e3b]/12 border border-emerald-300" /> Hari Besar Islam</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]/8 border border-red-300" /> Hari Nasional</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#003527]/80" /> Agenda</span>
                  </div>

                  {/* Selected date events */}
                  {selectedDate && (
                    <div className="mt-3 p-3 bg-[#003527]/8 border border-[#003527]/15 rounded-lg">
                      <p className="text-xs font-bold text-[#003527] mb-2 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatDualDate(selectedDate)}
                      </p>
                      {selectedDateEvents.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedDateEvents.map(ev => (
                            <div key={ev.id} className="bg-[#ffffff] rounded-md p-2 border border-blue-50">
                              <p className="font-medium text-xs text-[#003527]">{ev.title}</p>
                              {ev.location && <p className="text-[10px] text-[#404944]/70 mt-0.5 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ev.location}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#404944]/70">Tidak ada agenda pada tanggal ini</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar — 2 cols on desktop */}
                <div className="bg-gradient-to-b from-emerald-50/50 to-amber-50/30 p-4 border-t md:border-t-0 md:border-l border-emerald-100">
                  {/* Agenda */}
                  <h4 className="font-bold text-[#003527] text-xs mb-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-[#003527]" />
                    Agenda {viewType === 'masehi' ? 'Bulan Ini' : hijriViewYear + ' H'}
                  </h4>
                  {monthEvents.length > 0 ? (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-0.5 mb-3">
                      {monthEvents.map(ev => {
                        const d = new Date(ev.date)
                        const h = gregorianToHijri(d)
                        return (
                          <div key={ev.id} className="bg-[#003527]/8/70 border border-[#003527]/15 rounded-md p-2">
                            <div className="flex items-start gap-2">
                              <div className="shrink-0 w-8 h-8 rounded bg-[#003527]/80 text-white flex flex-col items-center justify-center text-[9px] font-bold leading-none">
                                <span>{d.getDate()}</span>
                                <span className="text-[7px]">{masehiMonthNames[d.getMonth()].slice(0,3)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#003527] leading-tight">{ev.title}</p>
                                <p className="text-[9px] text-[#404944]/70 mt-0.5">{d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({h.day} {hijriMonthNames[h.month-1].slice(0,8)} {h.year} H)</p>
                                {ev.location && <p className="text-[9px] text-[#404944]/70 flex items-center gap-0.5 mt-0.5"><MapPin className="h-2 w-2" />{ev.location}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-[#404944]/70 text-[10px] mb-3">
                      <CalendarDays className="h-6 w-6 mx-auto mb-1 text-[#404944]/50" />Belum ada agenda
                    </div>
                  )}

                  {/* Holidays */}
                  <h4 className="font-bold text-[#003527] text-xs mb-2 flex items-center gap-1.5 border-t pt-2">
                    {viewType === 'hijri' ? <><Moon className="h-3.5 w-3.5 text-[#064e3b]" /> Hari Besar Islam</> : <><CalendarIcon className="h-3.5 w-3.5 text-[#064e3b]" /> Hari Besar</>}
                  </h4>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5">
                    {holidaysList.length > 0 ? (
                      viewType === 'hijri' ? (
                        (holidaysList as Array<{ name: string; emoji: string; day: number; month: number; gregorian: Date; monthName: string }>).map((h, idx) => (
                          <div key={idx} className={`p-1.5 rounded border ${h.month === hijriViewMonth ? 'bg-[#cca72f]/15/70 border-amber-200' : 'bg-white/50 border-emerald-50'}`}>
                            <div className="flex items-start gap-1.5">
                              <span className="text-sm shrink-0">{h.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-[#003527] leading-tight">{h.name}</p>
                                <p className="text-[9px] text-[#404944]/70">{h.day} {h.monthName} {hijriViewYear} H</p>
                                <p className="text-[8px] text-[#404944]/50">≈ {h.gregorian.getDate()} {masehiMonthNames[h.gregorian.getMonth()].slice(0,3)} {h.gregorian.getFullYear()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        (holidaysList as Array<{ name: string; emoji: string; day: number; type: string }>).map((h, idx) => (
                          <div key={idx} className={`p-1.5 rounded border ${h.type === 'islamic' ? 'bg-[#064e3b]/8 border-emerald-100' : 'bg-[#ba1a1a]/8 border-red-100'}`}>
                            <div className="flex items-start gap-1.5">
                              <span className="text-sm shrink-0">{h.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-[#003527] leading-tight">{h.name}</p>
                                <p className="text-[9px] text-[#404944]/70">{h.day} {masehiMonthNames[viewMonth].slice(0,3)} {viewYear}</p>
                                <span className={`text-[8px] px-1 py-0.5 rounded-full ${h.type === 'islamic' ? 'bg-[#064e3b]/12 text-[#064e3b]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'}`}>{h.type === 'islamic' ? 'Islam' : 'Nasional'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      <p className="text-center text-[10px] text-[#404944]/70 py-2">Tidak ada hari besar</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#fbf9f5] border-t text-center text-[10px] text-[#404944]/70 shrink-0">
              <kbd className="px-1 py-0.5 bg-[#ffffff] border rounded text-[9px]">ESC</kbd> tutup • Klik tanggal untuk agenda • Tombol "Hari Ini" untuk kembali
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- Day Cell ---
interface DayCellProps {
  day: number | null
  isToday: boolean
  holiday?: { name: string; emoji: string }
  islamicHoliday?: { name: string; emoji: string }
  sublabel?: string
  sublabelType?: 'greg' | 'islamic' | 'national'
  hasEvent?: boolean
  isSelected?: boolean
  onClick?: () => void
}

function DayCell({ day, isToday, holiday, islamicHoliday, sublabel, sublabelType, hasEvent, isSelected, onClick }: DayCellProps) {
  if (day === null) return <div className="aspect-square" />
  const hasHoliday = !!holiday || !!islamicHoliday
  const isNational = !!islamicHoliday === false && sublabelType === 'national'
  return (
    <div
      title={holiday?.name || islamicHoliday?.name || (hasEvent ? 'Ada agenda' : undefined)}
      onClick={onClick}
      className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs sm:text-sm relative transition-colors ${onClick ? 'cursor-pointer' : ''} ${
        isToday ? 'bg-[#cca72f] text-white font-bold shadow-sm'
        : isSelected ? 'bg-[#003527]/80 text-white font-bold'
        : hasHoliday ? (isNational ? 'bg-[#ba1a1a]/8 border border-red-200 text-[#003527] font-medium' : 'bg-[#064e3b]/8 border border-[#e4e2de] text-[#003527] font-medium')
        : hasEvent ? 'bg-[#003527]/8 border border-[#003527]/15 text-[#003527] font-medium hover:bg-[#003527]/10'
        : 'hover:bg-[#fbf9f5] text-[#404944]'
      }`}
    >
      <span className="leading-none">{day}</span>
      {sublabel && <span className={`text-[8px] leading-none mt-0.5 ${isToday ? 'text-white/70' : 'text-[#404944]/70'}`}>{sublabel}</span>}
      {hasHoliday && <span className="absolute bottom-0 right-0 text-[8px] sm:text-[9px]">{holiday?.emoji || islamicHoliday?.emoji}</span>}
      {hasEvent && <span className={`absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-[#003527]/80'}`} />}
    </div>
  )
}
