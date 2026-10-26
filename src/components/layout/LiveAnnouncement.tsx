'use client'

import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

  // Calculate animation duration based on text length
  // ~15px per char average, speed = 60px/s (faster than before)
  // Min 10s, max 40s
  const textWidth = announcementText.length * 7 // approximate px width
  const speed = 80 // px per second
  const duration = Math.max(Math.min(textWidth / speed, 40), 10)

  return (
    <div className="bg-[#003527] text-white py-2 overflow-hidden relative">
      <div className="flex items-center">
        <div className="bg-[#cca72f] text-[#003527] px-3 py-1 text-xs font-bold flex items-center gap-1 shrink-0 z-10">
          <Megaphone className="h-3 w-3" />
          INFO
        </div>
        <div className="overflow-hidden flex-1">
          {/* Marquee — text duplicated 2x, translateX from 0 to -100% of one copy
              so text scrolls fully before repeating. Duration scales with text length. */}
          <div
            className="whitespace-nowrap text-sm inline-block"
            style={{
              animation: `marquee-scroll ${duration}s linear infinite`,
              paddingLeft: '1rem',
            }}
          >
            <span>{announcementText}</span>
            {/* Separator gap before duplicate */}
            <span className="px-8">•</span>
            <span>{announcementText}</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
