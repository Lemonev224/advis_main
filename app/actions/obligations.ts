'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseWithAuth } from '@/lib/supabase/server';
import type { ObligationStatus } from '@/lib/data';

export interface ObligationRow {
  id: string;
  org_id: string;
  regulation: string;
  regulation_code: string;
  title: string;
  description: string;
  owner: string;
  due_date: string;
  status: ObligationStatus;
  evidence_count: number;
  category: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

function computeStatus(row: ObligationRow): ObligationRow {
  if (row.status === 'compliant') return row;
  const today = new Date().toISOString().split('T')[0];
  if (row.due_date < today && row.status !== 'overdue') {
    return { ...row, status: 'overdue' };
  }
  return row;
}

export async function getObligations(): Promise<ObligationRow[]> {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { data, error } = await supabase
    .from('obligations')
    .select('*')
    .eq('org_id', orgId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(computeStatus);
}

export async function getDashboardStats() {
  const { supabase, orgId } = await getSupabaseWithAuth();

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch all required data in parallel
  const [
    { data: obligations },
    { data: kyc },
    { data: sar },
    { data: evidence },
  ] = await Promise.all([
    supabase.from('obligations').select('status, due_date').eq('org_id', orgId),
    supabase.from('kyc_clients').select('review_due_date').eq('org_id', orgId),
    supabase.from('sar_entries').select('submitted_to_uifand, follow_up_status').eq('org_id', orgId),
    supabase.from('evidence_files').select('id').eq('org_id', orgId),
  ]);

  // --- Compute obligations with date-based overdue logic ---
  let compliant = 0, overdue = 0, inProgress = 0, notStarted = 0;
  for (const ob of obligations ?? []) {
    let status = ob.status;
    if (status !== 'compliant' && ob.due_date < today) {
      status = 'overdue';
    }
    if (status === 'compliant') compliant++;
    else if (status === 'overdue') overdue++;
    else if (status === 'in_progress') inProgress++;
    else if (status === 'not_started') notStarted++;
  }

  // --- KYC stats (unchanged) ---
  const kycData = kyc ?? [];
  const overdueKYC = kycData.filter(c => c.review_due_date < today).length;
  const dueSoonKYC = kycData.filter(c => c.review_due_date >= today && c.review_due_date <= thirtyDaysOut).length;
  const currentKYC = kycData.filter(c => c.review_due_date > thirtyDaysOut).length;

  // --- SAR stats (unchanged) ---
  const sarData = sar ?? [];
  const unsubmittedSAR = sarData.filter(s => !s.submitted_to_uifand).length;
  const pendingSAR = sarData.filter(s => s.follow_up_status === 'pending').length;

  // --- Evidence stats (unchanged) ---
  const totalEvidence = evidence?.length ?? 0;

  return {
    obligations: {
      total: obligations?.length ?? 0,
      compliant,
      overdue,
      pending: inProgress,   // field name kept as `pending` for backward compatibility
    },
    kyc: {
      total: kycData.length,
      overdue: overdueKYC,
      due_soon: dueSoonKYC,
      current: currentKYC,
    },
    sar: {
      total: sarData.length,
      unsubmitted: unsubmittedSAR,
      pending: pendingSAR,
    },
    evidence: {
      total: totalEvidence,
    },
  };
}
const REGULATION_COLORS: Record<string, string> = {
  'AML Law 14/2017':       '#dc2626',
  'MiFID II (Law 7/2024)': '#2563eb',
  'AFA Annual Review':     '#16a34a',
  'CRS/FATCA':             '#9333ea',
};

export async function addObligation(input: {
  regulation: string;
  regulationCode: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  category: string;
}) {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { error } = await supabase.from('obligations').insert({
    org_id:          orgId,
    regulation:      input.regulation,
    regulation_code: input.regulationCode,
    title:           input.title,
    description:     input.description,
    owner:           input.owner,
    due_date:        input.dueDate,
    category:        input.category,
    status:          'not_started',
    evidence_count:  0,
    color:           REGULATION_COLORS[input.regulation] ?? '#64748b',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/obligations');
  revalidatePath('/');
  revalidatePath('/audit-report');
}

export async function updateObligationStatus(id: string, status: ObligationStatus) {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { error } = await supabase
    .from('obligations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  revalidatePath('/obligations');
  revalidatePath('/');
}