'use client'

// app/admin/reports/page.tsx
// All report generation happens client-side using data fetched from server actions.
// CSV uses plain JS. PDF uses the browser's print dialog (no extra dependencies).

import { useState, useTransition } from 'react'
import {
  FileDown, FileText, Shield, BarChart3,
  ScrollText, Loader2, CheckCircle2, Calendar,
} from 'lucide-react'
import clsx from 'clsx'
import {
  getAuditLogForReport,
  getSecurityEventsForReport,
  getFailedLoginsForReport,
  getAllOrgsForReport,
  getCrossBankCompliance,
} from '@/app/actions/super-admin-compliance'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val === null || val === undefined ? '' : String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

function printPDF(html: string, title: string) {
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow popups to download PDF reports'); return }

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1e293b; padding: 32px; }
        h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        h2 { font-size: 13px; font-weight: 700; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .meta { font-size: 10px; color: #94a3b8; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; padding: 6px 8px; }
        td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; }
        .badge-red { background: #fef2f2; color: #b91c1c; }
        .badge-green { background: #f0fdf4; color: #15803d; }
        .badge-amber { background: #fffbeb; color: #b45309; }
        .badge-slate { background: #f1f5f9; color: #475569; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; }
        .stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #0f172a; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      ${html}
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `)
  win.document.close()
}

// ── Report definitions ────────────────────────────────────────────────────────

type ReportId = 'audit-csv' | 'security-pdf' | 'compliance-pdf' | 'platform-csv'

interface ReportDef {
  id:          ReportId
  icon:        React.ElementType
  title:       string
  description: string
  format:      'CSV' | 'PDF'
  color:       string
}

const reports: ReportDef[] = [
  {
    id:          'audit-csv',
    icon:        ScrollText,
    title:       'Audit Log Export',
    description: 'All database actions across every bank for the selected period. Includes who did what, when, and from which IP.',
    format:      'CSV',
    color:       'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    id:          'security-pdf',
    icon:        Shield,
    title:       'Platform Security Report',
    description: 'Failed login attempts, force logouts, user provisioning events, and never-activated accounts.',
    format:      'PDF',
    color:       'text-red-700 bg-red-50 border-red-200',
  },
  {
    id:          'compliance-pdf',
    icon:        BarChart3,
    title:       'Compliance Status Report',
    description: 'Cross-bank compliance health — obligation completion rates, SAR submission status, KYC gaps, and evidence coverage.',
    format:      'PDF',
    color:       'text-green-700 bg-green-50 border-green-200',
  },
  {
    id:          'platform-csv',
    icon:        FileText,
    title:       'Platform Activity Export',
    description: 'All banks, users, provisioning dates, last login times, and security events in one flat CSV.',
    format:      'CSV',
    color:       'text-slate-700 bg-slate-50 border-slate-200',
  },
]

// ── Generators ────────────────────────────────────────────────────────────────

async function generateAuditCSV(days: number) {
  const data = await getAuditLogForReport(undefined, days)
  const rows = data.map(e => ({
    date:       new Date(e.created_at).toISOString(),
    bank:       e.org_name,
    action:     e.action,
    table:      e.table_name,
    record_id:  e.record_id ?? '',
    user_id:    e.user_id ?? 'system',
    ip_address: e.ip_address ?? '',
  }))
  downloadCSV(toCSV(rows), `audit-log-${days}d-${new Date().toISOString().slice(0,10)}.csv`)
}

async function generatePlatformCSV(days: number) {
  const [orgs, secEvents, failedLogins] = await Promise.all([
    getAllOrgsForReport(),
    getSecurityEventsForReport(days),
    getFailedLoginsForReport(days),
  ])

  const rows = orgs.map(org => {
    const orgEvents   = secEvents.filter(e => e.org_id === org.id)
    const provEvents  = orgEvents.filter(e => e.event_type === 'bank_provisioned')
    const logoutEvents = orgEvents.filter(e => e.event_type === 'force_logout')
    const orgFailed   = failedLogins.filter((f: {email?: string}) => f.email?.includes(org.slug))

    return {
      org_id:           org.id,
      org_name:         org.name,
      country:          org.country,
      created_at:       org.created_at,
      security_events:  orgEvents.length,
      force_logouts:    logoutEvents.length,
      failed_logins:    orgFailed.length,
    }
  })

  downloadCSV(toCSV(rows), `platform-activity-${days}d-${new Date().toISOString().slice(0,10)}.csv`)
}

async function generateSecurityPDF(days: number) {
  const [events, failedLogins] = await Promise.all([
    getSecurityEventsForReport(days),
    getFailedLoginsForReport(days),
  ])

  const now    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const period = `Last ${days} days`

  const eventRows = events.slice(0, 100).map(e => `
    <tr>
      <td>${new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
      <td>${e.org_name ?? 'System'}</td>
      <td><span class="badge badge-slate">${e.event_type.replace(/_/g, ' ')}</span></td>
      <td>${e.description ?? '—'}</td>
    </tr>
  `).join('')

  const failedRows = failedLogins.slice(0, 50).map((f: Record<string, unknown>) => `
    <tr>
      <td>${new Date(f.attempted_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
      <td>${f.email as string}</td>
      <td>${f.ip_address as string ?? '—'}</td>
    </tr>
  `).join('')

  const html = `
    <h1>Platform Security Report</h1>
    <div class="meta">Generated ${now} · ${period} · Advisorly Super Admin</div>

    <div class="stat-grid">
      <div class="stat"><div class="stat-label">Security Events</div><div class="stat-value">${events.length}</div></div>
      <div class="stat"><div class="stat-label">Failed Logins</div><div class="stat-value">${failedLogins.length}</div></div>
      <div class="stat"><div class="stat-label">Force Logouts</div><div class="stat-value">${events.filter(e => e.event_type === 'force_logout').length}</div></div>
      <div class="stat"><div class="stat-label">Invites Sent</div><div class="stat-value">${events.filter(e => e.event_type === 'invite_sent').length}</div></div>
    </div>

    <h2>Security Events</h2>
    <table>
      <thead><tr><th>Date</th><th>Bank</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>${eventRows || '<tr><td colspan="4">No events in this period</td></tr>'}</tbody>
    </table>

    <h2>Failed Login Attempts</h2>
    <table>
      <thead><tr><th>Date</th><th>Email</th><th>IP Address</th></tr></thead>
      <tbody>${failedRows || '<tr><td colspan="3">No failed logins in this period</td></tr>'}</tbody>
    </table>
  `

  printPDF(html, `Security Report — ${now}`)
}

async function generateCompliancePDF(days: number) {
  const banks = await getCrossBankCompliance()
  const now   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const critical = banks.filter(b => {
    return b.overdueObligations > 0 || b.pendingSARs > 2 || (b.inactiveDays ?? 0) > 30
  })
  const healthy = banks.filter(b => {
    return b.overdueObligations === 0 && b.pendingSARs === 0 && b.obligationsWithNoEvidence === 0
  })

  const bankRows = banks.map(b => `
    <tr>
      <td><strong>${b.orgName}</strong><br/><span style="color:#94a3b8;font-size:9px">${b.country}</span></td>
      <td>${b.completedObligations}/${b.totalObligations}
        ${b.overdueObligations > 0 ? `<br/><span class="badge badge-red">${b.overdueObligations} overdue</span>` : ''}
      </td>
      <td>${b.totalKyc} clients
        ${b.kycMissingDocs > 0 ? `<br/><span class="badge badge-amber">${b.kycMissingDocs} missing docs</span>` : ''}
      </td>
      <td>${b.pendingSARs === 0
        ? '<span class="badge badge-green">All submitted</span>'
        : `<span class="badge badge-red">${b.pendingSARs} pending</span>`
      }</td>
      <td>${b.obligationsWithNoEvidence === 0
        ? '<span class="badge badge-green">Covered</span>'
        : `<span class="badge badge-amber">${b.obligationsWithNoEvidence} gaps</span>`
      }</td>
      <td>${b.lastLogin
        ? `${new Date(b.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : '<span class="badge badge-red">Never</span>'
      }</td>
    </tr>
  `).join('')

  const html = `
    <h1>Compliance Status Report</h1>
    <div class="meta">Generated ${now} · Advisorly Super Admin</div>

    <div class="stat-grid">
      <div class="stat"><div class="stat-label">Total Banks</div><div class="stat-value">${banks.length}</div></div>
      <div class="stat"><div class="stat-label">Critical</div><div class="stat-value" style="color:#dc2626">${critical.length}</div></div>
      <div class="stat"><div class="stat-label">Healthy</div><div class="stat-value" style="color:#16a34a">${healthy.length}</div></div>
      <div class="stat"><div class="stat-label">Pending SARs</div><div class="stat-value">${banks.reduce((s, b) => s + b.pendingSARs, 0)}</div></div>
    </div>

    <h2>Bank Compliance Status</h2>
    <table>
      <thead>
        <tr>
          <th>Bank</th>
          <th>Obligations</th>
          <th>KYC</th>
          <th>SARs</th>
          <th>Evidence</th>
          <th>Last Login</th>
        </tr>
      </thead>
      <tbody>${bankRows}</tbody>
    </table>
  `

  printPDF(html, `Compliance Report — ${now}`)
}

// ── Report Card ───────────────────────────────────────────────────────────────

function ReportCard({
  report,
  days,
  onGenerate,
  generating,
  done,
}: {
  report:     ReportDef
  days:       number
  onGenerate: () => void
  generating: boolean
  done:       boolean
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2px] p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={clsx('w-9 h-9 rounded-[2px] border flex items-center justify-center flex-shrink-0', report.color)}>
          <report.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{report.title}</span>
            <span className={clsx(
              'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border',
              report.format === 'CSV' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-100 border-slate-200'
            )}>
              {report.format}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{report.description}</p>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center justify-center gap-2 w-full py-2 text-[11px] font-bold uppercase tracking-widest rounded-[2px] transition-colors bg-slate-900 text-white hover:bg-black disabled:opacity-60"
      >
        {generating
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
          : done
          ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Done — check downloads</>
          : <><FileDown className="w-3.5 h-3.5" /> Generate {report.format} ({days}d)</>
        }
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [days, setDays]           = useState(30)
  const [generating, setGenerating] = useState<ReportId | null>(null)
  const [done, setDone]           = useState<ReportId | null>(null)
  const [, start]                 = useTransition()

  const generate = (id: ReportId) => {
    setGenerating(id)
    setDone(null)
    start(async () => {
      try {
        if (id === 'audit-csv')     await generateAuditCSV(days)
        if (id === 'platform-csv')  await generatePlatformCSV(days)
        if (id === 'security-pdf')  await generateSecurityPDF(days)
        if (id === 'compliance-pdf') await generateCompliancePDF(days)
        setDone(id)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Report generation failed')
      } finally {
        setGenerating(null)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Download compliance and security reports for any period</p>
      </div>

      {/* Period selector */}
      <div className="bg-white border border-slate-200 rounded-[2px] px-4 py-3 flex items-center gap-3 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Report period:</span>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] border transition-colors',
                days === d
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              )}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            days={days}
            onGenerate={() => generate(report.id)}
            generating={generating === report.id}
            done={done === report.id}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400">
        CSV files download directly. PDF reports open in a new tab — use your browser's print dialog and select "Save as PDF".
      </p>
    </div>
  )
}