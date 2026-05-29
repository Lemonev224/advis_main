'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient }               from '@supabase/supabase-js'
import { redirect }                   from 'next/navigation'
import { headers }                    from 'next/headers'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
    hdrs.get('x-real-ip') ??
    null
  const userAgent = hdrs.get('user-agent') ?? null
  return { ip, userAgent }
}

export async function signIn(formData: FormData) {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Record the failed attempt for security monitoring
    try {
      const { ip, userAgent } = await getRequestMeta()
      const admin = createAdminClient()
      await admin.rpc('record_failed_login', {
        p_email:      email,
        p_ip:         ip,
        p_user_agent: userAgent,
      })
    } catch {
      // Never let monitoring break the auth flow
    }

    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export async function signInAndRecord(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      try {
        const { ip, userAgent } = await getRequestMeta()
        const admin = createAdminClient()
        await admin.rpc('record_failed_login', {
          p_email:      email,
          p_ip:         ip,
          p_user_agent: userAgent,
        })
      } catch {
        // Never let monitoring break the auth flow
      }
      return { error: error.message }
    }

    return { error: null }

  } catch (e) {
    // Supabase client setup or unexpected failure
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred' }
  }
}


export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/landing')
}

export async function resetPasswordRequest(formData: FormData) {
  const email    = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  
})

  if (error) redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  redirect('/auth/forgot-password?success=1')
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`)
  redirect('/?passwordReset=1')
}