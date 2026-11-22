// AUTO-GENERATED — do not edit.
// Tiny (20px wide) blurred WebP placeholders for instant LQIP (Low-Quality Image Placeholder).
// Generated from /public/images/*-tiny.webp. ~100-200 bytes each (base64-encoded).
// Used by <SmartImage> as the `blurDataURL` to show a blurred preview
// BEFORE the full image downloads.

export const LQIP = {
  "hero-madrasah": "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAABwAwCdASoUAAsAPxF0slCsJqSisAgBgCIJQBdgBB8b0kXDWsAA+6e/E6UrIyPxJbaSlkU0RCAp1WWGEzmbzAAA",
  "kepala-madrasah": "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAwCdASoUABQAPxF6sFKsJ6QjqA1RgCIJZwAAIg+OPPJBi7U/zAAA/tNg3AYmlSB3slGkDKY/subrhICItXSAAAA=",
  "logo-madin-warna": "data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAAAQBQCdASoUABQAPxF8tFQsJ6SjKAqpgCIJYgCdMwBBf8zYz2jQhMy4J2UIH7odw4wAAP7n5upziFId4ybmbm5ZsWKhie3OqK204/wpLuh3I7ruSS+OFt30DUJMj6j94ExZfdekNYAqm+WSgAA="
} as const;

export function getLQIP(name: keyof typeof LQIP | string): string | undefined {
  return LQIP[name as keyof typeof LQIP];
}
