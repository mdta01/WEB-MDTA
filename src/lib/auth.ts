import { cookies } from 'next/headers'

const ADMIN_TOKEN = 'mdta-admin-token'
const TOKEN_VALUE = 'mdta-miftahul-ulum-01-admin-2025'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hashed
}

export async function setAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_TOKEN, TOKEN_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_TOKEN)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_TOKEN)
  return token?.value === TOKEN_VALUE
}
