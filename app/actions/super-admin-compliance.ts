'use server'

// app/actions/super-admin-compliance.ts

import { createClient }               from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect }                   from 'next/navigation'

const SUPER_ADMIN_EMAILS = ['limonovarseniy491@gmail.com']

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
  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email ?? '')) redirect('/landing')
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BankComplianceRow {
  orgId:                string
  orgName:              string
  country:              string
  totalObligations:     number
  overdueObligations:   number
  completedObligations: number
  totalKyc:             number
  kycHighRisk:          number
  kycMissingDocs:       number
  pendingSARs:          number
  oldestUnsubmittedSAR: string | null  // ISO date
  totalEvidence:        number
  obligationsWithNoEvidence: number
  lastLogin:            string | null
  inactiveDays:         number | null
}

export interface SARAlert {
  orgId:       string
  orgName:     string
  sarId:       string
  clientRef:   string
  description: string
  createdAt:   string
  hoursOld:    number
}

export interface InactiveBank {
  orgId:      string
  orgName:    string
  lastLogin:  string | null
  daysInactive: number
  userCount:  number
}

// ── Compliance per bank ───────────────────────────────────────────────────────

export async function getCrossBankCompliance(): Promise<BankComplianceRow[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const { data: orgs } = await admin
    .from('organisations')
    .select('id, name, country')
    .order('name')

  if (!orgs || orgs.length === 0) return []

  const rows = await Promise.all(orgs.map(async (org) => {
    const [
      { data: obligations },
      { data: kyc },
      { data: sars },
      { data: evidence },
      { data: profiles },
    ] = await Promise.all([
      admin.from('obligations').select('id, status').eq('org_id', org.id),
      admin.from('kyc_clients').select('id, risk_tier, documents_missing, status').eq('org_id', org.id),
      admin.from('sar_entries').select('id, submitted_to_uifand, created_at').eq('org_id', org.id),
      admin.from('evidence_files').select('id, obligation_id').eq('org_id', org.id),
      admin.from('user_profiles').select('id').eq('org_id', org.id),
    ])

    // Obligations
    const totalObligations     = obligations?.length ?? 0
    const overdueObligations   = obligations?.filter(o => o.status === 'overdue').length ?? 0
    const completedObligations = obligations?.filter(o => o.status === 'completed').length ?? 0

    // KYC
    const totalKyc      = kyc?.length ?? 0
    const kycHighRisk   = kyc?.filter(k => k.risk_tier === 'high').length ?? 0
    const kycMissingDocs = kyc?.filter(k => k.documents_missing?.length > 0).length ?? 0

    // SARs
    const pendingSARs = sars?.filter(s => !s.submitted_to_uifand).length ?? 0
    const unsubmitted = sars?.filter(s => !s.submitted_to_uifand) ?? []
    const oldestUnsubmittedSAR = unsubmitted.length > 0
      ? unsubmitted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0].created_at
      : null

    // Evidence gaps
    const totalEvidence = evidence?.length ?? 0
    const coveredIds = new Set((evidence ?? []).map(e => e.obligation_id))
    const obligationsWithNoEvidence = (obligations ?? []).filter(o => !coveredIds.has(o.id)).length

    // Last login
    let lastLogin: string | null = null
    let inactiveDays: number | null = null
    if (profiles && profiles.length > 0) {
      const signIns: string[] = []
      for (const p of profiles) {
        try {
          const { data } = await admin.auth.admin.getUserById(p.id)
          if (data?.user?.last_sign_in_at) signIns.push(data.user.last_sign_in_at)
        } catch { /* skip */ }
      }
      if (signIns.length > 0) {
        lastLogin = signIns.sort().reverse()[0]
        inactiveDays = Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000)
      }
    }

    return {
      orgId:                org.id,
      orgName:              org.name,
      country:              org.country,
      totalObligations,
      overdueObligations,
      completedObligations,
      totalKyc,
      kycHighRisk,
      kycMissingDocs,
      pendingSARs,
      oldestUnsubmittedSAR,
      totalEvidence,
      obligationsWithNoEvidence,
      lastLogin,
      inactiveDays,
    }
  }))

  return rows
}

// ── SAR alerts (unsubmitted > 24h) ───────────────────────────────────────────

export async function getSARAlerts(): Promise<SARAlert[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: sars } = await admin
    .from('sar_entries')
    .select('id, org_id, client_ref, description, created_at')
    .eq('submitted_to_uifand', false)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })

  if (!sars || sars.length === 0) return []

  const { data: orgs } = await admin.from('organisations').select('id, name')
  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

  return sars.map(sar => ({
    orgId:       sar.org_id,
    orgName:     orgMap[sar.org_id] ?? 'Unknown',
    sarId:       sar.id,
    clientRef:   sar.client_ref,
    description: sar.description,
    createdAt:   sar.created_at,
    hoursOld:    Math.floor((Date.now() - new Date(sar.created_at).getTime()) / 3600000),
  }))
}

// ── Inactive banks ────────────────────────────────────────────────────────────

export async function getInactiveBanks(thresholdDays = 7): Promise<InactiveBank[]> {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const { data: orgs } = await admin.from('organisations').select('id, name')
  if (!orgs) return []

  const results: InactiveBank[] = []

  for (const org of orgs) {
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('id')
      .eq('org_id', org.id)

    const userCount = profiles?.length ?? 0
    let lastLogin: string | null = null

    for (const p of profiles ?? []) {
      try {
        const { data } = await admin.auth.admin.getUserById(p.id)
        if (data?.user?.last_sign_in_at) {
          if (!lastLogin || data.user.last_sign_in_at > lastLogin) {
            lastLogin = data.user.last_sign_in_at
          }
        }
      } catch { /* skip */ }
    }

    const daysInactive = lastLogin
      ? Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000)
      : 9999

    if (daysInactive >= thresholdDays) {
      results.push({ orgId: org.id, orgName: org.name, lastLogin, daysInactive, userCount })
    }
  }

  return results.sort((a, b) => b.daysInactive - a.daysInactive)
}

// ── Report data builders ──────────────────────────────────────────────────────

export async function getAuditLogForReport(orgId?: string, days = 30) {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const since = new Date(Date.now() - days * 86400000).toISOString()

  let query = admin
    .from('audit_log')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (orgId) query = query.eq('org_id', orgId)

  const { data } = await query
  const { data: orgs } = await admin.from('organisations').select('id, name')
  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

  return (data ?? []).map(e => ({ ...e, org_name: orgMap[e.org_id] ?? 'Unknown' }))
}

export async function getSecurityEventsForReport(days = 30) {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data } = await admin
    .from('security_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  const { data: orgs } = await admin.from('organisations').select('id, name')
  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]))

  return (data ?? []).map(e => ({
    ...e,
    org_name: e.org_id ? (orgMap[e.org_id] ?? 'Unknown') : 'System',
  }))
}

export async function getFailedLoginsForReport(days = 30) {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data } = await admin
    .from('failed_login_attempts')
    .select('*')
    .gte('attempted_at', since)
    .order('attempted_at', { ascending: false })

  return data ?? []
}

export async function getAllOrgsForReport() {
  await assertSuperAdmin()
  const admin = createAdminClient()
  const { data } = await admin.from('organisations').select('id, name, country, slug, created_at')
  return data ?? []
}