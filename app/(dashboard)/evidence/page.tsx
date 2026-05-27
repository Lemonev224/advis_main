import { Suspense } from 'react';
import { getEvidenceFiles } from '@/app/actions/evidence';
import { getObligations } from '@/app/actions/obligations';
import EvidencePageClient from './EvidencePageClient';

export const dynamic = 'force-dynamic';

export default async function EvidencePage() {
  const [files, obligations] = await Promise.all([
    getEvidenceFiles(),
    getObligations(),
  ]);

  // Map DB obligations to the shape EvidencePageClient expects
  const mappedObligations = obligations.map(o => ({
    id: o.id,
    title: o.title,
    regulation: o.regulation,
    regulation_code: o.regulation_code,
    evidenceCount: o.evidence_count,
    color: o.color,
  }));

  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading evidence files…</div>}>
      <EvidencePageClient initialFiles={files} obligations={mappedObligations} />
    </Suspense>
  );
}