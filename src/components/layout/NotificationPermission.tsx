'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  getNotifPermission,
  requestNotifPermission,
  isNotifDismissed,
  dismissNotifPrompt,
  type NotifPermission,
} from '@/lib/notification'

/**
 * Floating notification permission prompt.
 * Shows a small bell button in the bottom-right corner.
 * When clicked, asks browser for notification permission.
 * Once granted, hides itself and the polling hook takes over.
 */
export function NotificationPermission() {
  const [permission, setPermission] = useState<NotifPermission>('default')
  const [dismissed, setDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Sync state on mount + when window refocuses (user may change permission in browser settings)
  useEffect(() => {
    const sync = () => {
      setPermission(getNotifPermission())
      setDismissed(isNotifDismissed())
    }
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])

  // Show floating prompt after 3s delay (don't annoy user immediately)
  useEffect(() => {
    if (permission === 'granted' || permission === 'unsupported') return
    if (dismissed) return
    const timer = setTimeout(() => setShowPrompt(true), 3000)
    return () => clearTimeout(timer)
  }, [permission, dismissed])

  const handleEnable = async () => {
    setRequesting(true)
    const result = await requestNotifPermission()
    setPermission(result)
    setRequesting(false)

    if (result === 'granted') {
      toast.success('Notifikasi diaktifkan!', {
        description: 'Anda akan mendapat notifikasi saat admin memperbarui konten.',
      })
      // Show a test notification so user knows it works
      setTimeout(() => {
        import('@/lib/notification').then(({ showNotification }) => {
          showNotification({
            title: 'Notifikasi Aktif',
            body: 'Anda akan menerima update terbaru dari MDTA Miftahul Ulum 01.',
            tag: 'mdta-test',
          })
        })
      }, 500)
      setShowPrompt(false)
    } else if (result === 'denied') {
      toast.error('Notifikasi diblokir', {
        description: 'Anda dapat mengaktifkannya kembali nanti melalui pengaturan browser.',
      })
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    dismissNotifPrompt()
    setDismissed(true)
    setShowPrompt(false)
  }

  // Don't render anything if permission already granted or unsupported
  if (permission === 'granted' || permission === 'unsupported') {
    return null
  }

  // Don't render if dismissed (but still allow re-showing via bell icon click)
  return (
    <>
      {/* Floating bell button (always visible if not granted) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 200, damping: 15 }}
        onClick={() => setShowPrompt(true)}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 hover:scale-110 transition-all flex items-center justify-center"
        aria-label="Aktifkan notifikasi"
        title="Aktifkan notifikasi"
      >
        <Bell className="h-5 w-5" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
      </motion.button>

      {/* Permission prompt card */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-40 right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-4 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-white/70 hover:text-white"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">Aktifkan Notifikasi</h3>
              </div>
              <p className="text-xs text-emerald-100/90">
                Dapatkan pemberitahuan instan saat ada berita, pengumuman, atau kegiatan baru.
              </p>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Berita &amp; pengumuman terbaru</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Kegiatan &amp; event madrasah</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Prestasi santri &amp; galeri foto</span>
                </li>
              </ul>

              {permission === 'denied' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Notifikasi diblokir di browser. Aktifkan via ikon kunci di address bar → Site settings → Notifications → Allow.
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={requesting || permission === 'denied'}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-sm h-9"
                  size="sm"
                >
                  {requesting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span className="ml-2">Memproses...</span>
                    </>
                  ) : permission === 'denied' ? (
                    <>
                      <BellOff className="h-4 w-4 mr-1" />
                      Diblokir
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-1" />
                      Aktifkan
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 h-9"
                >
                  Nanti
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
