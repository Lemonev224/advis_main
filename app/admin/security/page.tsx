// app/admin/security/page.tsx
import {
  getFailedLogins, getSecurityEvents,
  getActiveSessions, getNeverActivatedUsers,
  getSecurityOverview,
} from '@/app/actions/super-admin-security'
import SecurityClient from './SecurityClient'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const [overview, securityEvents, activeSessions] = await Promise.all([
    getSecurityOverview(),
    getSecurityEvents(30),
    getActiveSessions(),
  ])

  return (
    <SecurityClient
      failedLogins={overview.highRiskLogins}
      securityEvents={securityEvents}
      activeSessions={activeSessions}
      neverActivated={overview.neverActivated}
      stats={{
        highRiskLoginCount:  overview.highRiskLoginCount,
        failedLoginCount:    overview.failedLoginCount,
        neverActivatedCount: overview.neverActivatedCount,
        totalActiveSessions: overview.totalActiveSessions,
      }}
    />
  )
}