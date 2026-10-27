import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/traffic?range=daily|weekly|monthly
 *
 * Returns traffic analytics for the admin dashboard.
 *
 * — `range=daily`: last 24 hours, grouped by hour (24 data points)
 * — `range=weekly`: last 7 days, grouped by day (7 data points)
 * — `range=monthly`: last 30 days, grouped by day (30 data points)
 *
 * Always returns realtime stats (online now, today's total) regardless of range.
 *
 * Auth: requires admin session cookie.
 */
export async function GET(request: NextRequest) {
  // Auth check
  const authed = await isAdminAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') || 'daily') as 'daily' | 'weekly' | 'monthly'
  const validRanges = ['daily', 'weekly', 'monthly'] as const
  const rangeKey = validRanges.includes(range) ? range : 'daily'

  try {
    // ---- Realtime stats (always computed) ----
    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    let onlineNow = 0
    let todayVisitors = 0
    let todayPageViews = 0
    let totalVisitors = 0

    try {
      // Online now = unique visitorHash with pageview in last 5 min
      const onlineRows = await db.pageView.findMany({
        where: { createdAt: { gte: fiveMinAgo } },
        select: { visitorHash: true },
        distinct: ['visitorHash'],
      })
      onlineNow = onlineRows.length

      // Today's unique visitors
      const todayRows = await db.pageView.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { visitorHash: true },
        distinct: ['visitorHash'],
      })
      todayVisitors = todayRows.length

      // Today's total page views
      todayPageViews = await db.pageView.count({
        where: { createdAt: { gte: todayStart } },
      })

      // All-time unique visitors
      totalVisitors = await db.visitor.count()
    } catch {
      // DB not migrated yet — return zeros (dev fallback)
    }

    // ---- Range-specific series ----
    const series = await getSeries(rangeKey)

    return NextResponse.json({
      range: rangeKey,
      realtime: {
        onlineNow,
        todayVisitors,
        todayPageViews,
        totalVisitors,
        ts: now.toISOString(),
      },
      series,
    })
  } catch (error) {
    console.error('[admin/traffic] Error:', error)
    return NextResponse.json(
      {
        error: 'Gagal memuat data traffic',
        range: rangeKey,
        realtime: { onlineNow: 0, todayVisitors: 0, todayPageViews: 0, totalVisitors: 0, ts: new Date().toISOString() },
        series: [],
      },
      { status: 200 } // 200 so UI doesn't crash — shows empty state
    )
  }
}

/**
 * Compute aggregated time series for the given range.
 * Each point: { label, visitors, pageViews }
 */
async function getSeries(range: 'daily' | 'weekly' | 'monthly') {
  const now = new Date()

  if (range === 'daily') {
    // Last 24 hours, grouped by hour
    const points: Array<{ label: string; visitors: number; pageViews: number; start: Date }> = []
    for (let i = 23; i >= 0; i--) {
      const start = new Date(now.getTime() - i * 60 * 60 * 1000)
      start.setMinutes(0, 0, 0)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const label = start.getHours().toString().padStart(2, '0') + ':00'

      let visitors = 0
      let pageViews = 0
      try {
        const rows = await db.pageView.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { visitorHash: true },
        })
        visitors = new Set(rows.map((r) => r.visitorHash)).size
        pageViews = rows.length
      } catch {
        // ignore
      }
      points.push({ label, visitors, pageViews, start })
    }
    return points
  }

  if (range === 'weekly') {
    // Last 7 days, grouped by day
    const points: Array<{ label: string; visitors: number; pageViews: number; start: Date }> = []
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(now.getDate() - i)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)
      const label = dayNames[start.getDay()] + ', ' + start.getDate().toString().padStart(2, '0')

      let visitors = 0
      let pageViews = 0
      try {
        const rows = await db.pageView.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { visitorHash: true },
        })
        visitors = new Set(rows.map((r) => r.visitorHash)).size
        pageViews = rows.length
      } catch {
        // ignore
      }
      points.push({ label, visitors, pageViews, start })
    }
    return points
  }

  // monthly: last 30 days, grouped by day
  const points: Array<{ label: string; visitors: number; pageViews: number; start: Date }> = []
  for (let i = 29; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(now.getDate() - i)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    const label = start.getDate().toString().padStart(2, '0') + '/' + (start.getMonth() + 1).toString().padStart(2, '0')

    let visitors = 0
    let pageViews = 0
    try {
      const rows = await db.pageView.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { visitorHash: true },
      })
      visitors = new Set(rows.map((r) => r.visitorHash)).size
      pageViews = rows.length
    } catch {
      // ignore
    }
    points.push({ label, visitors, pageViews, start })
  }
  return points
}
