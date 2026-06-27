'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, LogIn, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AdminLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AdminLogin({ open, onOpenChange }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAdminLoggedIn, setAdminMode } = useAppStore()

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

      setAdminLoggedIn(true, data.admin?.name || data.admin?.username || 'Admin')
      setAdminMode(true)
      toast.success('Login berhasil!', {
        description: `Selamat datang, ${data.admin?.name || 'Admin'}`,
      })
      onOpenChange(false)
      setUsername('')
      setPassword('')
    } catch {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={true}>
        <div className="relative">
          {/* Islamic pattern header */}
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-6 pb-12 relative overflow-hidden">
            {/* Decorative pattern */}
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
                className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-3 shadow-lg"
              >
                <Shield className="h-8 w-8 text-emerald-900" />
              </motion.div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <p className="text-emerald-200 text-sm mt-1">MDTA Miftahul Ulum 01</p>
            </div>
          </div>

          {/* Form area */}
          <div className="p-6 pt-0 -mt-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <DialogHeader className="p-0 mb-4">
                <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
                  Masuk ke Panel Admin
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500">
                  Masukkan kredensial Anda untuk mengakses panel admin
                </DialogDescription>
              </DialogHeader>

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
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
