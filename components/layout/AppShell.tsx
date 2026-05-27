// components/layout/AppShell.tsx
// Server component wrapper — receives org context from layout and passes to client children

import TopBar from './TopBar'
import Sidebar from './Sidebar'

interface Props {
  orgName: string
  userRole: string
  children: React.ReactNode
}

export default function AppShell({ orgName, userRole, children }: Props) {
  return (
    <div className="min-h-screen flex">
      <Sidebar orgName={orgName} userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}