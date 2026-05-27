// app/admin/access-requests/page.tsx
import { getAccessRequests } from '@/app/actions/super-admin'
import AccessRequestsClient from './AccessRequestsClient'

export const dynamic = 'force-dynamic'

export default async function AccessRequestsPage() {
  const requests = await getAccessRequests()
  return <AccessRequestsClient requests={requests} />
}