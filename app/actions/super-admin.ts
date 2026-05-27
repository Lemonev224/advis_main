'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Put your email(s) here — must match layout.tsx ─────────────────────────
const SUPER_ADMIN_EMAILS = [
    'limonovarseniy491@gmail.com',
]
// ───────────────────────────────────────────────────────────────────────────

export interface SuperOrg {
    id: string
    name: string
    slug: string
    country: string
    created_at: string
    userCount: number
    lastLogin: string | null
}

export interface SuperOrgUser {
    id: string
    full_name: string | null
    role: string
    created_at: string
    email: string | null
    last_sign_in_at: string | null
}

export interface AccessRequest {
    id: string
    full_name: string
    email: string
    role: string
    institution_name: string
    afa_license: string | null
    team_size: string | null
    notes: string | null
    status: 'pending' | 'approved' | 'rejected'
    submitted_at: string
    reviewed_at: string | null
    reviewed_by: string | null
}

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

// ── Guards ──────────────────────────────────────────────────────────────────

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
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email ?? '')) {
        redirect('/landing')
    }
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50)
}

// ── Banks ───────────────────────────────────────────────────────────────────

export async function getAllOrgs(): Promise<SuperOrg[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const { data: orgs, error } = await admin
    .from('organisations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!orgs || orgs.length === 0) return []

  const enriched = await Promise.all(
    orgs.map(async (org) => {
      try {
        const { count } = await admin
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', org.id)

        const { data: profiles } = await admin
          .from('user_profiles')
          .select('id')
          .eq('org_id', org.id)

        let lastLogin: string | null = null
        if (profiles && profiles.length > 0) {
          const signIns: string[] = []
          for (const p of profiles) {
            try {
              const { data } = await admin.auth.admin.getUserById(p.id)
              if (data?.user?.last_sign_in_at) {
                signIns.push(data.user.last_sign_in_at)
              }
            } catch {
              // skip users that can't be fetched
            }
          }
          if (signIns.length > 0) {
            lastLogin = signIns.sort().reverse()[0]
          }
        }

        return {
          ...org,
          userCount: count ?? 0,
          lastLogin,
        }
      } catch {
        // if enrichment fails for any org, return it without the extra data
        return {
          ...org,
          userCount: 0,
          lastLogin: null,
        }
      }
    })
  )

  return enriched.filter(Boolean) as SuperOrg[]
}

export async function getOrgWithUsers(orgId: string): Promise<{
    org: SuperOrg
    users: SuperOrgUser[]
} | null> {
    await assertSuperAdmin()
    const admin = createAdminClient()

    const { data: org } = await admin
        .from('organisations')
        .select('*')
        .eq('id', orgId)
        .single()

    if (!org) return null

    const { data: profiles } = await admin
        .from('user_profiles')
        .select('id, full_name, role, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true })

    const users: SuperOrgUser[] = await Promise.all(
        (profiles ?? []).map(async (profile) => {
            const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
            return {
                ...profile,
                email: authUser?.user?.email ?? null,
                last_sign_in_at: authUser?.user?.last_sign_in_at ?? null,
            }
        })
    )

    return {
        org: { ...org, userCount: users.length, lastLogin: null },
        users,
    }
}

export async function provisionBank(input: {
    requestId?: string
    orgName: string
    country: string
    afaLicense?: string
    users: Array<{
        email: string
        fullName: string
        role: 'admin' | 'compliance_officer' | 'read_only'
    }>
}): Promise<{ orgId: string }> {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const slug = slugify(input.orgName)

    const { data: org, error: orgError } = await admin
        .from('organisations')
        .insert({ name: input.orgName, slug, country: input.country })
        .select('id')
        .single()

    if (orgError) throw new Error(`Failed to create organisation: ${orgError.message}`)

    const errors: string[] = []

    for (const user of input.users) {
        try {
            const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
                user.email,
                {
                    data: { full_name: user.fullName },
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://advisorly.app'}/auth/confirm`,
                }
            )
            if (inviteError) { errors.push(`${user.email}: ${inviteError.message}`); continue }

            const { error: profileError } = await admin
                .from('user_profiles')
                .insert({ id: invited.user.id, org_id: org.id, role: user.role, full_name: user.fullName })

            if (profileError) errors.push(`${user.email} profile: ${profileError.message}`)
        } catch (e: unknown) {
            errors.push(`${user.email}: ${e instanceof Error ? e.message : 'unknown'}`)
        }
    }

    if (input.requestId) {
        await admin
            .from('access_requests')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', input.requestId)
    }

    if (errors.length > 0) {
        throw new Error(`Organisation created, but some users failed:\n${errors.join('\n')}`)
    }

    revalidatePath('/admin/banks')
    revalidatePath('/admin/access-requests')
    return { orgId: org.id }
}

export async function addUserToOrg(input: {
    orgId: string
    email: string
    fullName: string
    role: 'admin' | 'compliance_officer' | 'read_only'
}): Promise<void> {
    await assertSuperAdmin()
    const admin = createAdminClient()

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        input.email,
        {
            data: { full_name: input.fullName },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://advisorly.app'}/auth/confirm`,
        }
    )
    if (inviteError) throw new Error(inviteError.message)

    const { error } = await admin
        .from('user_profiles')
        .insert({ id: invited.user.id, org_id: input.orgId, role: input.role, full_name: input.fullName })

    if (error) throw new Error(error.message)
    revalidatePath('/admin/banks')
}

export async function removeUser(userId: string): Promise<void> {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin.from('user_profiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
    revalidatePath('/admin/banks')
}

// ── Access Requests ─────────────────────────────────────────────────────────

export async function getAccessRequests(): Promise<AccessRequest[]> {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('access_requests')
        .select('*')
        .order('submitted_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
}

export async function rejectAccessRequest(id: string): Promise<void> {
    await assertSuperAdmin()
    const admin = createAdminClient()
    await admin
        .from('access_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id)
    revalidatePath('/admin/access-requests')
}

// ── Audit Log ───────────────────────────────────────────────────────────────

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
    await assertSuperAdmin()
    const admin = createAdminClient()

    const { data, error } = await admin
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw new Error(error.message)

    // Enrich with org names
    const { data: orgs } = await admin.from('organisations').select('id, name')
    const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

    return (data ?? []).map(entry => ({
        ...entry,
        org_name: orgMap[entry.org_id] ?? 'Unknown',
    }))
}

// ── Overview stats ──────────────────────────────────────────────────────────

export async function getAdminOverview() {
    await assertSuperAdmin()
    const admin = createAdminClient()

    const [
        { count: totalOrgs },
        { count: totalUsers },
        { count: pendingRequests },
        { count: pendingSARs },
        { count: overdueObligations },
    ] = await Promise.all([
        admin.from('organisations').select('id', { count: 'exact', head: true }),
        admin.from('user_profiles').select('id', { count: 'exact', head: true }),
        admin.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        admin.from('sar_entries').select('id', { count: 'exact', head: true }).eq('submitted_to_uifand', false),
        admin.from('obligations').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
    ])

    return {
        totalOrgs: totalOrgs ?? 0,
        totalUsers: totalUsers ?? 0,
        pendingRequests: pendingRequests ?? 0,
        pendingSARs: pendingSARs ?? 0,
        overdueObligations: overdueObligations ?? 0,
    }
}