'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Users, CheckCircle2, ChevronRight, ChevronLeft,
  Send, Loader2, UserCheck,
  Home, Phone, School, MapPin, Calendar,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RippleButton } from '@/components/ui/ripple-button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  STEPS, ProgressIndicator, StepHeader, Field,
  PreviewSection, PreviewRow,
  formatDate, formatGender,
} from './PPDBFormParts'

/**
 * PPDBRegistrationForm — Multi-step registration form (3 steps).
 *
 * Steps:
 *  1. Data Diri Santri (name, nickname, gender, birth, address, previous school)
 *  2. Data Orang Tua/Wali (father, mother, phone, address)
 *  3. Konfirmasi & Submit (live preview + checkbox + submit)
 *
 * Berkas persyaratan (KK, Akta, Pas Foto) tidak lagi diunggah melalui
 * form — calon santri menyerahkan berkas secara offline ke panitia.
 * PPDBFileUpload.tsx tetap dipertahankan untuk penggunaan mendatang.
 *
 * Features:
 *  - Progress indicator with clickable completed steps
 *  - Per-step validation (required fields, format checks)
 *  - Live preview of all entered data on step 3
 *  - Framer-motion slide/fade transitions between steps
 *  - Toast notifications on submit success/error
 *  - Submits to /api/ppdb with all entered data
 *
 * Shared sub-components (ProgressIndicator, StepHeader, Field, Preview*)
 * live in ./PPDBFormParts to keep this file under 800 lines.
 */

// ============ Types ============

interface PPDBFormData {
  // Step 1 — Data Diri Santri
  name: string
  nickname: string
  gender: string
  birthPlace: string
  birthDate: string
  address: string
  previousSchool: string
  // Step 2 — Data Orang Tua/Wali
  fatherName: string
  fatherJob: string
  motherName: string
  motherJob: string
  parentPhone: string
  parentAddress: string // only filled if different from santri's address
}

const EMPTY_FORM: PPDBFormData = {
  name: '', nickname: '', gender: '', birthPlace: '', birthDate: '',
  address: '', previousSchool: '',
  fatherName: '', fatherJob: '', motherName: '', motherJob: '',
  parentPhone: '', parentAddress: '',
}

// ============ Main Component ============

