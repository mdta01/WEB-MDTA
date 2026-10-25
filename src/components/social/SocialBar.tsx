'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Facebook, MessageCircle as WhatsApp, Link2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Array<{ id: string; name: string; content: string; createdAt: string }>>([])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const apiBase = itemType === 'news' ? `/api/news/${itemId}/interactions` : `/api/dakwah/${itemId}/interactions`

  useEffect(() => {
    // Fetch initial interactions
    fetch(apiBase)
      .then(r => r.json())
      .then(data => {
        setLikes(data.likes || 0)
        setComments(data.comments || [])
        setCommentCount((data.comments || []).length)
      })
      .catch(() => {})

    // Check if user already liked
    const sid = getSessionId()
    // We can check via the like status - if the API returns liked status
    // For simplicity, we'll just check on like action
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

  const handleComment = async () => {
    if (!commentName.trim() || !commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          name: commentName,
          content: commentText,
          sessionId: getSessionId(),
        }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => [newComment, ...prev])
        setCommentCount(prev => prev + 1)
        setCommentText('')
        // Don't clear name — user might comment again
      }
    } catch {} finally {
      setSubmitting(false)
    }
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
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
          <span>{likes > 0 ? likes : 'Suka'}</span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f3ef] text-[#404944] hover:bg-[#064e3b]/8 transition-all"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{commentCount > 0 ? commentCount : 'Komentar'}</span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f3ef] text-[#404944] hover:bg-[#064e3b]/8 transition-all ml-auto"
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
            <button onClick={() => setShowShare(false)} className="absolute top-1 right-1 text-[#404944]/50 hover:text-[#003527]">
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

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {/* Comment form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Nama"
                  className="w-24 sm:w-32 px-2.5 py-1.5 text-xs rounded-lg border border-[#e4e2de] bg-[#ffffff] focus:border-[#003527] focus:outline-none"
                  maxLength={100}
                />
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tulis komentar..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#e4e2de] bg-[#ffffff] focus:border-[#003527] focus:outline-none"
                  maxLength={500}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) handleComment() }}
                />
                <button
                  onClick={handleComment}
                  disabled={submitting || !commentName.trim() || !commentText.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#003527] text-white disabled:opacity-30 hover:bg-[#064e3b] transition-colors shrink-0"
                >
                  Kirim
                </button>
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-[#003527]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#003527]">{c.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {/* Comment bubble */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-[#f5f3ef] rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-[#003527]">{c.name}</p>
                          <p className="text-xs text-[#404944] mt-0.5 break-words">{c.content}</p>
                        </div>
                        <p className="text-[10px] text-[#404944]/60 mt-0.5 ml-1">
                          {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#404944]/60 text-center py-2">Belum ada komentar. Jadilah yang pertama!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SocialBar
