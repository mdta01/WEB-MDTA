// Hijri calendar utilities — accurate calculation (Umm al-Qura algorithm approximation)
// + Islamic holidays list (works for any year)

// Hijri month names (Indonesian)
export const hijriMonthNames = [
  'Muharram', 'Safar', "Rabi'ul Awal", "Rabi'ul Akhir",
  'Jumadil Awal', 'Jumadil Akhir', 'Rajab', "Sya'ban",
  'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
]

// Masehi month names (Indonesian)
export const masehiMonthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Weekday names (Indonesian) — Sunday-first to match Date.getDay()
export const weekdayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
export const weekdayNamesFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export interface HijriDate {
  day: number
  month: number // 1-12
  year: number
}

/**
 * Convert Gregorian date to Hijri (Islamic) date.
 * Uses the Kuwaiti algorithm — accurate within ±1 day for most dates.
 */
export function gregorianToHijri(date: Date): HijriDate {
  const jd = Math.floor(date.getTime() / 86400000) + 2440587.5
  const l = Math.floor(jd - 1948439.5 + 10632)
  const n = Math.floor((l - 1) / 10631)
  const lPrime = l - 10631 * n + 354
  const j = Math.floor((10985 - lPrime) / 5316) * Math.floor((50 * lPrime) / 17719) +
            Math.floor(lPrime / 5670) * Math.floor((43 * lPrime) / 15238)
  const lDPrime = lPrime - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
                  Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const m = Math.floor((24 * lDPrime) / 709)
  const d = lDPrime - Math.floor((709 * m) / 24)
  const y = 30 * n + j - 30
  return { day: d, month: m, year: y }
}

/**
 * Convert Hijri date to Gregorian date.
 * Inverse of gregorianToHijri.
 */
export function hijriToGregorian(h: HijriDate): Date {
  const jd = Math.floor((11 * h.year + 3) / 30) + 354 * h.year + 30 * h.month -
             Math.floor((h.month - 1) / 2) + h.day + 1948439.5 - 385
  return new Date((jd - 2440587.5) * 86400000)
}

/**
 * Get number of days in a Hijri month.
 * Uses month-length table based on alternating 30/29 days + leap year adjustment.
 */
export function getHijriMonthLength(year: number, month: number): number {
  // Standard alternating pattern: odd months = 30, even months = 29
  // Last month (Dzulhijjah) is 30 in leap years, 29 otherwise
  if (month === 12) {
    // Leap year: year mod 30 is in {2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29}
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]
    return leapYears.includes(((year % 30) + 30) % 30) ? 30 : 29
  }
  return month % 2 === 1 ? 30 : 29
}

// Islamic holidays — fixed by Hijri month/day (work for any year)
export interface IslamicHoliday {
  day: number
  month: number // 1-12
  name: string
  emoji: string
}

export const islamicHolidays: IslamicHoliday[] = [
  { day: 1, month: 1, name: 'Tahun Baru Hijriyah', emoji: '🌙' },
  { day: 10, month: 1, name: 'Hari Asyura', emoji: '🕯️' },
  { day: 12, month: 3, name: 'Maulid Nabi Muhammad ﷺ', emoji: '🕌' },
  { day: 27, month: 7, name: "Isra Mi'raj Nabi ﷺ", emoji: '✨' },
  { day: 15, month: 8, name: "Nisfu Sya'ban", emoji: '🌟' },
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

// Indonesian national holidays — fixed by Masehi month/day
export interface MasehiHoliday {
  day: number
  month: number
  name: string
  emoji: string
}

export const masehiHolidays: MasehiHoliday[] = [
  { day: 1, month: 1, name: 'Tahun Baru Masehi', emoji: '🎊' },
  { day: 1, month: 5, name: 'Hari Buruh Internasional', emoji: '👷' },
  { day: 1, month: 6, name: 'Hari Lahir Pancasila', emoji: '🇮🇩' },
  { day: 17, month: 8, name: 'Hari Kemerdekaan RI', emoji: '🇮🇩' },
  { day: 2, month: 10, name: 'Hari Batik Nasional', emoji: '🎨' },
  { day: 28, month: 10, name: 'Hari Sumpah Pemuda', emoji: '🇮🇩' },
  { day: 10, month: 11, name: 'Hari Pahlawan', emoji: '🎖️' },
  { day: 25, month: 12, name: 'Hari Natal', emoji: '🎄' },
]

/**
 * Get Islamic holidays for a given Hijri year.
 * Returns sorted by month, day.
 */
export function getIslamicHolidaysForYear(hijriYear: number): Array<IslamicHoliday & { gregorian: Date }> {
  return islamicHolidays
    .map((h) => ({
      ...h,
      gregorian: hijriToGregorian({ day: h.day, month: h.month, year: hijriYear }),
    }))
    .sort((a, b) => a.gregorian.getTime() - b.gregorian.getTime())
}

/**
 * Get all Islamic holidays in a given Gregorian month.
 * Checks both Hijri years that overlap the Gregorian month.
 */
export function getIslamicHolidaysInMonth(year: number, month: number): Array<{
  day: number
  name: string
  emoji: string
}> {
  const result: Array<{ day: number; name: string; emoji: string }> = []
  // Check each day of the month for Islamic holidays
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const hijri = gregorianToHijri(date)
    const holiday = islamicHolidays.find(
      (h) => h.day === hijri.day && h.month === hijri.month
    )
    if (holiday) {
      result.push({ day, name: holiday.name, emoji: holiday.emoji })
    }
  }
  return result
}

/**
 * Get Masehi (national) holidays in a given Gregorian month.
 */
export function getMasehiHolidaysInMonth(year: number, month: number): Array<{
  day: number
  name: string
  emoji: string
}> {
  return masehiHolidays
    .filter((h) => h.month === month + 1)
    .map((h) => ({ day: h.day, name: h.name, emoji: h.emoji }))
}

/**
 * Get Hijri date info for a Gregorian date.
 */
export function getHijriInfo(date: Date): HijriDate & { monthName: string; fullString: string } {
  const h = gregorianToHijri(date)
  const monthName = hijriMonthNames[h.month - 1] || 'Muharram'
  return {
    ...h,
    monthName,
    fullString: `${h.day} ${monthName} ${h.year} H`,
  }
}
