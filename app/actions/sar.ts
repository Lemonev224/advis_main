'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseWithAuth } from '@/lib/supabase/server';

export async function getSAREntries() {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { data, error } = await supabase
    .from('sar_entries')
    .select('*')
    .eq('org_id', orgId)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function logSAREntry(entry: { date: string; clientRef: string; description: string }) {
  const { supabase, orgId, role } = await getSupabaseWithAuth();
  if (!['admin', 'compliance_officer'].includes(role)) {
    throw new Error('Insufficient permissions to log SAR entries');
  }
  const { error } = await supabase.from('sar_entries').insert({
    org_id:              orgId,
    date:                entry.date,
    client_ref:          entry.clientRef,
    description:         entry.description,
    submitted_to_uifand: false,
    follow_up_status:    'pending',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/sar');
}

export async function submitToUIFAND(id: string, referenceNumber: string) {
  const { supabase, orgId, role } = await getSupabaseWithAuth();
  if (!['admin', 'compliance_officer'].includes(role)) {
    throw new Error('Insufficient permissions to submit SAR');
  }
  const { error } = await supabase
    .from('sar_entries')
    .update({
      submitted_to_uifand: true,
      submission_date:     new Date().toISOString().split('T')[0],
      reference_number:    referenceNumber,
    })
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('submitted_to_uifand', false);
  if (error) throw new Error(error.message);
  revalidatePath('/sar');
}

export async function closeSAREntry(id: string) {
  const { supabase, orgId, role } = await getSupabaseWithAuth();
  
  if (!['admin', 'compliance_officer'].includes(role)) {
    throw new Error('Insufficient permissions to close SAR');
  }

  const { error } = await supabase
    .from('sar_entries')
    .update({ 
      follow_up_status: 'closed'
      // ❌ Do NOT include 'updated_at' – the column does not exist
    })
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('submitted_to_uifand', true);   // optional: only close if already submitted

  if (error) throw new Error(error.message);
  revalidatePath('/sar');
}