export function PPDBRegistrationForm() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<PPDBFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PPDBFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)

  // Single-source-of-truth field updater
  const updateField = useCallback(
    <K extends keyof PPDBFormData>(key: K, val: PPDBFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: val }))
      // Clear field-specific error on edit
      setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
    },
    []
  )

  // ============ Per-step validation ============
  const validateStep = useCallback(
    (currentStep: number): boolean => {
      const newErrors: Partial<Record<keyof PPDBFormData, string>> = {}

      if (currentStep === 0) {
        if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi'
        if (!formData.gender) newErrors.gender = 'Pilih jenis kelamin'
        if (!formData.birthPlace.trim()) newErrors.birthPlace = 'Tempat lahir wajib diisi'
        if (!formData.birthDate) newErrors.birthDate = 'Tanggal lahir wajib diisi'
        else {
          const d = new Date(formData.birthDate)
          if (isNaN(d.getTime()) || d > new Date()) {
            newErrors.birthDate = 'Tanggal lahir tidak valid'
          }
        }
        if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi'
      }

      if (currentStep === 1) {
        if (!formData.fatherName.trim()) newErrors.fatherName = 'Nama ayah wajib diisi'
        if (!formData.motherName.trim()) newErrors.motherName = 'Nama ibu wajib diisi'
        if (!formData.parentPhone.trim()) {
          newErrors.parentPhone = 'No. HP/WA wajib diisi'
        } else {
          const cleaned = formData.parentPhone.replace(/[\s\-+()]/g, '')
          if (!/^\d{8,15}$/.test(cleaned)) {
            newErrors.parentPhone = 'Format nomor HP tidak valid'
          }
        }
      }

      if (currentStep === 2) {
        if (!confirmChecked) {
          toast.error('Harap centang pernyataan kebenaran data sebelum mengirim')
          return false
        }
      }

      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) {
        const missing = Object.values(newErrors).filter(Boolean)
        toast.error('Lengkapi data terlebih dahulu', {
          description: missing.slice(0, 3).join(' • ') + (missing.length > 3 ? ' …' : ''),
        })
        return false
      }
      return true
    },
    [formData, confirmChecked]
  )

  const handleNext = () => {
    if (!validateStep(step)) return
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          document.getElementById('ppdb-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleStepClick = (target: number) => {
    // Only allow going to completed steps (current or earlier)
    if (target < step) {
      setStep(target)
    } else if (target > step) {
      // Forward navigation: validate all intermediate steps
      for (let i = step; i < target; i++) {
        if (!validateStep(i)) return
      }
      setStep(target)
    }
  }

  // ============ Form submission ============
  const handleSubmit = async () => {
    // Final validation — run all steps
    for (let i = 0; i < 2; i++) {
      if (!validateStep(i)) {
        setStep(i)
        return
      }
    }
    if (!confirmChecked) {
      toast.error('Harap centang pernyataan kebenaran data')
      return
    }

    setSubmitting(true)
    try {
      // Map simplified form data → API payload (preserving existing schema)
      const payload = {
        name: formData.name.trim(),
        gender: formData.gender,
        birthPlace: formData.birthPlace.trim(),
        birthDate: formData.birthDate,
        fatherAddress: formData.address.trim(),
        motherAddress: formData.parentAddress.trim()
          ? formData.parentAddress.trim()
          : formData.address.trim(),
        previousSchool: formData.previousSchool.trim(),
        fatherName: formData.fatherName.trim(),
        fatherJob: formData.fatherJob.trim(),
        motherName: formData.motherName.trim(),
        motherJob: formData.motherJob.trim(),
        fatherPhone: formData.parentPhone.trim(),
        motherPhone: formData.parentPhone.trim(),
      }

      const res = await fetch('/api/ppdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Pendaftaran berhasil dikirim!', {
          description: 'Panitia akan menghubungi Anda via WhatsApp.',
          duration: 6000,
        })
        setSubmitted(true)
        setFormData(EMPTY_FORM)
        setStep(0)
        setConfirmChecked(false)
        setErrors({})
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error('Gagal mengirim pendaftaran', {
          description: errData?.error || 'Silakan coba lagi atau hubungi panitia.',
        })
      }
    } catch {
      toast.error('Gagal mengirim pendaftaran', {
        description: 'Periksa koneksi internet Anda dan coba lagi.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ============ Success state ============
  if (submitted) {
    return (
      <Card id="ppdb-form-card" className="border-0 shadow-premium wood-carved-shadow rounded-2xl overflow-hidden">
        <CardContent className="p-8 sm:p-12 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.7 }}
            className="inline-flex"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-[#064e3b] to-[#003527] shadow-lg">
              <CheckCircle2 className="h-12 w-12 text-[#ffe088]" />
            </div>
          </motion.div>
          <h4 className="mt-5 text-2xl font-bold text-[#003527] font-display">
            Pendaftaran Berhasil Dikirim
          </h4>
          <p className="mt-2 text-[#404944] font-body max-w-md mx-auto">
            Terima kasih. Data pendaftaran Anda telah kami terima. Tim panitia PPDB
            akan menghubungi Anda melalui nomor WhatsApp yang tercantum dalam 1×24 jam.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#cca72f]/15 text-[#003527] text-sm font-medium">
            <Phone className="h-4 w-4" />
            Pantau WhatsApp Anda untuk info selanjutnya
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="border-[#003527] text-[#003527] hover:bg-[#003527] hover:text-white rounded-xl"
            >
              Daftar Santri Lain
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============ Main form render ============
  return (
    <Card
      id="ppdb-form-card"
      className="border-0 shadow-premium wood-carved-shadow rounded-2xl overflow-hidden bg-white"
    >
      <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#064e3b]/8 text-[#003527] text-xs font-semibold uppercase tracking-wider mb-2">
            <Send className="h-3.5 w-3.5 text-[#cca72f]" />
            Formulir Pendaftaran Online
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#003527] font-display">
            Daftar Jadi Santri Baru
          </h3>
          <p className="mt-1 text-sm text-[#404944] font-body">
            Isi data dengan benar. Berkas persyaratan diserahkan offline ke panitia.
          </p>
        </div>

        {/* Progress indicator */}
        <ProgressIndicator currentStep={step} onStepClick={handleStepClick} />

        {/* Step content — animated slide+fade */}
        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 0 && (
                <Step1DataDiri
                  formData={formData}
                  errors={errors}
                  updateField={updateField}
                />
              )}
              {step === 1 && (
                <Step2DataOrangTua
                  formData={formData}
                  errors={errors}
                  updateField={updateField}
                />
              )}
              {step === 2 && (
                <Step4Konfirmasi
                  formData={formData}
                  confirmChecked={confirmChecked}
                  setConfirmChecked={setConfirmChecked}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#e4e2de]">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 0 || submitting}
            className="text-[#003527] hover:bg-[#064e3b]/8 disabled:opacity-40 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" /> Sebelumnya
          </Button>

          {step < STEPS.length - 1 ? (
            <RippleButton
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="bg-[#003527] hover:bg-[#064e3b] text-white font-semibold px-6 rounded-xl"
            >
              Selanjutnya <ChevronRight className="h-4 w-4" />
            </RippleButton>
          ) : (
            <RippleButton
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !confirmChecked}
              className="bg-[#cca72f] hover:bg-[#b8962a] text-[#003527] font-bold px-6 rounded-xl shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                </>
              ) : (
                <>
                  Kirim Pendaftaran <Send className="h-4 w-4" />
                </>
              )}
            </RippleButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ Step 1 — Data Diri Santri ============

function Step1DataDiri({
  formData,
  errors,
  updateField,
}: {
  formData: PPDBFormData
  errors: Partial<Record<keyof PPDBFormData, string>>
  updateField: <K extends keyof PPDBFormData>(key: K, val: PPDBFormData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={User}
        title="Data Diri Santri"
        subtitle="Informasi dasar calon santri"
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nama Lengkap" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Nama lengkap sesuai akta"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Nama Panggilan">
          <Input
            value={formData.nickname}
            onChange={(e) => updateField('nickname', e.target.value)}
            placeholder="Nama panggilan sehari-hari"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
          />
        </Field>
        <Field label="Jenis Kelamin" required error={errors.gender}>
          <Select
            value={formData.gender}
            onValueChange={(v) => updateField('gender', v)}
          >
            <SelectTrigger className="w-full rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="laki-laki">Laki-laki</SelectItem>
              <SelectItem value="perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tanggal Lahir" required error={errors.birthDate}>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.birthDate}
          />
        </Field>
        <Field label="Tempat Lahir" required error={errors.birthPlace}>
          <Input
            value={formData.birthPlace}
            onChange={(e) => updateField('birthPlace', e.target.value)}
            placeholder="Kota/kabupaten kelahiran"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.birthPlace}
          />
        </Field>
        <Field label="Asal Sekolah (jika pindahan)">
          <Input
            value={formData.previousSchool}
            onChange={(e) => updateField('previousSchool', e.target.value)}
            placeholder="Nama sekolah sebelumnya"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
          />
        </Field>
      </div>
      <Field label="Alamat Lengkap" required error={errors.address}>
        <Textarea
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Alamat tempat tinggal calon santri (RT/RW, desa, kecamatan, kabupaten)"
          rows={3}
          className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30 resize-none"
          aria-invalid={!!errors.address}
        />
      </Field>
    </div>
  )
}

// ============ Step 2 — Data Orang Tua/Wali ============

function Step2DataOrangTua({
  formData,
  errors,
  updateField,
}: {
  formData: PPDBFormData
  errors: Partial<Record<keyof PPDBFormData, string>>
  updateField: <K extends keyof PPDBFormData>(key: K, val: PPDBFormData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={Users}
        title="Data Orang Tua / Wali"
        subtitle="Informasi kontak untuk verifikasi & komunikasi panitia"
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nama Ayah" required error={errors.fatherName}>
          <Input
            value={formData.fatherName}
            onChange={(e) => updateField('fatherName', e.target.value)}
            placeholder="Nama lengkap ayah"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.fatherName}
          />
        </Field>
        <Field label="Pekerjaan Ayah">
          <Input
            value={formData.fatherJob}
            onChange={(e) => updateField('fatherJob', e.target.value)}
            placeholder="Pekerjaan ayah"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
          />
        </Field>
        <Field label="Nama Ibu" required error={errors.motherName}>
          <Input
            value={formData.motherName}
            onChange={(e) => updateField('motherName', e.target.value)}
            placeholder="Nama lengkap ibu"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.motherName}
          />
        </Field>
        <Field label="Pekerjaan Ibu">
          <Input
            value={formData.motherJob}
            onChange={(e) => updateField('motherJob', e.target.value)}
            placeholder="Pekerjaan ibu"
            className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
          />
        </Field>
      </div>
      <Field label="No. HP / WhatsApp Orang Tua" required error={errors.parentPhone}>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#404944]" />
          <Input
            type="tel"
            value={formData.parentPhone}
            onChange={(e) => updateField('parentPhone', e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="pl-10 rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30"
            aria-invalid={!!errors.parentPhone}
          />
        </div>
      </Field>
      <Field label="Alamat Orang Tua" hint="Kosongkan jika sama dengan alamat santri.">
        <Textarea
          value={formData.parentAddress}
          onChange={(e) => updateField('parentAddress', e.target.value)}
          placeholder="Alamat orang tua/wali (jika berbeda dengan santri)"
          rows={2}
          className="rounded-xl border-[#e4e2de] focus-visible:ring-[#cca72f]/30 resize-none"
        />
      </Field>
    </div>
  )
}

// ============ Step 3 — Konfirmasi & Submit ============

function Step4Konfirmasi({
  formData,
  confirmChecked,
  setConfirmChecked,
}: {
  formData: PPDBFormData
  confirmChecked: boolean
  setConfirmChecked: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={CheckCircle2}
        title="Konfirmasi & Kirim"
        subtitle="Periksa data di bawah sebelum mengirim pendaftaran."
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <PreviewSection icon={User} title="Data Diri Santri">
          <PreviewRow icon={UserCheck} label="Nama" value={formData.name} />
          <PreviewRow label="Panggilan" value={formData.nickname} />
          <PreviewRow label="Jenis Kelamin" value={formatGender(formData.gender)} />
          <PreviewRow icon={MapPin} label="Tempat Lahir" value={formData.birthPlace} />
          <PreviewRow icon={Calendar} label="Tanggal Lahir" value={formatDate(formData.birthDate)} />
          <PreviewRow icon={Home} label="Alamat" value={formData.address} multiline />
          {formData.previousSchool && (
            <PreviewRow icon={School} label="Asal Sekolah" value={formData.previousSchool} />
          )}
        </PreviewSection>

        <PreviewSection icon={Users} title="Data Orang Tua / Wali">
          <PreviewRow label="Nama Ayah" value={formData.fatherName} />
          {formData.fatherJob && <PreviewRow label="Pekerjaan Ayah" value={formData.fatherJob} />}
          <PreviewRow label="Nama Ibu" value={formData.motherName} />
          {formData.motherJob && <PreviewRow label="Pekerjaan Ibu" value={formData.motherJob} />}
          <PreviewRow icon={Phone} label="No. HP/WA" value={formData.parentPhone} />
          {formData.parentAddress && (
            <PreviewRow icon={Home} label="Alamat" value={formData.parentAddress} multiline />
          )}
        </PreviewSection>
      </div>

      {/* Confirmation checkbox */}
      <label
        htmlFor="ppdb-confirm"
        className="flex items-start gap-3 p-4 rounded-xl bg-[#064e3b]/5 border border-[#064e3b]/15 cursor-pointer hover:bg-[#064e3b]/8 transition-colors"
      >
        <Checkbox
          id="ppdb-confirm"
          checked={confirmChecked}
          onCheckedChange={(v) => setConfirmChecked(v === true)}
          className="mt-0.5 border-[#003527] data-[state=checked]:bg-[#003527] data-[state=checked]:border-[#003527]"
        />
        <span className="text-sm text-[#003527] font-body leading-relaxed">
          Saya menyatakan bahwa data yang dimasukkan adalah <strong>benar</strong> dan
          dapat dipertanggungjawabkan. Jika dikemudian hari terdapat data yang tidak
          sesuai, saya siap menanggung konsekuensinya termasuk pembatalan pendaftaran.
        </span>
      </label>
    </div>
  )
}
