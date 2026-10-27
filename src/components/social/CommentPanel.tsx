'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X, Send, MessageCircle, AlertCircle, CornerUpLeft } from 'lucide-react'
import { useCommentStore } from '@/store/useCommentStore'

/**
 * Floating comment panel — slides up from the bottom (mobile) or
 * anchored to the right side (desktop), like Facebook's comment drawer.
 *
 * Behavior:
 * — Only ONE panel exists app-wide (managed by useCommentStore)
 * — Backdrop click or X button closes
 * — Drag down to dismiss (mobile only)
 * — Comments list scrolls internally; input is sticky at bottom
 * — Supports reply (parentId) — click "Balas" on a comment to enter reply mode
 */

interface Comment {
  id: string
  name: string
  content: string
  createdAt: string
  parentId?: string | null
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

// Format relative time in Indonesian
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHour < 24) return `${diffHour} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Get first letter of name for avatar
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

// Get deterministic color from name for avatar background
function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#003527] text-white',
    'bg-[#064e3b] text-white',
    'bg-[#895033] text-white',
    'bg-[#cca72f] text-[#4e3d00]',
    'bg-[#064e3b]/80 text-white',
    'bg-[#003527]/80 text-white',
  ]
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function CommentPanel() {
  const { isOpen, itemType, itemId, itemTitle, replyTo, close, setReplyTo } = useCommentStore()

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  // Fetch comments when panel opens for a specific item
  const fetchComments = useCallback(async () => {
    if (!itemType || !itemId) return
    setLoading(true)
    setError(null)
    try {
      const apiBase =
        itemType === 'news'
          ? `/api/news/${itemId}/interactions`
          : `/api/dakwah/${itemId}/interactions`
      const res = await fetch(apiBase)
      if (!res.ok) throw new Error('Gagal memuat komentar')
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      setError('Tidak dapat memuat komentar. Periksa koneksi internet Anda.')
    } finally {
      setLoading(false)
    }
  }, [itemType, itemId])

  useEffect(() => {
    if (isOpen && itemType && itemId) {
      fetchComments()
      // Load saved name from localStorage
      const savedName = localStorage.getItem('mdta_comment_name')
      if (savedName) setName(savedName)
    }
  }, [isOpen, itemType, itemId, fetchComments])

  // Auto-focus input when panel opens (after slight delay for animation)
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        if (!name) nameRef.current?.focus()
        else inputRef.current?.focus()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [isOpen, name])

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !itemType || !itemId) return
    setSubmitting(true)
    setError(null)

    try {
      const apiBase =
        itemType === 'news'
          ? `/api/news/${itemId}/interactions`
          : `/api/dakwah/${itemId}/interactions`
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          name: name.trim(),
          content: text.trim(),
          sessionId: getSessionId(),
          parentId: replyTo?.id || null,
        }),
      })
      if (!res.ok) throw new Error('Gagal mengirim komentar')
      const newComment: Comment = await res.json()

      // Save name for next time
      localStorage.setItem('mdta_comment_name', name.trim())

      setComments((prev) => [newComment, ...prev])
      setText('')
      setReplyTo(null)
      // Keep focus on input for fast successive comments
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch {
      setError('Gagal mengirim komentar. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Organize comments: top-level + their replies nested
  const topLevel = comments.filter((c) => !c.parentId)
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId)

  // Reset reply target when panel closes
  useEffect(() => {
    if (!isOpen) {
      setReplyTo(null)
      setText('')
      setError(null)
    }
  }, [isOpen, setReplyTo])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — click outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          {/* Panel — slides up from bottom on mobile; centered-right on desktop */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              // Dismiss if dragged down more than 100px
              if (info.offset.y > 100) close()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed z-[90] inset-x-0 bottom-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[28rem] lg:w-[32rem]
                       bg-[#fbf9f5] sm:bg-[#fbf9f5] rounded-t-3xl sm:rounded-none
                       shadow-2xl border-t sm:border-t-0 sm:border-l border-[#e4e2de]
                       flex flex-col
                       h-[85vh] sm:h-full sm:max-h-screen"
            role="dialog"
            aria-modal="true"
            aria-label={`Komentar untuk ${itemTitle}`}
          >
            {/* Drag handle (mobile only) — visual cue + draggable area */}
            <div
              className="sm:hidden pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1.5 rounded-full bg-[#404944]/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e4e2de] bg-[#fbf9f5] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#003527] flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-[#cca72f]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#003527] truncate">Komentar</h3>
                  <p className="text-[10px] text-[#404944]/70 truncate" title={itemTitle}>
                    {itemTitle || 'Konten'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Tutup panel komentar"
                className="w-8 h-8 rounded-full hover:bg-[#f5f3ef] flex items-center justify-center text-[#404944] hover:text-[#003527] transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Comments list — scrollable */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 sm:px-5 py-4"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-[#003527] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#404944]/70">Memuat komentar...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <AlertCircle className="h-8 w-8 text-[#ba1a1a]" />
                  <p className="text-xs text-[#404944]">{error}</p>
                  <button
                    onClick={fetchComments}
                    className="text-xs font-semibold text-[#003527] hover:underline"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : topLevel.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#003527]/8 flex items-center justify-center mb-3">
                    <MessageCircle className="h-7 w-7 text-[#003527]/50" />
                  </div>
                  <p className="text-sm font-semibold text-[#003527]">Belum ada komentar</p>
                  <p className="text-xs text-[#404944]/70 mt-1">
                    Jadilah yang pertama berkomentar di konten ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLevel.map((c) => {
                    const replies = getReplies(c.id)
                    return (
                      <div key={c.id} className="space-y-2">
                        {/* Top-level comment */}
                        <CommentItem
                          comment={c}
                          onReply={() => {
                            setReplyTo({ id: c.id, name: c.name })
                            setTimeout(() => inputRef.current?.focus(), 50)
                          }}
                        />

                        {/* Replies (indented) */}
                        {replies.length > 0 && (
                          <div className="ml-10 space-y-2">
                            {replies.map((r) => (
                              <CommentItem
                                key={r.id}
                                comment={r}
                                isReply
                                onReply={() => {
                                  setReplyTo({ id: c.id, name: r.name })
                                  setTimeout(() => inputRef.current?.focus(), 50)
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Reply indicator — appears above input when replying */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 sm:px-5 py-2 bg-[#f5f3ef] border-t border-[#e4e2de] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 text-xs">
                    <CornerUpLeft className="h-3.5 w-3.5 text-[#003527] shrink-0" />
                    <span className="text-[#404944] truncate">
                      Membalas <span className="font-semibold text-[#003527]">{replyTo.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    aria-label="Batal balas"
                    className="text-[#404944]/60 hover:text-[#003527] shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area — sticky at bottom */}
            <div className="px-4 sm:px-5 py-3 border-t border-[#e4e2de] bg-[#fbf9f5] shrink-0">
              {error && !loading && (
                <p className="text-[10px] text-[#ba1a1a] mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}

              {/* Name input — only show if not saved */}
              {!name && (
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  maxLength={100}
                  className="w-full px-3 py-2 mb-2 text-xs rounded-lg border border-[#e4e2de] bg-[#ffffff] focus:border-[#003527] focus:outline-none focus:ring-1 focus:ring-[#003527]/20"
                />
              )}

              {/* Comment input + send button */}
              <div className="flex items-end gap-2">
                {/* Avatar (only show if name is set) */}
                {name && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${getAvatarColor(name)}`}
                  >
                    {getInitial(name)}
                  </div>
                )}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={replyTo ? `Balas ${replyTo.name}...` : 'Tulis komentar...'}
                    maxLength={1000}
                    rows={1}
                    className="w-full px-3 py-2 pr-10 text-xs rounded-2xl border border-[#e4e2de] bg-[#ffffff] focus:border-[#003527] focus:outline-none focus:ring-1 focus:ring-[#003527]/20 resize-none max-h-24"
                    style={{ minHeight: '36px' }}
                  />
                  {/* Character counter (when typing) */}
                  {text.length > 800 && (
                    <span className="absolute -top-5 right-1 text-[10px] text-[#404944]/60">
                      {1000 - text.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !text.trim()}
                  aria-label="Kirim komentar"
                  className="w-9 h-9 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Helper text */}
              <p className="text-[10px] text-[#404944]/50 mt-1.5 hidden sm:block">
                Tekan <kbd className="px-1 py-0.5 bg-[#f5f3ef] rounded text-[9px] border border-[#e4e2de]">Enter</kbd> untuk kirim,
                <kbd className="px-1 py-0.5 ml-1 bg-[#f5f3ef] rounded text-[9px] border border-[#e4e2de]">Shift+Enter</kbd> untuk baris baru
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ===== Single comment item =====
function CommentItem({
  comment,
  isReply = false,
  onReply,
}: {
  comment: Comment
  isReply?: boolean
  onReply: () => void
}) {
  return (
    <div className="flex gap-2.5">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${getAvatarColor(comment.name)} ${isReply ? 'w-7 h-7' : ''}`}
      >
        {getInitial(comment.name)}
      </div>

      {/* Comment body */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#ffffff] rounded-2xl px-3 py-2 border border-[#e4e2de]/60">
          <p className="text-xs font-semibold text-[#003527]">{comment.name}</p>
          <p className="text-xs text-[#1b1c1a] mt-0.5 break-words whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Action row: timestamp + reply */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="text-[10px] text-[#404944]/60">
            {formatRelativeTime(comment.createdAt)}
          </span>
          <button
            onClick={onReply}
            className="text-[10px] font-semibold text-[#003527]/70 hover:text-[#003527] transition-colors"
          >
            Balas
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommentPanel
