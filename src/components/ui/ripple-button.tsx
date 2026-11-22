'use client'

import { useState, useCallback, useRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * RippleButton — Button with ripple effect on click (Material Design inspired).
 *
 * Premium tactile feedback for primary CTAs. When clicked, a ripple
 * emanates from the click point and fades out smoothly.
 *
 * Features:
 * - Ripple starts at click coordinates (not just center)
 * - Multiple ripples can stack (rapid clicks)
 * - Ripple auto-removes after animation completes (300ms)
 * - Respects prefers-reduced-motion (no ripple if reduced)
 * - Inherits all Button props (variant, size, className, onClick, etc.)
 *
 * Usage (drop-in replacement for <Button>):
 *   <RippleButton onClick={handleClick}>Daftar PPDB</RippleButton>
 *
 *   <RippleButton variant="outline" size="lg">Tentang Kami</RippleButton>
 *
 * Best for:
 * - Primary CTAs (Daftar PPDB, Hubungi Kami)
 * - Action buttons with high visual weight
 * NOT for:
 * - Icon-only buttons (too much visual noise)
 * - Secondary actions (use regular Button)
 */

type RipplePoint = {
  id: number
  x: number // percentage of button width (0-100)
  y: number // percentage of button height (0-100)
  size: number // ripple diameter in px
}

export function RippleButton({
  children,
  className,
  onClick,
  ...buttonProps
}: ButtonProps) {
  const [ripples, setRipples] = useState<RipplePoint[]>([])
  const rippleIdRef = useRef(0)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Check prefers-reduced-motion
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (mq.matches) {
          onClick?.(e)
          return
        }
      }

      const button = e.currentTarget
      const rect = button.getBoundingClientRect()

      // Click coordinates relative to button
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // Ripple size — diameter is max distance to furthest corner * 2
      // (so the ripple covers the entire button)
      const distToTopLeft = Math.sqrt(clickX * clickX + clickY * clickY)
      const distToTopRight = Math.sqrt((rect.width - clickX) * (rect.width - clickX) + clickY * clickY)
      const distToBottomLeft = Math.sqrt(clickX * clickX + (rect.height - clickY) * (rect.height - clickY))
      const distToBottomRight = Math.sqrt((rect.width - clickX) * (rect.width - clickX) + (rect.height - clickY) * (rect.height - clickY))
      const maxDist = Math.max(distToTopLeft, distToTopRight, distToBottomLeft, distToBottomRight)
      const size = maxDist * 2

      // Position as percentage (so ripple scales with button size)
      const xPercent = (clickX / rect.width) * 100
      const yPercent = (clickY / rect.height) * 100

      const id = rippleIdRef.current++
      setRipples((prev) => [...prev, { id, x: xPercent, y: yPercent, size }])

      // Auto-remove ripple after animation (300ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)

      // Call original onClick
      onClick?.(e)
    },
    [onClick]
  )

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Ripple elements — positioned absolutely, ripple animation via CSS */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            transform: 'translate(-50%, -50%) scale(0)',
            // Use mix-blend-mode: overlay for premium blend with button color
            mixBlendMode: 'overlay',
          }}
          aria-hidden
        />
      ))}
      {/* Button content — z-10 to stay above ripples */}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Button>
  )
}
