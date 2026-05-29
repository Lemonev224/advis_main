'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { AuthNav } from '@/components/auth-nav'
import { createAccessRequest } from '@/app/actions/admin'
import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'

export default function RequestAccessPage() {
  const { locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    role: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createAccessRequest(formData)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A]">
        <AuthNav />
        <main className="mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 pb-16 pt-32 sm:px-6">
          <div className="w-full max-w-lg">
            <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm p-8 sm:p-10 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F4F8] border border-[#D7DEE7]">
                <CheckCircle2 className="h-6 w-6 text-[#2C3E50]" />
              </div>
              <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A] mb-4">
                {t(locale, 'auth.underReview')}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A] mb-3">
                {t(locale, 'auth.requestReceived')}
              </h1>
              <Link
                href="/landing"
                className="mt-6 inline-flex w-full h-10 items-center justify-center gap-2 rounded-sm border border-[#D7DEE7] bg-white text-sm font-medium text-[#52637A] transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                {t(locale, 'auth.returnHome')}
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
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-[#52637A] transition hover:text-[#0F172A] mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t(locale, 'auth.backToSignIn')}
            </Link>

            <div className="inline-flex items-center rounded-sm border border-[#D7DEE7] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
              {t(locale, 'auth.platformAccess')}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0F172A]">
              {t(locale, 'auth.requestAccess')}
            </h1>

            <p className="mt-3 text-base leading-7 text-[#52637A]">
              {t(locale, 'auth.accessSub')}
            </p>
          </div>

          <div className="rounded-sm border border-[#D7DEE7] bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                    {t(locale, 'auth.fullName')}
                  </label>
                  <input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData(f => ({...f, fullName: e.target.value}))}
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                    {t(locale, 'auth.workEmail')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(f => ({...f, email: e.target.value}))}
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="institution" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                    {t(locale, 'auth.institution')}
                  </label>
                  <input
                    id="institution"
                    required
                    value={formData.institution}
                    onChange={e => setFormData(f => ({...f, institution: e.target.value}))}
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#52637A]">
                    {t(locale, 'auth.jobTitle')}
                  </label>
                  <input
                    id="role"
                    required
                    value={formData.role}
                    onChange={e => setFormData(f => ({...f, role: e.target.value}))}
                    className="h-11 w-full rounded-sm border border-[#D7DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2C3E50]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.email || !formData.fullName || !formData.institution}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#2C3E50] text-sm font-semibold text-white transition hover:bg-[#33495f] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t(locale, 'auth.requestAccess')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}