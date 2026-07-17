import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Public endpoint — returns VAPID public key for browser push subscription
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 })
  }
  return NextResponse.json({ publicKey })
}
