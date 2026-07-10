'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, FileCheck, Hash, Award, Landmark, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const defaultInstitutionData = [
  { key: 'nsdt', label: 'NSDT', settingKey: 'madrasah_nsdt', icon: Hash, color: 'bg-emerald-600' },
  { key: 'sk_pendirian', label: 'SK Pendirian', settingKey: 'madrasah_sk', icon: FileCheck, color: 'bg-teal-600' },
  { key: 'sk_izin', label: 'SK Izin Operasional', settingKey: 'madrasah_izin', icon: Shield, color: 'bg-amber-600' },
  { key: 'yayasan', label: 'Yayasan Pengelola', settingKey: 'madrasah_yayasan', icon: Landmark, color: 'bg-emerald-800' },
  { key: 'akreditasi', label: 'Akreditasi', settingKey: 'madrasah_akreditasi', icon: Award, color: 'bg-amber-700' },
  { key: 'nsm', label: 'NSM', settingKey: 'madrasah_nsdt', icon: Hash, color: 'bg-teal-700' },
  { key: 'alamat', label: 'Alamat', settingKey: 'madrasah_address', icon: Building2, color: 'bg-emerald-700' },
  { key: 'kepala', label: 'Kepala Madrasah', settingKey: 'madrasah_principals_name', icon: Building2, color: 'bg-emerald-600' },
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Kelembagaan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Data resmi lembaga {madrasahName}</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-6 border-0">
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
        <Card className="p-8 text-center border-0">
          <Building2 className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">Data kelembagaan belum tersedia</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {displayData.filter(item => item.value).map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow group">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
                      <p className="font-semibold text-emerald-800 mt-1">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Official Document Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 p-6 text-white text-center">
            <Building2 className="h-12 w-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold">{madrasahName}</h3>
            <p className="text-emerald-200 text-sm">{madrasahSubtitle}</p>
          </div>
          {!allValuesEmpty ? (
            <div className="p-6 bg-amber-50/50">
              <div className="border-2 border-emerald-200 rounded-xl p-6">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Dokumen Resmi</p>
                  <h4 className="text-lg font-bold text-emerald-800 mt-1">Identitas Madrasah</h4>
                  <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-2" />
                </div>
                <div className="space-y-3">
                  {displayData.filter(item => item.value).map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium text-emerald-800 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50/50">
              <div className="border-2 border-emerald-200 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Data identitas madrasah belum tersedia</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
