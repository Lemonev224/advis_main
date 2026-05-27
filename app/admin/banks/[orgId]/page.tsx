import { notFound } from 'next/navigation'
import { getOrgWithUsers } from '@/app/actions/super-admin'
import BankDetailClient from './BankDetailClient'

export const dynamic = 'force-dynamic'

export default async function BankDetailPage({ params }: { params: { orgId: string } }) {
  const result = await getOrgWithUsers(params.orgId)

  if (!result || !result.org) notFound()

  return <BankDetailClient org={result.org} users={result.users ?? []} />
}