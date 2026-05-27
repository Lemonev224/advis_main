import { Suspense } from 'react';
import { getObligations } from '@/app/actions/obligations';
import ObligationsPageClient from './ObligationsPageClient';

export default async function ObligationsPage() {
  const obligations = await getObligations();
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading obligations…</div>}>
      <ObligationsPageClient initialObligations={obligations} />
    </Suspense>
  );
}