'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, FileCheck, Hash, Award, Landmark, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { KratonSectionHeader, KratonDivider } from '@/components/kraton'

// Kraton palette mapping (replacing old emerald/teal/amber Tailwind colors):
//  - emerald-600  → #064e3b (primary container)
//  - emerald-700  → #003527 (primary)
//  - emerald-800  → #003527 (primary)
//  - teal-600/700 → #064e3b (use emerald container for visual variety)
//  - amber-600/700 → #895033 (secondary teak wood)
const defaultInstitutionData = [
  { key: 'nsdt', label: 'NSDT', settingKey: 'madrasah_nsdt', icon: Hash, color: 'bg-gradient-to-br from-[#003527] to-[#064e3b]' },
  { key: 'sk_pendirian', label: 'SK Pendirian', settingKey: 'madrasah_sk', icon: FileCheck, color: 'bg-gradient-to-br from-[#064e3b] to-[#003527]' },
  { key: 'sk_izin', label: 'SK Izin Operasional', settingKey: 'madrasah_izin', icon: Shield, color: 'bg-gradient-to-br from-[#895033] to-[#a86644]' },
  { key: 'yayasan', label: 'Yayasan Pengelola', settingKey: 'madrasah_yayasan', icon: Landmark, color: 'bg-gradient-to-br from-[#003527] to-[#064e3b]' },
  { key: 'akreditasi', label: 'Akreditasi', settingKey: 'madrasah_akreditasi', icon: Award, color: 'bg-gradient-to-br from-[#cca72f] to-[#895033]' },
  { key: 'nsm', label: 'NSM', settingKey: 'madrasah_nsdt', icon: Hash, color: 'bg-gradient-to-br from-[#064e3b] to-[#003527]' },
  { key: 'alamat', label: 'Alamat', settingKey: 'madrasah_address', icon: Building2, color: 'bg-gradient-to-br from-[#003527] to-[#064e3b]' },
  { key: 'kepala', label: 'Kepala Madrasah', settingKey: 'madrasah_principals_name', icon: Building2, color: 'bg-gradient-to-br from-[#895033] to-[#003527]' },
]

export default function KelembagaanSection() {
  const { data: institutionResponse, isLoading: institutionLoading } = useQuery({
    queryKey: ['institution'],
    queryFn: () => fetch('/api/institution').then(r => r.json()),
  })

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })

  const institutionData = Array.isArray(institutionResponse) ? institutionResponse : (institutionResponse?.data || [])
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])

  const getInstitutionValue = (key: string) => {
    const item = institutionData.find((d: { key: string }) => d.key === key)
    return item?.value || ''
  }

  const getSetting = (key: string) => {
    const s = settings.find((item: { key: string }) => item.key === key)
    return s?.value || ''
  }

  const displayData = defaultInstitutionData.map(item => ({
    ...item,
    value: getInstitutionValue(item.key) || getSetting(item.settingKey),
  }))

  const madrasahName = getSetting('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const madrasahSubtitle = getSetting('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'

  const allValuesEmpty = displayData.every(item => !item.value)

  const isLoading = institutionLoading || settingsLoading

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <KratonSectionHeader
        badge="Profil Lembaga"
        title="Kelembagaan"
        subtitle={`Data resmi lembaga ${madrasahName}`}
        align="center"
      />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 border-[#e4e2de] bg-[#ffffff] rounded-2xl">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : allValuesEmpty ? (
        <Card className="p-8 text-center border-[#e4e2de] bg-[#ffffff] wood-carved-shadow rounded-2xl">
          <Building2 className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944] font-body">Data kelembagaan belum tersedia</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {displayData.filter(item => item.value).map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
              >
                <Card className="border-[#e4e2de] bg-[#ffffff] wood-carved-shadow card-hover group rounded-2xl relative overflow-hidden">
                  {/* Top gold accent bar (appears on hover) */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#cca72f] via-[#ffe088] to-[#cca72f] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#404944]/70 uppercase tracking-wider font-semibold font-body">{item.label}</p>
                      <p className="font-semibold text-[#003527] mt-1 font-display">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Official Document Style — Kraton parchment certificate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-[#e4e2de] bg-[#ffffff] wood-carved-shadow overflow-hidden rounded-2xl">
          {/* Header — deep emerald gradient with kraton pattern */}
          <div className="bg-gradient-to-r from-[#003527] to-[#064e3b] p-6 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 kraton-pattern opacity-[0.06] pointer-events-none" aria-hidden />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-[#cca72f]/15 flex items-center justify-center mx-auto mb-3 ring-2 ring-[#cca72f]/30">
                <Building2 className="h-7 w-7 text-[#ffe088]" />
              </div>
              <h3 className="text-xl font-bold font-display">{madrasahName}</h3>
              <p className="text-[#b0f0d6] text-sm font-body">{madrasahSubtitle}</p>
            </div>
          </div>
          {!allValuesEmpty ? (
            <div className="p-6 bg-[#fbf9f5]">
              <div className="border-2 border-[#cca72f]/40 rounded-xl p-6 bg-[#ffffff] relative">
                {/* Corner ornaments */}
                <span className="absolute top-2 left-2 h-2 w-2 rotate-45 bg-[#cca72f]/40" aria-hidden />
                <span className="absolute top-2 right-2 h-2 w-2 rotate-45 bg-[#cca72f]/40" aria-hidden />
                <span className="absolute bottom-2 left-2 h-2 w-2 rotate-45 bg-[#cca72f]/40" aria-hidden />
                <span className="absolute bottom-2 right-2 h-2 w-2 rotate-45 bg-[#cca72f]/40" aria-hidden />

                <div className="text-center mb-4">
                  <p className="text-xs text-[#404944]/70 uppercase tracking-widest font-body">Dokumen Resmi</p>
                  <h4 className="text-lg font-bold text-[#003527] mt-1 font-display">Identitas Madrasah</h4>
                  <KratonDivider variant="minimal" align="center" className="mt-2" />
                </div>
                <div className="space-y-3">
                  {displayData.filter(item => item.value).map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-2 border-b border-dashed border-[#e4e2de] last:border-0">
                      <span className="text-sm text-[#404944] font-body">{item.label}</span>
                      <span className="text-sm font-medium text-[#003527] text-right font-body">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[#fbf9f5]">
              <div className="border-2 border-[#cca72f]/40 rounded-xl p-6 text-center">
                <p className="text-[#404944]/70 text-sm font-body">Data identitas madrasah belum tersedia</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
