'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Facebook, MessageCircle as WhatsApp, Link2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCommentStore } from '@/store/useCommentStore'

interface SocialBarProps {
  itemType: 'news' | 'dakwah'
  itemId: string
  itemTitle: string
}

// Generate or get session ID from localStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('mdta_session_id')
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem('mdta_session_id', sid)
  }
  return sid
}

export function SocialBar({ itemType, itemId, itemTitle }: SocialBarProps) {
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)

  const openCommentPanel = useCommentStore((s) => s.open)

  const apiBase = itemType === 'news' ? `/api/news/${itemId}/interactions` : `/api/dakwah/${itemId}/interactions`

  useEffect(() => {
    // Fetch initial interactions (likes + comment count only — comments list loaded on panel open)
    fetch(apiBase)
      .then(r => r.json())
      .then(data => {
        setLikes(data.likes || 0)
        setCommentCount((data.comments || []).length)
      })
      .catch(() => {})
  }, [apiBase])

  const handleLike = async () => {
    const sid = getSessionId()
    if (!sid) return

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', sessionId: sid }),
      })
      const data = await res.json()
      if (res.ok) {
        setLiked(data.liked)
        setLikes(data.likes)
      }
    } catch {}
  }

  // Open the floating comment panel (instead of inline comment section)
  const handleCommentClick = () => {
    openCommentPanel(itemType, itemId, itemTitle)
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin + `/?page=${itemType === 'news' ? 'berita' : 'dakwah'}` : ''

    // Try Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: itemTitle, url })
        return
      } catch {}
    }

    // Fallback — show share options
    setShowShare(true)
  }

  const copyUrl = () => {
    const url = typeof window !== 'undefined' ? window.location.origin + `/?page=${itemType === 'news' ? 'berita' : 'dakwah'}` : ''
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + `/?page=${itemType === 'news' ? 'berita' : 'dakwah'}` : ''
  const waUrl = `https://wa.me/?text=${encodeURIComponent(itemTitle + ' ' + shareUrl)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

  return (
    <div className="relative">
      {/* Action bar */}
      <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-3 border-t border-[#e4e2de]">
        {/* Like button */}
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            liked
              ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
              : 'bg-[#f5f3ef] text-[#404944] hover:bg-[#064e3b]/8'
          }`}
          aria-pressed={liked}
          aria-label={liked ? 'Hapus suka' : 'Suka'}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
          <span>{likes > 0 ? likes : 'Suka'}</span>
        </button>

        {/* Comment button — opens floating panel */}
        <button
          onClick={handleCommentClick}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f3ef] text-[#404944] hover:bg-[#064e3b]/8 transition-all"
          aria-label={`Lihat ${commentCount} komentar`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{commentCount > 0 ? commentCount : 'Komentar'}</span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f3ef] text-[#404944] hover:bg-[#064e3b]/8 transition-all ml-auto"
          aria-label="Bagikan"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bagikan</span>
        </button>
      </div>

      {/* Share options dropdown */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full right-0 mb-2 bg-[#ffffff] rounded-xl shadow-premium-lg border border-[#e4e2de] p-2 z-20 min-w-[180px]"
          >
            <button onClick={() => setShowShare(false)} className="absolute top-1 right-1 text-[#404944]/50 hover:text-[#003527]" aria-label="Tutup">
              <X className="h-3 w-3" />
            </button>
            <div className="space-y-1 pt-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f5f3ef] text-xs text-[#404944] transition-colors">
                <WhatsApp className="h-4 w-4 text-[#064e3b]" /> WhatsApp
              </a>
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f5f3ef] text-xs text-[#404944] transition-colors">
                <Facebook className="h-4 w-4 text-[#003527]" /> Facebook
              </a>
              <button onClick={copyUrl} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f5f3ef] text-xs text-[#404944] transition-colors">
                <Link2 className="h-4 w-4 text-[#895033]" /> {copied ? 'Tersalin!' : 'Salin Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SocialBar
