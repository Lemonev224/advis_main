import { Suspense } from 'react';
import { getKYCClients } from '@/app/actions/kyc';
import KYCPageClient from './KYCPageClient';

export default async function KYCPage() {
  const clients = await getKYCClients();
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading KYC data…</div>}>
      <KYCPageClient initialClients={clients} />
    </Suspense>
  );
}