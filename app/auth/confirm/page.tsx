'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AuthNav } from '@/components/auth-nav'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handle() {
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)

      const errorCode = params.get('error_code')
      const errorDesc = params.get('error_description')

      if (errorCode) {
        if (errorCode === 'otp_expired') {
          setError('This reset link has expired. Please request a new one.')
        } else {
          setError(errorDesc?.replace(/\+/g, ' ') ?? 'This link is invalid or has expired.')
        }
        return
      }

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (!accessToken || !refreshToken) {
        setError('Invalid or missing reset link. Please request a new password reset.')
        return
      }

      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      const defaultNext = type === 'recovery' ? '/auth/reset-password' : '/'
      const next = searchParams.get('next') ?? defaultNext
      router.replace(next)
    }

    handle()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A]">
        <AuthNav />
        <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
          <div className="w-full max-w-lg">
            <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm p-8 sm:p-10 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A] mb-4">
                Link invalid
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-3">
                Reset link expired
              </h1>
              <p className="text-sm leading-6 text-[#52637A] mb-8">{error}</p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f]"
              >
                Request a new reset link
              </Link>
              <Link
                href="/login"
                className="mt-3 inline-flex h-10 w-full items-center justify-center text-sm text-[#52637A] transition hover:text-[#0F172A]"
              >
                Back to sign in
              </Link>
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
          <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#D7DEE7] bg-[#F8FAFC]">
              <Loader2 className="h-5 w-5 animate-spin text-[#52637A]" />
            </div>
            <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A] mb-4">
              Verifying
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-3">
              Confirming your link
            </h1>
            <p className="text-sm leading-6 text-[#52637A]">
              Please wait while we verify your reset link&hellip;
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmContent />
    </Suspense>
  )
}