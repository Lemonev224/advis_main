'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, AlertCircle, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthNav } from '@/components/auth-nav'
import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'
import { activateDemoSession } from '@/app/actions/demo'
import { signInAndRecord } from '@/app/actions/auth'

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-[#2C3E50]" />
      <p className="mt-4 text-sm font-medium text-[#52637A]">Carregant el vostre tauler…</p>
    </div>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [demoKey, setDemoKey] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(decodeURIComponent(prefill))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      setError(error.message === 'Invalid login credentials'
        ? t(locale, 'auth.incorrectLogin')
        : error.message)
      return
    }

    setNavigating(true)
    router.refresh()
    router.push('/')
  }

  const handleDemoKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setDemoError(null)
    setDemoLoading(true)

    const result = await activateDemoSession(demoKey)

    if (!result.success) {
      setDemoLoading(false)
      setDemoError('Invalid demo key. Please contact your account manager.')
      return
    }

    // Show full-screen loader immediately while dashboard loads
    setNavigating(true)
    router.push('/')
  }

  if (navigating) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <AuthNav />

      <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
        <div className="w-full max-w-lg">

          <div className="mb-8">
            <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
              {t(locale, 'auth.secureAccess')}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">
              {t(locale, 'auth.signInTitle')}
            </h1>
            <p className="mt-3 text-base leading-7 text-[#52637A]">
              {t(locale, 'auth.signInSub')}
            </p>
          </div>

          <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                  {t(locale, 'auth.workEmail')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@institution.ad"
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                />
              </div>

              <div className="mb-2">
                <label htmlFor="password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                  {t(locale, 'auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 pr-10 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#52637A]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-6 flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs text-[#52637A] transition hover:text-[#0F172A]">
                  {t(locale, 'auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t(locale, 'auth.signIn')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Demo Key Section */}
          <div className="mt-6 rounded-sm border border-[#D7DEE7] bg-[#F8FAFC]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#52637A]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                  Demo Access
                </span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#94A3B8]">
                Have a demo key? Enter it below to access the platform instantly.
              </p>
              <form onSubmit={handleDemoKey} className="flex flex-col gap-3">
                {demoError && (
                  <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm font-medium text-red-700">{demoError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={demoKey}
                    onChange={e => setDemoKey(e.target.value)}
                    placeholder="DEMO-XXXX-XXXX"
                    className="h-11 flex-1 rounded-sm border border-[#D7DEE7] bg-white px-3 font-mono text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                  <button
                    type="submit"
                    disabled={demoLoading || !demoKey.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-[#D7DEE7] bg-white px-4 text-sm font-semibold text-[#2C3E50] transition hover:bg-[#2C3E50] hover:text-white disabled:opacity-60"
                  >
                    {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#94A3B8]">
            {t(locale, 'auth.noAccess')}{' '}
            <Link href="/request-access" className="text-[#52637A] underline-offset-2 hover:underline">
              {t(locale, 'auth.requestAccess')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}