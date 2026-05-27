// app/admin/banks/page.tsx
import { getAllOrgs } from '@/app/actions/super-admin'
import BanksClient from './BanksClient'

export const dynamic = 'force-dynamic'

export default async function BanksPage() {
  const orgs = await getAllOrgs()
  return <BanksClient orgs={orgs} />
}