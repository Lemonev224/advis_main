// app/admin/audit-log/page.tsx
import { getAuditLog }  from '@/app/actions/super-admin-security'
import { getAllOrgs }    from '@/app/actions/super-admin'
import AuditLogClient   from './AuditLogClient'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  const [{ entries, total }, orgs] = await Promise.all([
    getAuditLog({ limit: 50, offset: 0 }),
    getAllOrgs(),
  ])

  return <AuditLogClient initialEntries={entries} initialTotal={total} orgs={orgs} />
}