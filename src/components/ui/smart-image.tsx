'use client'

import { useState, useCallback } from 'react'

/**
 * SmartImage — premium image loader with graceful loading states.
 *
 * Problems solved (vs. raw <img>):
 * 1. NO flash of empty/no-image area while data loads — shows the
 *    default/fallback image IMMEDIATELY, then swaps to API-provided
 *    URL with a smooth cross-fade when ready.
 * 2. NO jarring "pop-in" when full image downloads — uses LQIP
 *    (Low-Quality Image Placeholder = tiny blurred preview) as the
 *    initial background, then fades the real image in on onLoad.
 * 3. NO cumulative layout shift (CLS) — width/height are required
 *    props so the browser reserves space before the image loads.
 * 4. NO flash of unstyled fallback image when API URL arrives —
 *    `activeSrc` is DERIVED directly from props during render
 *    (no useEffect, no cascading renders). When `src` prop changes,
 *    `isLoaded` automatically becomes false again (different src),
 *    triggering the fade-in transition once the new image loads.
 *
 * Used for: hero image, principal photo, logo, news/dakwah card
 * images, gallery images — anywhere a "template placeholder flash"
 * would otherwise be visible.
 */

type SmartImageProps = {
  /** Primary image URL (e.g. from API settings). Empty/undefined = use fallback. */
  src?: string
  /** Fallback image URL (e.g. default /images/hero-madrasah.webp). */
  fallbackSrc: string
  /** Tiny base64-encoded blur placeholder (LQIP) — see src/lib/lqip.ts. */
  blurDataURL?: string
  alt: string
  width?: number
  height?: number
  className?: string
  /** Optional inline style (e.g. for object-position). */
  style?: React.CSSProperties
  /** loading strategy: 'eager' for above-the-fold, 'lazy' for below. */
  loading?: 'eager' | 'lazy'
  /** fetchPriority: 'high' for hero, 'low' or 'auto' for others. */
  fetchPriority?: 'high' | 'low' | 'auto'
  /** Whether to enable the blur-up effect. Default: true. */
  blur?: boolean
  /** Disable the fade-in animation entirely (e.g. for tiny icons). */
  noFade?: boolean
  /** Object-fit. Default: 'cover'. */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Object-position. Default: 'center'. */
  objectPosition?: string
  /** When true, the image fills its parent (absolute inset-0). */
  fill?: boolean
  /** Optional aria-hidden. */
  'aria-hidden'?: boolean
}

export function SmartImage({
  src,
  fallbackSrc,
  blurDataURL,
  alt,
  width,
  height,
  className = '',
  style,
  loading = 'lazy',
  fetchPriority = 'auto',
  blur = true,
  noFade = false,
  objectFit = 'cover',
  objectPosition = 'center',
  fill = false,
  ...rest
}: SmartImageProps) {
  // activeSrc is DERIVED from props — no useState, no useEffect, no cascading renders.
  // This is the React-recommended pattern for "state that mirrors props".
  // If `src` is provided (non-empty), use it; otherwise use fallback.
  const activeSrc = src && src.trim() ? src : fallbackSrc

  // Track which src has finished loading. When `activeSrc` changes (props update),
  // `loadedSrc !== activeSrc` so `isLoaded` becomes false again automatically.
  // No effect needed — this is derived state during render.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  // If the primary src fails to load, swap to fallbackSrc (tracked via state).
  const [errorSrc, setErrorSrc] = useState<string | null>(null)

  // Effective src — if the activeSrc errored, use fallback.
  const effectiveSrc = errorSrc === activeSrc ? fallbackSrc : activeSrc
  const isLoaded = loadedSrc === effectiveSrc

  const handleLoad = useCallback(() => {
    setLoadedSrc(effectiveSrc)
  }, [effectiveSrc])

  const handleError = useCallback(() => {
    // Mark current src as errored so we retry with fallback.
    setErrorSrc(effectiveSrc)
  }, [effectiveSrc])

  // Determine if blur background should show:
  // - enabled by `blur` prop AND blurDataURL provided AND image not yet loaded
  const showBlur = blur && !!blurDataURL && !isLoaded

  const imgStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    // When noFade is true, do NOT set opacity/transform — let the consumer's
    // className (e.g. group-hover:scale-105) handle hover effects. Otherwise
    // the inline style would override Tailwind's transform utilities.
    ...(noFade
      ? {}
      : {
          // Fade-in transition — opacity 0 → 1 over 600ms when loaded.
          // When blur is enabled, also scale slightly (1.05 → 1) for premium feel.
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
          transition: 'opacity 600ms ease-out, transform 800ms ease-out',
        }),
    ...style,
  }

  // Wrapper div for non-fill mode (needs width/height for CLS prevention)
  if (!fill) {
    return (
      <div
        className={`smart-image-wrap relative overflow-hidden ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          backgroundColor: showBlur ? 'transparent' : '#064e3b',
        }}
        aria-hidden={rest['aria-hidden']}
      >
        {/* LQIP blur background — covers the entire wrapper while full image loads */}
        {showBlur && (
          <img
            src={blurDataURL}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit,
              objectPosition,
              filter: 'blur(8px) saturate(1.2)',
              transform: 'scale(1.1)', // hide blur edges
              opacity: 0.85,
            }}
            // Tiny image is already loaded into memory as base64 — no network.
            // Mark as eager so browser doesn't delay it.
            loading="eager"
            decoding="async"
            // Prevent accessibility tools from announcing this placeholder.
            tabIndex={-1}
          />
        )}
        <img
          src={effectiveSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={`relative ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'} ${className}`}
          style={imgStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    )
  }

  // Fill mode — image is absolutely positioned to fill parent
  return (
    <>
      {showBlur && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full ${className}`}
          style={{
            objectFit,
            objectPosition,
            filter: 'blur(8px) saturate(1.2)',
            transform: 'scale(1.1)',
            opacity: 0.85,
            ...style,
          }}
          loading="eager"
          decoding="async"
          tabIndex={-1}
        />
      )}
      <img
        src={effectiveSrc}
        alt={alt}
        fetchPriority={fetchPriority}
        loading={loading}
        decoding="async"
        className={`absolute inset-0 w-full h-full ${className}`}
        style={imgStyle}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  )
}

/**
 * Helper — picks the best image source from a setting value.
 * Falls back to a default /public/images/* path if the setting is empty.
 *
 * Also automatically upgrades .png references to .webp for local images
 * (we ship pre-converted WebP versions in /public/images/).
 */
export function pickImage(settingValue: string | undefined, defaultPngPath: string): string {
  if (settingValue && settingValue.trim()) {
    // External URL (Cloudinary etc.) — use as-is
    if (settingValue.startsWith('http://') || settingValue.startsWith('https://')) {
      return settingValue
    }
    // Local image — auto-upgrade .png → .webp if available
    return settingValue.replace(/\.png$/, '.webp')
  }
  // No setting — use default, also auto-upgrade to .webp
  return defaultPngPath.replace(/\.png$/, '.webp')
}
