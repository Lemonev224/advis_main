import { Suspense } from 'react'
import { getObligations } from '@/app/actions/obligations'
import { getKYCClients } from '@/app/actions/kyc'
import { getSAREntries } from '@/app/actions/sar'
import { getEvidenceFiles } from '@/app/actions/evidence'
import { getOrgInfo } from '@/app/actions/admin'
import AuditReportClient from './AuditReportClient'

export const dynamic = 'force-dynamic'

export default async function AuditReportPage() {
  const [obligations, kycClients, sarEntries, evidenceFiles, orgInfo] = await Promise.all([
    getObligations(),
    getKYCClients(),
    getSAREntries(),
    getEvidenceFiles(),
    getOrgInfo(),
  ])

  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Loading audit data…</div>}>
      <AuditReportClient
        obligations={obligations}
        kycClients={kycClients}
        sarEntries={sarEntries}
        evidenceFiles={evidenceFiles}
        orgName={orgInfo?.name ?? 'Your Institution'}
      />
    </Suspense>
  )
}