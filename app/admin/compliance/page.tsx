// app/admin/compliance/page.tsx
import { getCrossBankCompliance, getSARAlerts, getInactiveBanks } from '@/app/actions/super-admin-compliance'
import ComplianceClient from "./ComplianceClient"

export const dynamic = 'force-dynamic'

export default async function CompliancePage() {
  const [banks, sarAlerts, inactiveBanks] = await Promise.all([
    getCrossBankCompliance(),
    getSARAlerts(),
    getInactiveBanks(7),
  ])

  return (
    <ComplianceClient
      banks={banks}
      sarAlerts={sarAlerts}
      inactiveBanks={inactiveBanks}
    />
  )
}