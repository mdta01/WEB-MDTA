'use client'

import { motion } from 'framer-motion'
import { useTilt3D } from '@/lib/microinteractions'
import { cn } from '@/lib/utils'

/**
 * TiltCard — wraps children in a 3D perspective tilt effect.
 *
 * On mouse move, the card tilts slightly in 3D based on cursor position.
 * On mouse leave, it smoothly returns to center.
 *
 * Combines:
 * - useTilt3D hook (handles the math + reduced-motion check)
 * - framer-motion entrance animation (fade + slide up)
 * - CSS transition for smooth return-to-center (tilt-card class)
 *
 * Props:
 * - maxTilt: max tilt angle in degrees (default 5 = subtle premium)
 * - delay: framer-motion entrance delay (for staggered cards)
 * - className: additional classes for the motion wrapper
 * - children: card content
 *
 * Usage:
 *   <TiltCard maxTilt={5} delay={idx * 0.1}>
 *     <Card>...</Card>
 *   </TiltCard>
 *
 * Note: The child Card should NOT have its own transform (e.g. card-hover scale)
 * because the tilt transform on this wrapper takes precedence.
 * Instead, use box-shadow hover effects for the card.
 */
type TiltCardProps = {
  children: React.ReactNode
  maxTilt?: number
  delay?: number
  className?: string
  /** Override the entrance animation duration (default 0.5s) */
  duration?: number
}

export function TiltCard({
  children,
  maxTilt = 5,
  delay = 0,
  duration = 0.5,
  className,
}: TiltCardProps) {
  const { ref, handleMouseMove, handleMouseLeave } = useTilt3D(maxTilt)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration }}
      className={cn('tilt-card', className)}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
