'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, FileCheck, Hash, Award, Landmark, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const defaultInstitutionData = [
  { key: 'nsdt', label: 'NSDT', value: '312456789012', icon: Hash, color: 'bg-emerald-600' },
  { key: 'sk_pendirian', label: 'SK Pendirian', value: 'SK No. 123/Kemenag/1995', icon: FileCheck, color: 'bg-teal-600' },
  { key: 'sk_izin', label: 'SK Izin Operasional', value: 'SK No. 456/Kemenag/2000', icon: Shield, color: 'bg-amber-600' },
  { key: 'yayasan', label: 'Yayasan Pengelola', value: 'Yayasan Miftahul Ulum', icon: Landmark, color: 'bg-emerald-800' },
  { key: 'akreditasi', label: 'Akreditasi', value: 'Terakreditasi A', icon: Award, color: 'bg-amber-700' },
  { key: 'nsm', label: 'NSM', value: '111232010012', icon: Hash, color: 'bg-teal-700' },
  { key: 'alamat', label: 'Alamat', value: 'Jl. Pesantren No. 01, Kec. Cisauk, Kab. Tangerang, Banten', icon: Building2, color: 'bg-emerald-700' },
  { key: 'kepala', label: 'Kepala Madrasah', value: 'Ust. Ahmad Fauzi, S.Pd.I', icon: Building2, color: 'bg-emerald-600' },
]

export default function KelembagaanSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution'],
    queryFn: () => fetch('/api/institution').then(r => r.json()),
  })

  const institutionData = Array.isArray(data) ? data : (data?.data || [])
  const getInstitutionValue = (key: string) => {
    const item = institutionData.find((d: { key: string }) => d.key === key)
    return item?.value || ''
  }

  const displayData = defaultInstitutionData.map(item => ({
    ...item,
    value: getInstitutionValue(item.key) || item.value,
  }))

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Kelembagaan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
        <p className="text-gray-500 mt-3 text-sm">Data resmi lembaga MDTA Miftahul Ulum 01</p>
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
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {displayData.map((item, idx) => {
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
            <h3 className="text-xl font-bold">MDTA Miftahul Ulum 01</h3>
            <p className="text-emerald-200 text-sm">Madrasah Diniyah Takmiliyah Awaliyah</p>
          </div>
          <div className="p-6 bg-amber-50/50">
            <div className="border-2 border-emerald-200 rounded-xl p-6">
              <div className="text-center mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Dokumen Resmi</p>
                <h4 className="text-lg font-bold text-emerald-800 mt-1">Identitas Madrasah</h4>
                <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-2" />
              </div>
              <div className="space-y-3">
                {displayData.map((item) => (
                  <div key={item.key} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-emerald-800 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
