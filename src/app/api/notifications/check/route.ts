import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Returns the latest update timestamp across key content tables.
// Client polls this endpoint; if timestamp > last seen, show notification.
export async function GET() {
  try {
    // Query the most recent updatedAt from each table in parallel
    const [
      latestNews,
      latestAnnouncement,
      latestEvent,
      latestGallery,
      latestAchievement,
      latestDakwah,
      latestProgram,
      latestTeacher,
    ] = await Promise.all([
      db.news.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.announcement.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.event.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.gallery.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.achievement.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.dakwah.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.program.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, title: true } }),
      db.teacher.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true, name: true } }),
    ])

    // Find the most recent update across all tables
    const candidates = [
      latestNews && { type: 'Berita', title: latestNews.title, updatedAt: latestNews.updatedAt },
      latestAnnouncement && { type: 'Pengumuman', title: latestAnnouncement.title, updatedAt: latestAnnouncement.updatedAt },
      latestEvent && { type: 'Kegiatan', title: latestEvent.title, updatedAt: latestEvent.updatedAt },
      latestGallery && { type: 'Galeri', title: latestGallery.title, updatedAt: latestGallery.updatedAt },
      latestAchievement && { type: 'Prestasi', title: latestAchievement.title, updatedAt: latestAchievement.updatedAt },
      latestDakwah && { type: 'Dakwah', title: latestDakwah.title, updatedAt: latestDakwah.updatedAt },
      latestProgram && { type: 'Program', title: latestProgram.title, updatedAt: latestProgram.updatedAt },
      latestTeacher && { type: 'Guru', title: latestTeacher.name, updatedAt: latestTeacher.updatedAt },
    ].filter(Boolean) as { type: string; title: string; updatedAt: Date }[]

    if (candidates.length === 0) {
      return NextResponse.json({
        latestTimestamp: null,
        latestUpdate: null,
        checkedAt: new Date().toISOString(),
      })
    }

    // Pick the latest by updatedAt
    const latest = candidates.reduce((max, c) =>
      c.updatedAt > max.updatedAt ? c : max
    )

    return NextResponse.json({
      latestTimestamp: latest.updatedAt.toISOString(),
      latestUpdate: {
        type: latest.type,
        title: latest.title,
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Notification check error:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek update', latestTimestamp: null },
      { status: 500 }
    )
  }
}
