'use client'

import { useState } from 'react'
import { MapPin, Crosshair, Loader2, Check, ExternalLink, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GPSLocationSetup() {
  const queryClient = useQueryClient()
  const [detecting, setDetecting] = useState(false)

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(r => r.json()),
  })
  const settings = Array.isArray(settingsData) ? settingsData : (settingsData?.settings || [])
  const getSetting = (key: string) => settings.find((s: { key: string }) => s.key === key)?.value || ''

  // Derive base values from settings, track overrides separately
  const baseLat = getSetting('madrasah_gps_lat') || ''
  const baseLng = getSetting('madrasah_gps_lng') || ''
  const [overrides, setOverrides] = useState<{ lat?: string; lng?: string }>({})
  const lat = overrides.lat !== undefined ? overrides.lat : baseLat
  const lng = overrides.lng !== undefined ? overrides.lng : baseLng
  const hasChanges = (overrides.lat !== undefined && overrides.lat !== baseLat) ||
                     (overrides.lng !== undefined && overrides.lng !== baseLng)

  // Detect current GPS location
  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Browser tidak mendukung GPS')
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = position.coords.latitude.toFixed(6)
        const detectedLng = position.coords.longitude.toFixed(6)
        setOverrides({ lat: detectedLat, lng: detectedLng })
        setDetecting(false)
        toast.success('Lokasi GPS terdeteksi!', {
          description: `Lat: ${detectedLat}, Lng: ${detectedLng}`,
        })
      },
      (error) => {
        setDetecting(false)
        let msg = 'Gagal mendeteksi lokasi'
        if (error.code === 1) msg = 'Akses lokasi ditolak. Izinkan akses GPS di browser.'
        else if (error.code === 2) msg = 'Lokasi tidak tersedia'
        else if (error.code === 3) msg = 'Timeout — coba lagi'
        toast.error(msg)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Save GPS coordinates to settings
  const saveMutation = useMutation({
    mutationFn: async (data: { lat: string; lng: string }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'madrasah_gps_lat', value: data.lat },
            { key: 'madrasah_gps_lng', value: data.lng },
          ],
        }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setOverrides({})
      toast.success('Lokasi GPS berhasil disimpan!', {
        description: 'Lokasi akan otomatis tampil di halaman Kontak & Beranda',
      })
    },
    onError: () => toast.error('Gagal menyimpan lokasi'),
  })

  const handleSave = () => {
    if (!lat || !lng) {
      toast.error('Koordinat belum lengkap')
      return
    }
    saveMutation.mutate({ lat, lng })
  }

  const handleManualChange = (field: 'lat' | 'lng', value: string) => {
    setOverrides(prev => ({ ...prev, [field]: value }))
  }

  // Generate Google Maps URLs
  const hasCoords = lat && lng
  const mapsEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : ''
  const mapsLinkUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : ''

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Lokasi GPS Madrasah
        </CardTitle>
        <p className="text-xs text-gray-500">
          Setup lokasi GPS yang akan otomatis tampil di halaman Kontak dan Beranda.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detect button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={detectLocation}
            disabled={detecting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white flex-1"
          >
            {detecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mendeteksi lokasi...
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 mr-2" />
                Deteksi GPS Otomatis
              </>
            )}
          </Button>
          {hasCoords && (
            <a href={mapsLinkUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full sm:w-auto">
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka di Google Maps
              </Button>
            </a>
          )}
        </div>

        {/* Coordinates input */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Latitude</Label>
            <Input
              value={lat}
              onChange={(e) => handleManualChange('lat', e.target.value)}
              placeholder="-7.123456"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Longitude</Label>
            <Input
              value={lng}
              onChange={(e) => handleManualChange('lng', e.target.value)}
              placeholder="110.123456"
              className="text-sm"
            />
          </div>
        </div>

        {/* Map preview */}
        {hasCoords && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src={mapsEmbedUrl}
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Preview Lokasi GPS"
            />
          </div>
        )}

        {/* Status + Save */}
        <div className="flex items-center justify-between">
          {hasCoords ? (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Lokasi tersimpan: {lat}, {lng}
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              Belum ada lokasi GPS. Klik tombol di atas untuk mendeteksi.
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Simpan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
