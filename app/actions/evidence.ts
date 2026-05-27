'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseWithAuth } from '@/lib/supabase/server';

export interface EvidenceRow {
  id: string;
  org_id: string;
  name: string;
  regulation: string;
  obligation_id: string;
  upload_date: string;
  file_type: string;
  file_size: string;
  uploaded_by: string;
  storage_path?: string | null;
  created_at?: string;
}

export async function getEvidenceFiles(): Promise<EvidenceRow[]> {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { data, error } = await supabase
    .from('evidence_files')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadEvidenceFile(file: {
  name: string;
  regulation: string;
  obligationId: string;
  fileType: string;
  fileSize: string;
  storagePath?: string;
}) {
  const { supabase, orgId, userId } = await getSupabaseWithAuth();
  const safePath = file.storagePath
    ? `${orgId}/${file.storagePath.replace(/^.*\//, '')}`
    : undefined;

  const { error } = await supabase.from('evidence_files').insert({
    org_id:        orgId,
    name:          file.name,
    regulation:    file.regulation,
    obligation_id: file.obligationId,
    upload_date:   new Date().toISOString().split('T')[0],
    file_type:     file.fileType,
    file_size:     file.fileSize,
    uploaded_by:   userId,
    storage_path:  safePath,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/evidence');
}

export async function getEvidenceFileUrl(evidenceId: string): Promise<string> {
  const { supabase, orgId } = await getSupabaseWithAuth();
  const { data: record, error: fetchError } = await supabase
    .from('evidence_files')
    .select('storage_path')
    .eq('id', evidenceId)
    .eq('org_id', orgId)
    .single();
  if (fetchError || !record?.storage_path) throw new Error('File not found');
  if (!record.storage_path.startsWith(orgId)) throw new Error('Storage path violation');
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(record.storage_path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}