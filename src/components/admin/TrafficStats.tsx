'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, Eye, MousePointerClick, TrendingUp, Activity,
  Calendar, Clock, RefreshCw, Database,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

type Range = 'daily' | 'weekly' | 'monthly'

interface TrafficData {
  range: Range
  realtime: {
    onlineNow: number
    todayVisitors: number
    todayPageViews: number
    totalVisitors: number
    ts: string
  }
  series: Array<{
    label: string
    visitors: number
    pageViews: number
  }>
}

/**
 * TrafficStats — Realtime visitor analytics widget for admin dashboard.
 *
 * Features:
 * — Live "online now" indicator with auto-refresh every 30s
 * — Range filter: Daily (24h) / Weekly (7d) / Monthly (30d)
 * — Area chart for visitors (smooth trend)
 * — Bar chart for page views (discrete counts)
 * — Summary stat cards (today's visitors, page views, total visitors)
 * — Responsive: stacks to single column on mobile, 2-col on desktop
 * — Empty state when no data yet (e.g., new deployment)
 */
export default function TrafficStats() {
  const [range, setRange] = useState<Range>('daily')
  const [isLive, setIsLive] = useState(true)
  const queryClient = useQueryClient()

  // Fetch traffic data — refetches when range changes
  const { data, isLoading, refetch, isFetching } = useQuery<TrafficData>({
    queryKey: ['admin', 'traffic', range],
    queryFn: async () => {
      const res = await fetch(`/api/admin/traffic?range=${range}`)
      if (!res.ok) throw new Error('Gagal memuat data traffic')
      return res.json()
    },
    refetchInterval: isLive ? 30000 : false, // 30s refresh when live
  })

  // Migrate DB mutation — runs `prisma db push` server-side
  const migrateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/migrate-db', { method: 'POST' })
      const data = await res.json()
      if (!res.ok && !data?.success) {
        throw new Error(data?.error || 'Gagal migrate database')
      }
      return data
    },
    onSuccess: (data) => {
      toast.success('Database berhasil di-migrate!', {
        description: 'Tabel Visitor & PageView sudah dibuat. Data traffic akan mulai terkumpul.',
        duration: 6000,
      })
      // Refetch traffic data after migration
      queryClient.invalidateQueries({ queryKey: ['admin', 'traffic'] })
      // Show output in console for debugging
      if (data.output) console.log('[migrate-db]', data.output)
    },
    onError: (error: Error & { hint?: string }) => {
      const hint = (error as { hint?: string }).hint
      toast.error('Migrate database gagal', {
        description: hint || error.message,
        duration: 10000,
      })
      console.error('[migrate-db] error:', error)
    },
  })

  // Compute peak/min for context (cheap operation, no memo needed)
  const series = data?.series || []
  const stats = (() => {
    if (series.length === 0) {
      return { peak: 0, peakLabel: '-', avg: 0, total: 0 }
    }
    const visitors = series.map((p) => p.visitors)
    const peak = Math.max(...visitors)
    const peakIdx = visitors.indexOf(peak)
    const peakLabel = series[peakIdx]?.label || '-'
    const total = visitors.reduce((s, v) => s + v, 0)
    const avg = Math.round(total / visitors.length)
    return { peak, peakLabel, avg, total }
  })()

  const realtime = data?.realtime

  return (
    <div className="space-y-4">
      {/* Header row — title + live indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #003527, #064e3b)' }}>
            <TrendingUp className="h-5 w-5 text-[#cca72f]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1b1c1a]">Traffic Pengunjung</h2>
            <p className="text-xs text-[#404944]">Statistik kunjungan situs secara realtime</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Migrate DB button — creates Visitor & PageView tables */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending}
            className="h-8 px-2.5 text-xs border-[#cca72f]/30 text-[#895033] hover:bg-[#cca72f]/10 hover:border-[#cca72f]/50"
            title="Buat tabel Visitor & PageView di database production (prisma db push)"
          >
            {migrateMutation.isPending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5 mr-1.5" />
                Migrate DB
              </>
            )}
          </Button>

          {/* Live toggle */}
          <button
            onClick={() => setIsLive((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e4e2de] bg-white text-xs font-medium hover:bg-[#f5f3ef] transition-colors"
            title={isLive ? 'Auto-refresh aktif (30s)' : 'Auto-refresh nonaktif'}
          >
            <span className="relative flex h-2 w-2">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#064e3b] opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-[#064e3b]' : 'bg-[#404944]/40'}`} />
            </span>
            <span className={isLive ? 'text-[#003527]' : 'text-[#404944]'}>
              {isLive ? 'Live' : 'Paused'}
            </span>
          </button>

          {/* Manual refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2"
            title="Refresh data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Realtime stat cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <RealtimeCard
          title="Online Sekarang"
          value={realtime?.onlineNow ?? 0}
          icon={<Activity className="h-5 w-5 text-white" />}
          color="linear-gradient(to bottom right, #064e3b, #003527)"
          subtitle="5 menit terakhir"
          pulse
          delay={0}
        />
        <RealtimeCard
          title="Pengunjung Hari Ini"
          value={realtime?.todayVisitors ?? 0}
          icon={<Users className="h-5 w-5 text-white" />}
          color="from-[#003527] to-[#064e3b]"
          subtitle="Sejak 00:00"
          delay={0.05}
        />
        <RealtimeCard
          title="Total Page Views"
          value={realtime?.todayPageViews ?? 0}
          icon={<MousePointerClick className="h-5 w-5 text-white" />}
          color="from-[#895033] to-[#a06643]"
          subtitle="Hari ini"
          delay={0.1}
        />
        <RealtimeCard
          title="Total Pengunjung"
          value={realtime?.totalVisitors ?? 0}
          icon={<Eye className="h-5 w-5 text-white" />}
          color="from-[#cca72f] to-[#d4b547]"
          subtitle="Sepanjang waktu"
          delay={0.15}
        />
      </div>

      {/* Chart card with filter */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-[#1b1c1a]">
                Grafik Kunjungan
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-normal text-[#404944] border-[#e4e2de]">
                {range === 'daily' && '24 jam terakhir'}
                {range === 'weekly' && '7 hari terakhir'}
                {range === 'monthly' && '30 hari terakhir'}
              </Badge>
            </div>

            {/* Range filter */}
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v as Range)}
              className="rounded-lg border border-[#e4e2de] bg-[#f5f3ef] p-0.5"
            >
              <ToggleGroupItem
                value="daily"
                className="text-xs h-7 px-3 data-[state=on]:bg-[#003527] data-[state=on]:text-white rounded-md transition-colors"
              >
                <Clock className="h-3 w-3 mr-1" />
                Harian
              </ToggleGroupItem>
              <ToggleGroupItem
                value="weekly"
                className="text-xs h-7 px-3 data-[state=on]:bg-[#003527] data-[state=on]:text-white rounded-md transition-colors"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Mingguan
              </ToggleGroupItem>
              <ToggleGroupItem
                value="monthly"
                className="text-xs h-7 px-3 data-[state=on]:bg-[#003527] data-[state=on]:text-white rounded-md transition-colors"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Bulanan
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading ? (
            <ChartSkeleton />
          ) : !data?.series || data.series.length === 0 ? (
            <EmptyState
              onMigrate={() => migrateMutation.mutate()}
              migrating={migrateMutation.isPending}
            />
          ) : (
            <div className="space-y-4">
              {/* Visitors Area Chart */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#003527] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#003527]" />
                    Pengunjung Unik
                  </p>
                  <div className="flex gap-3 text-[10px] text-[#404944]">
                    <span>Peak: <span className="font-bold text-[#003527]">{stats.peak}</span> ({stats.peakLabel})</span>
                    <span>Avg: <span className="font-bold text-[#003527]">{stats.avg}</span></span>
                    <span>Total: <span className="font-bold text-[#003527]">{stats.total}</span></span>
                  </div>
                </div>
                <div className="h-[180px] sm:h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#003527" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#003527" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e2de" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#404944' }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#404944' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#003527"
                        strokeWidth={2}
                        fill="url(#visitorsGradient)"
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Page Views Bar Chart */}
              <div className="w-full">
                <p className="text-xs font-semibold text-[#895033] flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#cca72f]" />
                  Page Views
                </p>
                <div className="h-[120px] sm:h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e2de" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#404944' }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#404944' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="pageViews"
                        fill="#cca72f"
                        radius={[4, 4, 0, 0]}
                        animationDuration={500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Sub-components =====

interface RealtimeCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string // gradient classes "from-x to-y"
  subtitle?: string
  pulse?: boolean
  delay?: number
}

function RealtimeCard({ title, value, icon, color, subtitle, pulse, delay = 0 }: RealtimeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-[#404944] truncate">{title}</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1b1c1a] mt-1 leading-none">
                {value.toLocaleString('id-ID')}
              </p>
              {subtitle && (
                <p className="text-[9px] sm:text-[10px] text-[#404944]/70 mt-1 truncate">{subtitle}</p>
              )}
            </div>
            <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              {pulse && (
                <span className="absolute inset-0 rounded-xl bg-white/20 animate-ping" />
              )}
              <div className="relative">{icon}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[180px] sm:h-[220px] w-full bg-gradient-to-br from-[#f5f3ef] to-[#efeeea] rounded-lg animate-pulse" />
      <div className="h-[120px] sm:h-[140px] w-full bg-gradient-to-br from-[#f5f3ef] to-[#efeeea] rounded-lg animate-pulse" />
    </div>
  )
}

function EmptyState({ onMigrate, migrating }: { onMigrate: () => void; migrating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#003527]/8 flex items-center justify-center mb-3">
        <Activity className="h-7 w-7 text-[#003527]/40" />
      </div>
      <p className="text-sm font-semibold text-[#1b1c1a]">Belum ada data traffic</p>
      <p className="text-xs text-[#404944] mt-1 max-w-sm">
        Data pengunjung akan muncul setelah tabel Visitor & PageView dibuat di database.
        Klik tombol di bawah untuk migrate schema.
      </p>
      <Button
        onClick={onMigrate}
        disabled={migrating}
        className="mt-4 bg-[#003527] hover:bg-[#064e3b] text-white h-9"
      >
        {migrating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Sedang migrate...
          </>
        ) : (
          <>
            <Database className="h-4 w-4 mr-2" />
            Migrate Database
          </>
        )}
      </Button>
    </div>
  )
}

// Custom tooltip — Kraton themed
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white rounded-lg shadow-premium-lg border border-[#e4e2de] p-2.5 text-xs">
      <p className="font-semibold text-[#003527] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[#404944]">
            {p.name === 'visitors' ? 'Pengunjung' : 'Page Views'}:
          </span>
          <span className="font-bold text-[#1b1c1a]">{p.value.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  )
}
