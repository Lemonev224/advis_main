'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthNav } from '@/components/auth-nav'
import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'

export default function ForgotPasswordPage() {
  const { locale } = useLocale()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      // Don't reveal whether the email exists — still show success
      console.error('Reset error:', error.message)
    }

    // Always show confirmation (security best practice — don't leak account existence)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A]">
        <AuthNav />

        <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
          <div className="w-full max-w-lg">
            <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm p-8 sm:p-10 text-center">

              {/* Icon */}
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F4F8] border border-[#D7DEE7]">
                <Mail className="h-6 w-6 text-[#2C3E50]" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A] mb-4">
                {t(locale, 'auth.checkInbox')}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-3">
                {t(locale, 'auth.resetLinkSent')}
              </h1>

              <p className="text-sm leading-6 text-[#52637A] mb-2">
                {t(locale, 'auth.resetSub1', { email })}
              </p>

              <p className="text-sm leading-6 text-[#52637A] mb-8">
                {t(locale, 'auth.resetSub2')}
              </p>

              <div className="border-t border-[#D7DEE7] mb-6" />

              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-sm border border-[#D7DEE7] bg-white text-sm font-medium text-[#52637A] transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                >
                  {t(locale, 'auth.tryDifferentEmail')}
                </button>

                <Link
                  href="/login"
                  className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t(locale, 'auth.backToSignIn')}
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-[#94A3B8]">
              {t(locale, 'auth.resetWarning')}
            </p>
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
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-[#52637A] transition hover:text-[#0F172A] mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t(locale, 'auth.backToSignIn')}
            </Link>

            <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
              {t(locale, 'auth.accountRecovery')}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">
              {t(locale, 'auth.resetTitle')}
            </h1>

            <p className="mt-3 text-base leading-7 text-[#52637A]">
              {t(locale, 'auth.resetSub')}
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

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]"
                >
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

              <button
                type="submit"
                disabled={loading || !email}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t(locale, 'auth.sendResetLink')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-5 text-center text-xs text-[#94A3B8]">
                {t(locale, 'auth.resetExpire')}
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}