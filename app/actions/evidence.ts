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

export async function uploadEvidenceFile(formData: FormData) {
  const { supabase, orgId, userId } = await getSupabaseWithAuth();

  const file = formData.get('file') as File;
  const obligationId = formData.get('obligationId') as string;
  const uploadedBy = formData.get('uploadedBy') as string;

  if (!file || !obligationId || !uploadedBy) {
    throw new Error('Missing required fields');
  }

  // Get obligation to know its regulation
  const { data: obligation, error: oblError } = await supabase
    .from('obligations')
    .select('regulation')
    .eq('id', obligationId)
    .single();

  if (oblError || !obligation) {
    throw new Error('Obligation not found');
  }

  // Build storage path with organisation ID prefix
  const safeFileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const storagePath = `${orgId}/${safeFileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(storagePath, file);

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Helper: get file type from name
  const getFileType = (f: File): string => {
    const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
    const map: Record<string, string> = {
      PDF: 'PDF', DOCX: 'DOCX', DOC: 'DOCX', XLSX: 'XLSX', XLS: 'XLSX',
      PNG: 'PNG', JPG: 'JPG', JPEG: 'JPG'
    };
    return map[ext] || ext;
  };

  // Helper: format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Create database record
  const { error: dbError } = await supabase.from('evidence_files').insert({
    org_id: orgId,
    name: file.name,
    regulation: obligation.regulation,
    obligation_id: obligationId,
    upload_date: new Date().toISOString().split('T')[0],
    file_type: getFileType(file),
    file_size: formatBytes(file.size),
    uploaded_by: uploadedBy,
    storage_path: storagePath,
  });

  if (dbError) {
    // Rollback: delete the uploaded file
    await supabase.storage.from('evidence').remove([storagePath]);
    throw new Error(`Database insert failed: ${dbError.message}`);
  }

  revalidatePath('/evidence');
  revalidatePath('/obligations');
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

export async function deleteEvidenceFile(id: string, storagePath?: string | null) {
  const { supabase, orgId } = await getSupabaseWithAuth();

  // First, verify the file belongs to this org
  const { data: file, error: fetchError } = await supabase
    .from('evidence_files')
    .select('storage_path')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !file) throw new Error('File not found');

  // Delete from storage if a path exists
  if (storagePath || file.storage_path) {
    const pathToDelete = storagePath ?? file.storage_path;
    // Ensure the path is within the org's folder (security)
    if (pathToDelete && pathToDelete.startsWith(orgId)) {
      const { error: storageError } = await supabase.storage
        .from('evidence')
        .remove([pathToDelete]);
      if (storageError) console.warn('Storage deletion failed:', storageError.message);
    }
  }

  // Delete the database record
  const { error } = await supabase
    .from('evidence_files')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) throw new Error(error.message);
  revalidatePath('/evidence');
}

export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const { supabase, orgId } = await getSupabaseWithAuth();

  // Security: ensure the path belongs to this org
  if (!storagePath.startsWith(orgId)) {
    throw new Error('Unauthorized access to file');
  }

  // Attempt to create a signed URL – if the file is missing, Supabase returns an error
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(storagePath, 60); // 60 seconds expiry

  if (error) {
    // Provide a user-friendly message for the common "missing file" case
    if (error.message === 'Object not found') {
      throw new Error('The file is missing from storage. Please upload it again.');
    }
    throw new Error(error.message);
  }

  return data.signedUrl;
}