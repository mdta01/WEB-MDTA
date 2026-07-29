'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, Sun, MapPin, Clock, Event } from 'lucide-react'
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

// Format both Masehi + Hijri for a date
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

  // Fetch events
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then(r => r.json()),
    enabled: open,
  })
  const allEvents: Array<{ id: string; title: string; date: string; location?: string | null; description?: string | null; category?: string }> =
    Array.isArray(eventsData) ? eventsData : (eventsData?.events || [])

  // Sync initial type when modal opens
  useEffect(() => {
    if (open) {
      setViewType(initialType)
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
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

  const currentHijri = useMemo(() => gregorianToHijri(new Date(viewYear, viewMonth, 1)), [viewYear, viewMonth])
  const [hijriViewYear, setHijriViewYear] = useState(currentHijri.year)
  const [hijriViewMonth, setHijriViewMonth] = useState(currentHijri.month)

  useEffect(() => {
    if (viewType === 'hijri') {
      const h = gregorianToHijri(new Date(viewYear, viewMonth, 1))
      setHijriViewYear(h.year)
      setHijriViewMonth(h.month)
    }
  }, [viewType])

  const goPrevMonth = () => {
    if (viewType === 'masehi') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
      else setViewMonth(m => m - 1)
    } else {
      if (hijriViewMonth === 1) { setHijriViewMonth(12); setHijriViewYear(y => y - 1) }
      else setHijriViewMonth(m => m - 1)
    }
    setSelectedDate(null)
  }

  const goNextMonth = () => {
    if (viewType === 'masehi') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    } else {
      if (hijriViewMonth === 12) { setHijriViewMonth(1); setHijriViewYear(y => y + 1) }
      else setHijriViewMonth(m => m + 1)
    }
    setSelectedDate(null)
  }

  // Helper: find events on a specific Masehi date
  const getEventsOnDate = (date: Date) => {
    return allEvents.filter(e => {
      const eventDate = new Date(e.date)
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear()
    })
  }

  // Build Masehi calendar grid
  const masehiGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const holidays = getMasehiHolidaysInMonth(viewYear, viewMonth)
    const islamicHolidaysThisMonth = getIslamicHolidaysInMonth(viewYear, viewMonth)

    const cells: Array<{
      day: number | null
      date: Date | null
      isToday: boolean
      holiday?: { name: string; emoji: string }
      islamicHoliday?: { name: string; emoji: string }
      events: typeof allEvents
    }> = []

    for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null, isToday: false, events: [] })
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day)
      const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
      const holiday = holidays.find(h => h.day === day)
      const islamicHoliday = islamicHolidaysThisMonth.find(h => h.day === day)
      const dayEvents = getEventsOnDate(date)
      cells.push({ day, date, isToday, holiday, islamicHoliday, events: dayEvents })
    }
    return cells
  }, [viewYear, viewMonth, allEvents])

  // Build Hijri calendar grid
  const hijriGrid = useMemo(() => {
    const monthLength = getHijriMonthLength(hijriViewYear, hijriViewMonth)
    const firstGregorian = hijriToGregorian({ day: 1, month: hijriViewMonth, year: hijriViewYear })
    const firstDayOfWeek = firstGregorian.getDay()

    const cells: Array<{
      hijriDay: number | null
      gregorianDate: Date | null
      isToday: boolean
      holiday?: { name: string; emoji: string }
      events: typeof allEvents
    }> = []

    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ hijriDay: null, gregorianDate: null, isToday: false, events: [] })
    for (let day = 1; day <= monthLength; day++) {
      const gregorian = hijriToGregorian({ day, month: hijriViewMonth, year: hijriViewYear })
      const isToday = gregorian.getDate() === today.getDate() && gregorian.getMonth() === today.getMonth() && gregorian.getFullYear() === today.getFullYear()
      const holiday = islamicHolidays.find(h => h.day === day && h.month === hijriViewMonth)
      const dayEvents = getEventsOnDate(gregorian)
      cells.push({ hijriDay: day, gregorianDate: gregorian, isToday, holiday, events: dayEvents })
    }
    return cells
  }, [hijriViewYear, hijriViewMonth, allEvents])

  // Sidebar: events for current month (Masehi view) or current Hijri year (Hijri view)
  const monthEvents = useMemo(() => {
    if (viewType === 'masehi') {
      return allEvents
        .filter(e => {
          const d = new Date(e.date)
          return d.getMonth() === viewMonth && d.getFullYear() === viewYear
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
    // Hijri view: events in the hijri year
    return allEvents
      .filter(e => {
        const d = new Date(e.date)
        const h = gregorianToHijri(d)
        return h.year === hijriViewYear
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [allEvents, viewType, viewYear, viewMonth, hijriViewYear])

  // Holidays for sidebar
  const holidaysThisHijriYear = useMemo(() => {
    return islamicHolidays
      .map(h => ({ ...h, gregorian: hijriToGregorian({ day: h.day, month: h.month, year: hijriViewYear }), monthName: hijriMonthNames[h.month - 1] }))
      .sort((a, b) => a.gregorian.getTime() - b.gregorian.getTime())
  }, [hijriViewYear])

  const holidaysThisMasehiMonth = useMemo(() => {
    const islamic = getIslamicHolidaysInMonth(viewYear, viewMonth).map(h => ({ ...h, type: 'islamic' as const }))
    const masehi = getMasehiHolidaysInMonth(viewYear, viewMonth).map(h => ({ ...h, type: 'masehi' as const }))
    return [...islamic, ...masehi].sort((a, b) => a.day - b.day)
  }, [viewYear, viewMonth])

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsOnDate(selectedDate) : []

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Kalender & Agenda</h2>
                  <p className="text-xs text-emerald-200">
                    {viewType === 'masehi' ? 'Penanggalan Masehi' : 'Penanggalan Hijriyah'} — Klik tanggal untuk lihat agenda
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="bg-emerald-50 px-6 py-3 flex items-center justify-center gap-2 shrink-0 border-b border-emerald-100">
              <button onClick={() => setViewType('masehi')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${viewType === 'masehi' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-emerald-700 hover:bg-amber-50'}`}>
                <Sun className="h-4 w-4" /> Masehi
              </button>
              <button onClick={() => setViewType('hijri')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${viewType === 'hijri' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-emerald-700 hover:bg-emerald-50'}`}>
                <Moon className="h-4 w-4" /> Hijriyah
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-3 gap-0">
                {/* Calendar grid */}
                <div className="md:col-span-2 p-6">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={goPrevMonth} className="w-9 h-9 rounded-full hover:bg-emerald-50 flex items-center justify-center text-emerald-700 transition-colors" aria-label="Bulan sebelumnya">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="text-center">
                      <h3 className="font-bold text-emerald-800 text-lg">
                        {viewType === 'masehi' ? `${masehiMonthNames[viewMonth]} ${viewYear}` : `${hijriMonthNames[hijriViewMonth - 1]} ${hijriViewYear} H`}
                      </h3>
                      {viewType === 'hijri' && (
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const start = hijriToGregorian({ day: 1, month: hijriViewMonth, year: hijriViewYear })
                            const len = getHijriMonthLength(hijriViewYear, hijriViewMonth)
                            const end = hijriToGregorian({ day: len, month: hijriViewMonth, year: hijriViewYear })
                            return `${start.getDate()} ${masehiMonthNames[start.getMonth()]} - ${end.getDate()} ${masehiMonthNames[end.getMonth()]} ${end.getFullYear()}`
                          })()}
                        </p>
                      )}
                    </div>
                    <button onClick={goNextMonth} className="w-9 h-9 rounded-full hover:bg-emerald-50 flex items-center justify-center text-emerald-700 transition-colors" aria-label="Bulan berikutnya">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdayNames.map((day, i) => (
                      <div key={day} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-500' : i === 5 ? 'text-emerald-600' : 'text-gray-500'}`}>{day}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {viewType === 'masehi'
                      ? masehiGrid.map((cell, idx) => (
                          <DayCell
                            key={idx}
                            day={cell.day}
                            isToday={cell.isToday}
                            holiday={cell.holiday}
                            islamicHoliday={cell.islamicHoliday}
                            hasEvent={cell.events.length > 0}
                            eventCount={cell.events.length}
                            isSelected={selectedDate && cell.date ? selectedDate.getTime() === cell.date.getTime() : false}
                            onClick={() => cell.date && setSelectedDate(cell.date)}
                          />
                        ))
                      : hijriGrid.map((cell, idx) => {
                          const gregDay = cell.gregorianDate?.getDate()
                          return (
                            <DayCell
                              key={idx}
                              day={cell.hijriDay}
                              isToday={cell.isToday}
                              holiday={cell.holiday}
                              sublabel={gregDay ? `${gregDay}` : undefined}
                              sublabelType="greg"
                              hasEvent={cell.events.length > 0}
                              eventCount={cell.events.length}
                              isSelected={selectedDate && cell.gregorianDate ? selectedDate.getTime() === cell.gregorianDate.getTime() : false}
                              onClick={() => cell.gregorianDate && setSelectedDate(cell.gregorianDate)}
                            />
                          )
                        })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Hari ini</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300" /> Hari Besar Islam</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-300" /> Hari Besar Nasional</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Ada Agenda</span>
                  </div>

                  {/* Selected date events */}
                  {selectedDate && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                        <Event className="h-3.5 w-3.5" />
                        Agenda: {formatDualDate(selectedDate)}
                      </p>
                      {selectedDateEvents.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDateEvents.map(ev => (
                            <div key={ev.id} className="bg-white rounded-lg p-3 border border-blue-100">
                              <p className="font-semibold text-sm text-emerald-800">{ev.title}</p>
                              {ev.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {ev.location}
                                </p>
                              )}
                              {ev.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Tidak ada agenda pada tanggal ini</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="bg-gradient-to-b from-emerald-50 to-amber-50 p-6 border-l border-emerald-100">
                  {/* Agenda section */}
                  <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                    <Event className="h-4 w-4 text-blue-600" />
                    Agenda/Kegiatan {viewType === 'masehi' ? 'Bulan Ini' : hijriViewYear + ' H'}
                  </h4>
                  {monthEvents.length > 0 ? (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 mb-4">
                      {monthEvents.map((ev, idx) => {
                        const eventDate = new Date(ev.date)
                        const h = gregorianToHijri(eventDate)
                        return (
                          <div key={ev.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500 text-white flex flex-col items-center justify-center text-[10px] font-bold">
                                <span>{eventDate.getDate()}</span>
                                <span className="text-[8px]">{masehiMonthNames[eventDate.getMonth()].substring(0, 3)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-emerald-900">{ev.title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {eventDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {' '}({h.day} {hijriMonthNames[h.month - 1].substring(0, 8)} {h.year} H)
                                </p>
                                {ev.location && (
                                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="h-2.5 w-2.5" /> {ev.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs mb-4">
                      <Event className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                      Belum ada agenda
                    </div>
                  )}

                  {/* Holidays section */}
                  <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2 border-t pt-3">
                    {viewType === 'hijri' ? (
                      <><Moon className="h-4 w-4 text-emerald-600" /> Hari Besar Islam</>
                    ) : (
                      <><CalendarIcon className="h-4 w-4 text-emerald-600" /> Hari Besar</>
                    )}
                  </h4>
                  {viewType === 'hijri' ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {holidaysThisHijriYear.map((h, idx) => {
                        const isCurrentMonth = h.month === hijriViewMonth
                        return (
                          <div key={idx} className={`p-2 rounded-lg border ${isCurrentMonth ? 'bg-amber-100 border-amber-300' : 'bg-white/60 border-emerald-100'}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg shrink-0">{h.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-emerald-900">{h.name}</p>
                                <p className="text-[10px] text-gray-600">{h.day} {h.monthName} {hijriViewYear} H</p>
                                <p className="text-[9px] text-gray-500">≈ {h.gregorian.getDate()} {masehiMonthNames[h.gregorian.getMonth()].substring(0, 3)} {h.gregorian.getFullYear()}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : holidaysThisMasehiMonth.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {holidaysThisMasehiMonth.map((h, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border ${h.type === 'islamic' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-lg shrink-0">{h.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-emerald-900">{h.name}</p>
                              <p className="text-[10px] text-gray-600">{h.day} {masehiMonthNames[viewMonth].substring(0, 3)} {viewYear}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${h.type === 'islamic' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {h.type === 'islamic' ? 'Islam' : 'Nasional'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-4">Tidak ada hari besar</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t text-center text-xs text-gray-500 shrink-0">
              Tekan <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">ESC</kbd> untuk tutup •
              Klik <Sun className="inline h-3 w-3" /> Masehi atau <Moon className="inline h-3 w-3" /> Hijriyah untuk ganti •
              Klik tanggal untuk lihat agenda
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
  eventCount?: number
  isSelected?: boolean
  onClick?: () => void
}

function DayCell({ day, isToday, holiday, islamicHoliday, sublabel, sublabelType, hasEvent, eventCount, isSelected, onClick }: DayCellProps) {
  if (day === null) return <div className="aspect-square" />

  const hasHoliday = !!holiday || !!islamicHoliday
  const isNational = !!islamicHoliday === false && sublabelType === 'national'

  return (
    <div
      title={holiday?.name || islamicHoliday?.name || (hasEvent ? `${eventCount} agenda` : undefined)}
      onClick={onClick}
      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        isToday
          ? 'bg-amber-500 text-white font-bold shadow-md ring-2 ring-amber-300'
          : isSelected
            ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300'
            : hasHoliday
              ? isNational
                ? 'bg-red-50 border border-red-300 text-emerald-900 font-medium hover:bg-red-100'
                : 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium hover:bg-emerald-100'
              : hasEvent
                ? 'bg-blue-50 border border-blue-200 text-blue-800 font-medium hover:bg-blue-100'
                : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <span className="leading-none">{day}</span>
      {sublabel && (
        <span className={`text-[9px] leading-none mt-0.5 ${isToday ? 'text-white/80' : sublabelType === 'greg' ? 'text-gray-400' : 'text-gray-500'}`}>
          {sublabel}
        </span>
      )}
      {/* Holiday emoji */}
      {hasHoliday && (
        <span className="absolute bottom-0.5 right-0.5 text-[10px]" aria-hidden>
          {holiday?.emoji || islamicHoliday?.emoji}
        </span>
      )}
      {/* Event indicator dot */}
      {hasEvent && !isToday && (
        <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden />
      )}
      {hasEvent && isToday && (
        <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white" aria-hidden />
      )}
    </div>
  )
}
