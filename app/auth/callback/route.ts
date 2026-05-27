import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  function redirectTo(path: string) {
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`)
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`)
    return NextResponse.redirect(`${origin}${path}`)
  }

  // PKCE flow — code in query string (used by resetPasswordForEmail with redirectTo)
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectTo(next)
    }
    // Code exchange failed — send to confirm page to show error from hash if present,
    // or it will show a generic invalid-link error.
    return redirectTo(`/auth/confirm?next=${encodeURIComponent(next)}`)
  }

  // Token hash flow — Supabase puts tokens in the URL fragment (#access_token=...).
  // The server never sees fragments, so hand off to the client-side confirm page
  // which reads window.location.hash and calls setSession().
  // Always pass `next` so confirm knows where to redirect after success.
  const nextParam = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
  return redirectTo(`/auth/confirm${nextParam}`)
}