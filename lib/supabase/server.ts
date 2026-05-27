import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from '@/app/actions/demo-constants'

export const DEMO_ORG_ID  = '00000000-0000-0000-0000-000000000001'
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {}
        },
      },
    }
  )
}

// ⚠️  SECURITY: This client bypasses Row Level Security.
// Use ONLY for super-admin operations (access request approval, org creation, etc.)
// NEVER use this for regular user data queries — use getSupabaseWithAuth() instead.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getAuthContext(): Promise<{ userId: string; orgId: string; role: string }> {
  const cookieStore = await cookies()

  const isDemoSession = cookieStore.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE
  if (isDemoSession) {
    return { userId: DEMO_USER_ID, orgId: DEMO_ORG_ID, role: 'admin' }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found — contact your administrator')

  return { userId: user.id, orgId: profile.org_id, role: profile.role }
}

/**
 * Returns a Supabase client scoped to the authenticated user's session.
 * RLS policies on the database enforce org_id isolation — this client
 * respects those policies. Do NOT swap this for createAdminClient().
 */
export async function getSupabaseWithAuth() {
  const cookieStore = await cookies()

  // Demo session: use admin client scoped to demo org (no real user session exists)
  const isDemoSession = cookieStore.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE
  if (isDemoSession) {
    const supabase = createAdminClient()
    return { supabase, userId: DEMO_USER_ID, orgId: DEMO_ORG_ID, role: 'admin' as const }
  }

  // Real session: use the user-scoped client so RLS applies
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found — contact your administrator')

  return { supabase, userId: user.id, orgId: profile.org_id, role: profile.role }
}