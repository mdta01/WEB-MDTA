'use client'

import { motion } from 'framer-motion'
import {
  User, Users, FileCheck, CheckCircle2,
  AlertCircle,
} from 'lucide-react'

/**
 * PPDBFormParts — Shared sub-components for the PPDB multi-step form.
 *
 * Extracted to keep PPDBRegistrationForm.tsx under 800 lines while
 * maintaining a single conceptual unit (the registration form).
 *
 * Includes:
 *  - STEPS constant + ProgressIndicator (top of form, clickable)
 *  - StepHeader (icon + title + subtitle for each step)
 *  - Field (label + input wrapper with inline error/hint)
 *  - PreviewSection / PreviewRow / BerkasPreview (live summary on step 4)
 *  - formatDate / formatGender helpers
 *
 * All components use the brand palette (emerald + gold on parchment).
 */

// ============ Step definitions ============

export const STEPS = [
  { id: 0, label: 'Data Diri', icon: User, short: 'Diri' },
  { id: 1, label: 'Orang Tua', icon: Users, short: 'Wali' },
  { id: 2, label: 'Berkas', icon: FileCheck, short: 'Berkas' },
  { id: 3, label: 'Konfirmasi', icon: CheckCircle2, short: 'Kirim' },
] as const

// ============ Progress Indicator ============

/**
 * ProgressIndicator — 4 clickable step circles connected by animated lines.
 *
 * States per circle:
 *  - completed (idx < current): filled emerald + CheckCircle2 icon, clickable
 *  - current (idx === current): white bg, gold ring, pulsing animation, icon visible
 *  - future (idx > current): gray outline, smaller icon, not clickable
 *
 * The connector line between circles fills with emerald when completed.
 */
export function ProgressIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number
  onStepClick: (target: number) => void
}) {
  return (
    <div className="flex items-center justify-between sm:justify-center sm:gap-2 max-w-xl mx-auto">
      {STEPS.map((s, idx) => {
        const Icon = s.icon
        const isCompleted = idx < currentStep
        const isCurrent = idx === currentStep
        const canClick = idx <= currentStep

        return (
          <div key={s.id} className="flex items-center flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => canClick && onStepClick(idx)}
              disabled={!canClick}
              aria-label={`Langkah ${idx + 1}: ${s.label}${isCompleted ? ' (selesai)' : isCurrent ? ' (saat ini)' : ''}`}
              className="flex flex-col items-center gap-1 group focus-visible:outline-none"
            >
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                transition={{ duration: 0.25 }}
                className={`
                  relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full
                  border-2 transition-all
                  ${isCompleted
                    ? 'bg-[#003527] border-[#003527] text-white'
                    : isCurrent
                      ? 'bg-white border-[#cca72f] text-[#003527] ring-4 ring-[#cca72f]/25'
                      : 'bg-white border-[#e4e2de] text-[#404944]/60'}
                  ${canClick ? 'cursor-pointer' : 'cursor-default'}
                  ${canClick ? 'group-hover:scale-105' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isCurrent ? (
                  <Icon className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-[#cca72f]"
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] sm:text-xs font-medium leading-tight text-center ${
                  isCurrent ? 'text-[#003527]' : isCompleted ? 'text-[#064e3b]' : 'text-[#404944]/60'
                }`}
              >
                {s.label}
              </span>
            </button>

            {/* Connector line — hidden on mobile, shown on sm+ */}
            {idx < STEPS.length - 1 && (
              <div className="hidden sm:block w-8 lg:w-12 mx-1 h-0.5 rounded-full overflow-hidden bg-[#e4e2de] relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[#003527]"
                  initial={false}
                  animate={{ width: idx < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ Step header (per-step) ============

export function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-[#e4e2de]">
      <div className="p-2 rounded-lg bg-[#064e3b]/10 shrink-0">
        <Icon className="h-5 w-5 text-[#003527]" />
      </div>
      <div>
        <h4 className="text-base sm:text-lg font-bold text-[#003527] font-display leading-tight">
          {title}
        </h4>
        <p className="text-xs text-[#404944] font-body">{subtitle}</p>
      </div>
    </div>
  )
}

// ============ Field wrapper (label + input + error/hint) ============

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#003527] font-body flex items-center gap-1">
        {label}
        {required && <span className="text-[#cca72f]" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#404944]/70">{hint}</p>}
      {error && (
        <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

// ============ Live preview components (step 4) ============

export function PreviewSection({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-[#e4e2de] bg-[#fbf9f5] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e4e2de]">
        <Icon className="h-4 w-4 text-[#cca72f]" />
        <h5 className="text-sm font-semibold text-[#003527] font-body uppercase tracking-wider">
          {title}
        </h5>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function PreviewRow({
  icon: Icon,
  label,
  value,
  multiline = false,
}: {
  icon?: React.ElementType
  label: string
  value: string
  multiline?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon && <Icon className="h-3.5 w-3.5 text-[#064e3b] mt-0.5 shrink-0" />}
      <span className="font-medium text-[#404944] min-w-[80px] shrink-0">{label}:</span>
      <span
        className={`text-[#003527] font-body ${
          multiline ? 'whitespace-pre-wrap break-words' : 'truncate'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * BerkasPreview — small thumbnail card showing uploaded file (image or PDF).
 * If url is empty, shows a "not yet uploaded" placeholder.
 */
export function BerkasPreview({
  label,
  url,
  icon: Icon,
}: {
  label: string
  url: string
  icon: React.ElementType
}) {
  if (!url) {
    return (
      <div className="rounded-lg border border-dashed border-[#e4e2de] p-3 text-center">
        <Icon className="h-6 w-6 mx-auto text-[#404944]/40" />
        <p className="text-xs text-[#404944]/60 mt-1">{label}</p>
        <p className="text-[10px] text-[#ba1a1a]/70 mt-0.5">Belum diunggah</p>
      </div>
    )
  }
  const isImage = url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || url.includes('/image/upload/')
  const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('/raw/upload/')
  return (
    <div className="rounded-lg border border-[#e4e2de] bg-white p-3 text-center">
      {isImage ? (
        <img
          src={url}
          alt={label}
          className="h-16 w-full object-cover rounded mb-1"
          loading="lazy"
        />
      ) : (
        <div className="h-16 flex items-center justify-center bg-[#064e3b]/8 rounded mb-1">
          <Icon className="h-6 w-6 text-[#ba1a1a]" />
        </div>
      )}
      <p className="text-xs font-medium text-[#003527]">{label}</p>
      <p className="text-[10px] text-[#064e3b] flex items-center justify-center gap-0.5 mt-0.5">
        <CheckCircle2 className="h-2.5 w-2.5" /> Terunggah{isPdf ? ' (PDF)' : ''}
      </p>
    </div>
  )
}

// ============ Helpers ============

export function formatDate(d: string): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export function formatGender(g: string): string {
  if (!g) return ''
  return g === 'laki-laki' ? 'Laki-laki' : g === 'perempuan' ? 'Perempuan' : g
}
