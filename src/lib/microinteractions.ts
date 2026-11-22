'use client'

import { useState, useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * usePrefersReducedMotion — subscribe to browser's prefers-reduced-motion setting.
 *
 * Uses useSyncExternalStore (React 18+) — the recommended pattern for
 * reading from external systems (like matchMedia) without triggering
 * the "setState in effect" lint warning.
 *
 * Returns true if user has reduced motion enabled (OS-level setting).
 * Components should disable/simplify animations when this is true.
 */
function subscribePrefersReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {} // SSR-safe no-op
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getPrefersReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getPrefersReducedMotionServerSnapshot(): boolean {
  return false // SSR always returns false (no motion preference on server)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot
  )
}

/**
 * useMagneticButton — cursor-following translate effect for CTA buttons.
 *
 * When the user hovers near a button, the button translates slightly
 * toward the cursor position. Creates a "magnetic" premium feel.
 *
 * Effect strength:
 *   - 0.3 = subtle (default) — good for primary CTAs like "Daftar PPDB"
 *   - 0.5 = strong — only for hero buttons
 *   - 0.15 = very subtle — for icon buttons
 *
 * Usage:
 *   const { ref, handleMouseMove, handleMouseLeave } = useMagneticButton(0.3)
 *   <button ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
 *
 * Note: Respects prefers-reduced-motion (no translate if user prefers reduced motion).
 */
export function useMagneticButton(strength = 0.3) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reducedMotion || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      // Distance from cursor to button center, normalized
      const x = (e.clientX - rect.left - rect.width / 2) * strength
      const y = (e.clientY - rect.top - rect.height / 2) * strength
      // Use translate3d for hardware acceleration + smoother animation
      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    },
    [strength, reducedMotion]
  )

  const onMouseLeave = useCallback(() => {
    if (reducedMotion || !ref.current) return
    // Smooth return to center — CSS transition handles the easing
    ref.current.style.transform = 'translate3d(0, 0, 0)'
  }, [reducedMotion])

  return { ref, onMouseMove, onMouseLeave, reducedMotion }
}

/**
 * useTilt3D — 3D perspective tilt effect for cards.
 *
 * When the user hovers over a card, the card tilts slightly in 3D
 * based on cursor position. Creates depth and engagement.
 *
 * Max tilt is in degrees (default 5°). For premium feel, keep subtle:
 *   - 5° = subtle (default)
 *   - 8° = medium — good for news cards
 *   - 12° = strong — only for hero cards
 *
 * Usage:
 *   const { ref, handleMouseMove, handleMouseLeave } = useTilt3D(8)
 *   <div
 *     ref={ref}
 *     onMouseMove={handleMouseMove}
 *     onMouseLeave={handleMouseLeave}
 *     style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
 *   >
 *
 * Note: Respects prefers-reduced-motion.
 */
export function useTilt3D(maxTilt = 5) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      // Normalize cursor position to -0.5 ... +0.5
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      // Tilt: cursor right → rotateY positive (right side tilts away)
      //       cursor down → rotateX negative (top tilts toward viewer)
      const rotateY = x * maxTilt * 2
      const rotateX = -y * maxTilt * 2
      ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`
    },
    [maxTilt, reducedMotion]
  )

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion || !ref.current) return
    ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)'
  }, [reducedMotion])

  return { ref, handleMouseMove, handleMouseLeave, reducedMotion }
}

/**
 * easeOutCubic — premium easing function for count-up animations.
 *
 * Standard linear easing feels robotic. Cubic easing-out starts fast
 * and decelerates — feels natural and premium (like iOS animations).
 *
 * Used by AnimatedCounter in BerandaSection for statistics numbers.
 *
 * Formula: 1 - (1 - t)^3
 *   - t=0 → 0 (start at 0)
 *   - t=1 → 1 (end at target)
 *   - Decelerates smoothly
 *
 * For even more premium feel, use easeOutExpo (more dramatic):
 *   1 - 2^(-10 * t)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * easeOutBack — slight overshoot for delightful feel.
 *
 * Used for entrance animations (cards appearing, modals opening).
 * The slight overshoot feels "playful yet professional".
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
