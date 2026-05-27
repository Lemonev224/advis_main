import { Suspense } from 'react';
import { getSAREntries } from '@/app/actions/sar';
import SARPageClient from './SARPageClient';

export default async function SARPage() {
  const entries = await getSAREntries();
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading SAR entries…</div>}>
      <SARPageClient initialEntries={entries} />
    </Suspense>
  );
}