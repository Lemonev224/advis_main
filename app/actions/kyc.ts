'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseWithAuth } from '@/lib/supabase/server';

type RiskTier = 'low' | 'medium' | 'high';

export async function getKYCClients() {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { data, error } = await supabase
    .from('kyc_clients')
    .select('*')
    .eq('org_id', orgId)
    .order('review_due_date', { ascending: true });
  if (error) throw new Error(error.message);

  const today = new Date().toISOString().split('T')[0];
  return (data ?? []).map(client => {
    if (client.review_due_date < today && client.status !== 'overdue') {
      return { ...client, status: 'overdue' };
    }
    const daysUntil = (new Date(client.review_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 30 && client.status === 'current') {
      return { ...client, status: 'due_soon' };
    }
    return client;
  });
}

export async function addKYCClient(input: {
  name: string;
  accountRef: string;
  riskTier: RiskTier;
  onboardingDate: string;
  reviewDueDate: string;
  documentsReceived: string[];
  documentsMissing: string[];
}) {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { error } = await supabase.from('kyc_clients').insert({
    org_id:               orgId,
    name:                 input.name,
    account_ref:          input.accountRef,
    risk_tier:            input.riskTier,
    onboarding_date:      input.onboardingDate,
    review_due_date:      input.reviewDueDate,
    documents_received:   input.documentsReceived,
    documents_missing:    input.documentsMissing,
    status:               'current',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/kyc');
}

export async function markClientReviewed(id: string) {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { error } = await supabase
    .from('kyc_clients')
    .update({
      status:        'current',
      last_reviewed: new Date().toISOString().split('T')[0],
      updated_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  revalidatePath('/kyc');
}

export async function requestDocuments(id: string) {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { error } = await supabase
    .from('kyc_clients')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  revalidatePath('/kyc');
}