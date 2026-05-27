'use server'

// app/actions/super-admin-security.ts

import { createClient }               from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath }             from 'next/cache'
import { redirect }                   from 'next/navigation'
import { headers }                    from 'next/headers'


function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase() ?? ''
  if (!user || !getSuperAdminEmails().includes(email)) {
    redirect('/landing')
  }
  return user
}

async function getAdminMeta() {
  const hdrs = await headers()
  return {
    ip: hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? null,
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FailedLoginSummary {
  email: string
  attempt_count: number
  last_attempt: string
  ip_addresses: string[]
}

export interface SecurityEvent {
  id: number
  org_id: string | null
  org_name?: string | null
  user_id: string | null
  event_type: string
  description: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface SessionInfo {
  user_id: string
  email: string
  last_sign_in: string
  ip_address?: string
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function getFailedLogins(): Promise<FailedLoginSummary[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('failed_login_attempts')
    .select('email, attempt_count, last_attempt, ip_addresses')
    .order('last_attempt', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('security_events')
    .select('*, organisations(name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: SecurityEvent & { organisations?: { name: string } }) => ({
    ...row,
    org_name: row.organisations?.name ?? null,
  }))
}

export async function clearFailedLogins(email: string): Promise<void> {
  const admin_user = await assertSuperAdmin()
  const { ip } = await getAdminMeta()
  const admin = createAdminClient()

  await admin.from('failed_login_attempts').delete().eq('email', email)

  // Audit the clearance
  await admin.from('security_events').insert({
    org_id:      null,
    user_id:     admin_user.id,
    event_type:  'failed_logins_cleared',
    description: `Super admin cleared failed login record for ${email}`,
    ip_address:  ip,
    metadata:    { target_email: email },
  })

  revalidatePath('/admin/security')
}