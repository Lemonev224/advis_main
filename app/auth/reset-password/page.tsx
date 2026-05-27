'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthNav } from '@/components/auth-nav'
import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    setSuccess(true)

    setTimeout(async () => {
      router.refresh()
      router.push('/')
    }, 1200)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A]">
        <AuthNav />
        <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
          <div className="w-full max-w-lg">
            <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm p-8 sm:p-10 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A] mb-4">
                {t(locale, 'auth.passwordUpdated')}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-3">
                {t(locale, 'auth.passwordChanged')}
              </h1>
              <p className="text-sm leading-6 text-[#52637A]">
                {t(locale, 'auth.redirecting')}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <AuthNav />

      <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
        <div className="w-full max-w-lg">

          <div className="mb-8">
            <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
              {t(locale, 'auth.securityUpdate')}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">
              {t(locale, 'auth.setNewPassword')}
            </h1>
            <p className="mt-3 text-base leading-7 text-[#52637A]">
              {t(locale, 'auth.setNewPasswordSub')}
            </p>
          </div>

          <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">

              {error && (
                <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]"
                >
                  {t(locale, 'auth.newPassword')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    autoComplete="new-password"
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 pr-10 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#52637A] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]"
                >
                  {t(locale, 'auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f] disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {t(locale, 'auth.updatePassword')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#94A3B8]">
                {t(locale, 'auth.protected')}
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}