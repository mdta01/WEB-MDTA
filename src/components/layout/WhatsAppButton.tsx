'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageCircle, X, GraduationCap, FileText, CreditCard, AlertCircle, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const serviceOptions = [
  { icon: GraduationCap, label: 'Informasi PPDB', message: 'Assalamualaikum, saya ingin bertanya tentang Informasi PPDB (Pendaftaran Santri Baru) di MDTA Miftahul Ulum 01.' },
  { icon: FileText, label: 'Administrasi', message: 'Assalamualaikum, saya ingin bertanya tentang Administrasi di MDTA Miftahul Ulum 01.' },
  { icon: CreditCard, label: 'Pembayaran', message: 'Assalamualaikum, saya ingin bertanya tentang Pembayaran/Syahriyah di MDTA Miftahul Ulum 01.' },
  { icon: AlertCircle, label: 'Pengaduan', message: 'Assalamualaikum, saya ingin menyampaikan pengaduan terkait MDTA Miftahul Ulum 01.' },
  { icon: HelpCircle, label: 'Layanan Lainnya', message: 'Assalamualaikum, saya ingin bertanya seputar MDTA Miftahul Ulum 01.' },
]

export default function WhatsAppButton() {
  const [showMenu, setShowMenu] = useState(false)
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  const phoneNumber = getSetting('madrasah_whatsapp_number') || '6281234567890'
  const defaultMessage = getSetting('madrasah_whatsapp_message') || 'Assalamualaikum, saya ingin bertanya tentang MDTA Miftahul Ulum 01'

  const buildWaUrl = (message: string) => {
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  }

  const handleServiceClick = (message: string) => {
    window.open(buildWaUrl(message), '_blank', 'noopener noreferrer')
    setShowMenu(false)
  }

  return (
    <>
      {/* Service Menu Popup */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Menu Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 right-6 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white relative">
                <button
                  onClick={() => setShowMenu(false)}
                  className="absolute top-3 right-3 text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <div>
                    <p className="font-bold text-sm">Hubungi Kami</p>
                    <p className="text-xs text-green-100">Pilih layanan yang Anda butuhkan</p>
                  </div>
                </div>
              </div>
              {/* Options */}
              <div className="py-2">
                {serviceOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleServiceClick(opt.message)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                        <Icon className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                <p className="text-[10px] text-gray-400">MDTA Miftahul Ulum 01</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        aria-label="Hubungi via WhatsApp"
      >
        {showMenu ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        {!showMenu && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </motion.button>
    </>
  )
}
