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
  org_id: string;
  org_name: string;
  last_session_created: string;
  active_session_count: number;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function getFailedLogins(): Promise<FailedLoginSummary[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_failed_login_summary', { limit_rows: 100 })

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

// ─── Additional types for security overview ──────────────────────────────────

export interface NeverActivatedUser {
  id: string;
  full_name: string;
  org_id: string;
  org_name: string;
  invited_at: string;
}

export interface SessionInfo {
  org_id: string;
  org_name: string;
  last_session_created: string;
  active_session_count: number;
}

// ─── Get active sessions per organisation ────────────────────────────────────
export async function getActiveSessions(): Promise<SessionInfo[]> {
  await assertSuperAdmin();
  const admin = createAdminClient();

  // Get all users and their last sign‑in
  const { data: users, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) throw new Error(usersError.message);

  // Get all organisations
  const { data: orgs } = await admin.from('organisations').select('id, name');
  const orgMap = new Map(orgs?.map(o => [o.id, o.name]));

  // Get user profiles to map user → organisation
  const { data: profiles } = await admin.from('user_profiles').select('id, org_id');
  const profileMap = new Map(profiles?.map(p => [p.id, p.org_id]));

  const orgSessionCount = new Map<string, number>();
  const orgLastSession = new Map<string, string>();

  for (const user of users.users) {
    if (user.last_sign_in_at) {
      const orgId = profileMap.get(user.id);
      if (orgId) {
        orgSessionCount.set(orgId, (orgSessionCount.get(orgId) || 0) + 1);
        const existing = orgLastSession.get(orgId);
        if (!existing || user.last_sign_in_at > existing) {
          orgLastSession.set(orgId, user.last_sign_in_at);
        }
      }
    }
  }

  const result: SessionInfo[] = [];
  for (const [orgId, count] of orgSessionCount) {
    result.push({
      org_id: orgId,
      org_name: orgMap.get(orgId) ?? 'Unknown',
      last_session_created: orgLastSession.get(orgId) ?? '',
      active_session_count: count,
    });
  }

  return result;
}

// ─── Get users who have never logged in ──────────────────────────────────────
export async function getNeverActivatedUsers(): Promise<NeverActivatedUser[]> {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: users, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) throw new Error(usersError.message);

  const { data: profiles } = await admin.from('user_profiles').select('id, org_id, full_name, created_at');
  const { data: orgs } = await admin.from('organisations').select('id, name');

  const orgMap = new Map(orgs?.map(o => [o.id, o.name]));
  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  const neverActivated: NeverActivatedUser[] = [];

  for (const user of users.users) {
    // User has never signed in but has confirmed their email
    if (!user.last_sign_in_at && user.email_confirmed_at) {
      const profile = profileMap.get(user.id);
      if (profile) {
        neverActivated.push({
          id: user.id,
          full_name: profile.full_name ?? user.email ?? '',
          org_id: profile.org_id,
          org_name: orgMap.get(profile.org_id) ?? 'Unknown',
          invited_at: profile.created_at,
        });
      }
    }
  }

  return neverActivated;
}

// ─── Get overview stats for the security dashboard ──────────────────────────
export async function getSecurityOverview() {
  await assertSuperAdmin();

  const [failedLogins, securityEvents, neverActivated, activeSessions] = await Promise.all([
    getFailedLogins(),
    getSecurityEvents(),
    getNeverActivatedUsers(),
    getActiveSessions(),
  ]);

  const highRiskLogins = failedLogins.filter(l => l.attempt_count >= 5);

  return {
    highRiskLogins,
    highRiskLoginCount: highRiskLogins.length,
    failedLoginCount: failedLogins.length,
    neverActivated,
    neverActivatedCount: neverActivated.length,
    totalActiveSessions: activeSessions.reduce((sum, s) => sum + s.active_session_count, 0),
  };
}

export interface AuditLogFilter {
  orgId?: string;
  action?: string;
  table?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLog(filter: AuditLogFilter): Promise<{ entries: AuditEntry[]; total: number }> {
  await assertSuperAdmin();
  const admin = createAdminClient();

  let query = admin.from('audit_log').select('*', { count: 'exact' });

  if (filter.orgId) query = query.eq('org_id', filter.orgId);
  if (filter.action) query = query.eq('action', filter.action);
  if (filter.table) query = query.eq('table_name', filter.table);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(filter.offset ?? 0, (filter.offset ?? 0) + (filter.limit ?? 50) - 1);

  if (error) throw new Error(error.message);

  // Enrich with organisation names
  const { data: orgs } = await admin.from('organisations').select('id, name');
  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]));

  const entries = (data ?? []).map(entry => ({
    ...entry,
    org_name: orgMap[entry.org_id] ?? 'Unknown',
  }));

  return { entries, total: count ?? 0 };
}

// ===== MISSING TYPES & FUNCTIONS =====

export interface AuditEntry {
  id: number
  org_id: string
  org_name?: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export async function forceLogoutUser(userId: string, orgId: string): Promise<void> {
  // TODO: implement actual session invalidation (e.g., via Supabase Auth Admin)
  console.warn(`forceLogoutUser called for user ${userId} in org ${orgId} – not implemented`)
  throw new Error('Force logout not yet implemented')
}

export async function resendInvite(userId: string, email: string, orgId: string): Promise<void> {
  // TODO: implement invite resend logic (e.g., using Supabase Auth admin)
  console.warn(`resendInvite called for ${email} – not implemented`)
  throw new Error('Resend invite not yet implemented')
}