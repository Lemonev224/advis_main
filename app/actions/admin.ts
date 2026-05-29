'use server'

import { getSupabaseWithAuth, getAuthContext } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface OrgUser {
  id: string
  full_name: string | null
  role: string
  created_at: string
  email?: string
}

export interface Organisation {
  id: string
  name: string
  slug: string
  country: string
  created_at: string
  userCount?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

// Service-role admin client — bypasses RLS, needed for auth.admin operations
function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function assertAdmin() {
  const { role } = await getAuthContext()
  if (role !== 'admin') throw new Error('Forbidden: admin role required')
}

// ─── Access Requests ──────────────────────────────────────────────────────────

export async function getAccessRequests(): Promise<AccessRequest[]> {
  await assertAdmin()
  const admin = createAdminSupabase()
  const { data, error } = await admin
    .from('access_requests')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function rejectAccessRequest(requestId: string): Promise<void> {
  await assertAdmin()
  const { supabase, userId } = await getSupabaseWithAuth()

  const { error } = await supabase
    .from('access_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

// ─── Core provisioning action ─────────────────────────────────────────────────

export interface ProvisionInput {
  requestId?: string          // optional — links back to an access_request row
  orgName: string
  country: string
  afaLicense?: string
  users: Array<{
    email: string
    fullName: string
    role: 'admin' | 'compliance_officer' | 'read_only'
  }>
}

export async function provisionBank(input: ProvisionInput): Promise<{ orgId: string }> {
  await assertAdmin()
  const { userId: adminUserId } = await getAuthContext()
  const admin = createAdminSupabase()

  const slug = slugify(input.orgName)

  // 1. Create organisation row
  const { data: org, error: orgError } = await admin
    .from('organisations')
    .insert({
      name: input.orgName,
      slug,
      country: input.country,
    })
    .select('id')
    .single()

  if (orgError) throw new Error(`Failed to create organisation: ${orgError.message}`)

  // 2. Invite each user and create their profile
  const errors: string[] = []

  for (const user of input.users) {
    try {
      // Invite via Supabase Auth — sends a magic-link email
      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        user.email,
        {
          data: { full_name: user.fullName },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://advisorly.app'}/auth/confirm`,
        }
      )

      if (inviteError) {
        errors.push(`${user.email}: ${inviteError.message}`)
        continue
      }

      // Create the user_profiles row
      const { error: profileError } = await admin
        .from('user_profiles')
        .insert({
          id: invited.user.id,
          org_id: org.id,
          role: user.role,
          full_name: user.fullName,
        })

      if (profileError) {
        errors.push(`${user.email} profile: ${profileError.message}`)
      }
    } catch (e: unknown) {
      errors.push(`${user.email}: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  // 3. Mark the access request as approved if one was provided
  if (input.requestId) {
    await admin
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq('id', input.requestId)
  }

  if (errors.length > 0) {
    // Org was created but some users failed — report but don't roll back
    throw new Error(`Organisation created, but some users failed:\n${errors.join('\n')}`)
  }

  revalidatePath('/settings')
  return { orgId: org.id }
}

// ─── Add user to existing org ─────────────────────────────────────────────────

export async function inviteUserToOrg(input: {
  email: string
  fullName: string
  role: 'admin' | 'compliance_officer' | 'read_only'
}): Promise<void> {
  await assertAdmin()
  const { orgId } = await getAuthContext()
  const admin = createAdminSupabase()

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    input.email,
    {
      data: { full_name: input.fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://advisorly.app'}/auth/confirm`,
    }
  )

  if (inviteError) throw new Error(inviteError.message)

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({
      id: invited.user.id,
      org_id: orgId,
      role: input.role,
      full_name: input.fullName,
    })

  if (profileError) throw new Error(profileError.message)
  revalidatePath('/settings')
}

// ─── Remove user from org ─────────────────────────────────────────────────────

export async function removeUserFromOrg(userId: string): Promise<void> {
  await assertAdmin()
  const { orgId, userId: adminId } = await getAuthContext()

  if (userId === adminId) throw new Error('You cannot remove yourself')

  const admin = createAdminSupabase()

  // Verify user belongs to this org before deleting
  const { data: profile } = await admin
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.org_id !== orgId) {
    throw new Error('User not found in your organisation')
  }

  await admin.from('user_profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/settings')
}

// ─── Get current org's users ──────────────────────────────────────────────────

export async function getOrgUsers(): Promise<OrgUser[]> {
  await assertAdmin()
  const { orgId } = await getAuthContext()
  const admin = createAdminSupabase()

  const { data, error } = await admin
    .from('user_profiles')
    .select('id, full_name, role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  // Enrich with email from auth.users
  const enriched = await Promise.all(
    (data ?? []).map(async (profile) => {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
      return {
        ...profile,
        email: authUser?.user?.email,
      }
    })
  )

  return enriched
}

// ─── Get current org info ─────────────────────────────────────────────────────

export async function getOrgInfo(): Promise<{ name: string; slug: string; country: string } | null> {
  const { orgId } = await getAuthContext()
  const admin = createAdminSupabase()

  const { data } = await admin
    .from('organisations')
    .select('name, slug, country')
    .eq('id', orgId)
    .single()

  return data
}

// ─── Get all orgs (super-admin only — for a future super-admin view) ──────────

export async function getAllOrgs(): Promise<Organisation[]> {
  await assertAdmin()
  const admin = createAdminSupabase()

  const { data: orgs, error } = await admin
    .from('organisations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Count users per org
  const withCounts = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const { count } = await admin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org.id)
      return { ...org, userCount: count ?? 0 }
    })
  )

  return withCounts
}

// app/actions/admin.ts

// ─── Public Access Request (no authentication needed) ─────────────────────────
export async function createAccessRequest(data: {
  fullName: string;
  email: string;
  institution: string;
  role: string;
  notes: string;
}): Promise<void> {
  // Use the service-nt to insert without requiring a logged-in user
  const admin = createAdminSupabase();   // this helper already exists in admin.ts

  const { error } = await admin.from('access_requests').insert({
    full_name: data.fullName,
    email: data.email,
    institution_name: data.institution,
    role: data.role,
    notes: data.notes,
    status: 'pending',
    submitted_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}