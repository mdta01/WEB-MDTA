'use client'

import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'

export default function LiveAnnouncement() {
  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => fetch('/api/announcements').then(r => r.json()),
    refetchInterval: 60000,
  })

  const announcements = Array.isArray(data) ? data : (data?.announcements || [])

  if (announcements.length === 0) return null

  const announcementText = announcements
    .map((a: { title: string }) => `📢 ${a.title}`)
    .join('  •  ')

  return (
    <div className="bg-emerald-700 text-white py-2 overflow-hidden relative">
      <div className="flex items-center">
        <div className="bg-amber-500 text-emerald-900 px-3 py-1 text-xs font-bold flex items-center gap-1 shrink-0 z-10">
          <Megaphone className="h-3 w-3" />
          INFO
        </div>
        <div className="overflow-hidden flex-1">
          <div className="whitespace-nowrap animate-marquee text-sm">
            {announcementText}  •  {announcementText}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
