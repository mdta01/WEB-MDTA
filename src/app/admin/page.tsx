'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, LogIn, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster, toast } from 'sonner'
import AdminPanel from '@/components/admin/AdminPanel'

// --- Login Page Component ---
function AdminLoginPage({ onLoginSuccess }: { onLoginSuccess: (name: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal')
        return
      }

      toast.success('Login berhasil!', {
        description: `Selamat datang, ${data.admin?.name || 'Admin'}`,
      })
      onLoginSuccess(data.admin?.name || 'Admin')
    } catch {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-100 rounded-full translate-x-1/2 translate-y-1/2 opacity-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23065f46' fill-opacity='1'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-8 pb-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="white" strokeWidth="1" />
                    <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#islamic-pattern)" />
              </svg>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-lg"
              >
                <img src="/images/logo-madin-warna.png" alt="Logo MDTA" className="w-full h-full object-cover" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-emerald-200 text-sm mt-1">MDTA Miftahul Ulum 01</p>
            </div>
          </div>

          {/* Form area */}
          <div className="p-8 pt-0 -mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
                Masuk ke Panel Admin
              </h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Masukkan kredensial Anda untuk mengakses panel admin
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>Masuk</span>
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <a
              href="/"
              className="text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              ← Kembali ke Website
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- Main Admin Page ---
function AdminPageContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [checking, setChecking] = useState(true)
  const failedCheckCount = useRef(0)

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check')
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setAdminName(data.name || 'Admin')
          failedCheckCount.current = 0
        }
      } catch {
        // Network error - don't logout on first failure
      } finally {
        setChecking(false)
      }
    }
    checkAuth()
  }, [])

  // Periodic auth check (every 2 minutes) - only logout after 3 consecutive failures
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/check')
        const data = await res.json()
        if (data.authenticated) {
          failedCheckCount.current = 0
        } else {
          failedCheckCount.current++
          // Only logout after 3 consecutive failures (avoid single network glitch)
          if (failedCheckCount.current >= 3) {
            setIsAuthenticated(false)
            setAdminName('')
            toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
          }
        }
      } catch {
        // Network error - count as failure but tolerate some
        failedCheckCount.current++
        if (failedCheckCount.current >= 3) {
          setIsAuthenticated(false)
          setAdminName('')
          toast.error('Koneksi terputus. Silakan login kembali.')
        }
      }
    }, 120000) // Check every 2 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLoginSuccess = useCallback((name: string) => {
    setIsAuthenticated(true)
    setAdminName(name)
    failedCheckCount.current = 0
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
    setAdminName('')
    toast.success('Berhasil logout')
  }, [])

  // Loading state while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="mt-2 text-gray-500">Memverifikasi...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />
  }

  // Show admin panel if authenticated
  return <AdminPanel adminName={adminName} onLogout={handleLogout} />
}

export default function AdminPage() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch too aggressively
            retry: 2,
            refetchOnWindowFocus: false, // Don't refetch on window focus - prevents auto-logout
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPageContent />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
