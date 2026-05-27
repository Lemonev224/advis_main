// app/admin/page.tsx
import Link from 'next/link'
import { getAdminOverview, getAllOrgs, getAuditLog } from '@/app/actions/super-admin'
import { Building2, Users, Clock, AlertTriangle, FileWarning, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatCard({
  label, value, sub, icon: Icon, alert = false, href,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  alert?: boolean
  href?: string
}) {
  const content = (
    <div className={`bg-white border rounded-[2px] px-5 py-4 flex items-start justify-between gap-4 ${alert && Number(value) > 0 ? 'border-red-200' : 'border-slate-200'}`}>
      <div>
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${alert && Number(value) > 0 ? 'text-red-600' : 'text-slate-500'}`}>{label}</div>
        <div className={`text-3xl font-bold leading-none ${alert && Number(value) > 0 ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
        {sub && <div className="text-[11px] text-slate-400 font-medium mt-1.5">{sub}</div>}
      </div>
      <div className={`w-9 h-9 rounded-[2px] flex items-center justify-center flex-shrink-0 ${alert && Number(value) > 0 ? 'bg-red-50' : 'bg-slate-100'}`}>
        <Icon className={`w-4 h-4 ${alert && Number(value) > 0 ? 'text-red-600' : 'text-slate-500'}`} />
      </div>
    </div>
  )
  if (href) return <Link href={href} className="hover:opacity-90 transition-opacity block">{content}</Link>
  return content
}

export default async function AdminOverviewPage() {
  const [overview, orgs, auditLog] = await Promise.all([
    getAdminOverview(),
    getAllOrgs(),
    getAuditLog(10),
  ])

  const recentOrgs = orgs.slice(0, 5)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Banks" value={overview.totalOrgs} icon={Building2} href="/admin/banks" sub="active organisations" />
        <StatCard label="Users" value={overview.totalUsers} icon={Users} sub="across all banks" />
        <StatCard label="Pending Requests" value={overview.pendingRequests} icon={Clock} alert href="/admin/access-requests" sub="awaiting review" />
        <StatCard label="Platform Issues" value={overview.pendingSARs + overview.overdueObligations} icon={AlertTriangle} alert sub={`${overview.pendingSARs} SARs · ${overview.overdueObligations} overdue`} />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent banks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Banks</h2>
            <Link href="/admin/banks" className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
              All banks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-[2px] divide-y divide-slate-100">
            {recentOrgs.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No banks yet</div>
            )}
            {recentOrgs.map(org => (
              <Link
                key={org.id}
                href={`/admin/banks/${org.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{org.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {org.userCount} user{org.userCount !== 1 ? 's' : ''} · {org.country}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium text-right">
                  {org.lastLogin
                    ? `Last login ${new Date(org.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                    : 'Never logged in'}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent audit log */}
        <div className="space-y-2">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h2>
          <div className="bg-white border border-slate-200 rounded-[2px] divide-y divide-slate-100">
            {auditLog.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No activity yet</div>
            )}
            {auditLog.map(entry => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-slate-100 text-slate-600 flex-shrink-0">
                      {entry.action}
                    </span>
                    <span className="text-xs text-slate-700 font-medium truncate">{entry.table_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{entry.org_name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}