'use client'

import { useState, useTransition } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { getAuditLog } from '@/app/actions/super-admin-security'
import type { AuditEntry } from '@/app/actions/super-admin-security'
import type { SuperOrg } from '@/app/actions/super-admin'

const actionColors: Record<string, string> = {
  INSERT: 'text-green-700 bg-green-50 border-green-200',
  UPDATE: 'text-blue-700 bg-blue-50 border-blue-200',
  DELETE: 'text-red-700 bg-red-50 border-red-200',
}

const PAGE_SIZE = 50

interface Props {
  initialEntries: AuditEntry[]
  initialTotal: number
  orgs: SuperOrg[]
}

export default function AuditLogClient({ initialEntries, initialTotal, orgs }: Props) {
  const [entries, setEntries]     = useState<AuditEntry[]>(initialEntries)
  const [total, setTotal]         = useState(initialTotal)
  const [orgFilter, setOrgFilter] = useState('')
  const [actionFilter, setAction] = useState('')
  const [tableFilter, setTable]   = useState('')
  const [page, setPage]           = useState(0)
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [isPending, start]        = useTransition()

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const load = (opts: { orgId?: string; action?: string; table?: string; page?: number }) => {
    const p = opts.page ?? 0
    start(async () => {
      const result = await getAuditLog({
        orgId:  (opts.orgId  !== undefined ? opts.orgId  : orgFilter)  || undefined,
        action: (opts.action !== undefined ? opts.action : actionFilter) || undefined,
        table:  (opts.table  !== undefined ? opts.table  : tableFilter)  || undefined,
        limit:  PAGE_SIZE,
        offset: p * PAGE_SIZE,
      })
      setEntries(result.entries)
      setTotal(result.total)
      setPage(p)
    })
  }

  const applyFilters = () => load({ orgId: orgFilter, action: actionFilter, table: tableFilter, page: 0 })

  const clearFilters = () => {
    setOrgFilter(''); setAction(''); setTable(''); load({ page: 0 })
  }

  const tables = Array.from(new Set(entries.map(e => e.table_name))).sort()

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total entries across all banks</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-[2px] px-4 py-3 flex items-center gap-3 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

        <select
          value={orgFilter}
          onChange={e => setOrgFilter(e.target.value)}
          className="h-8 px-2 text-xs text-slate-700 border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500"
        >
          <option value="">All banks</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        <select
          value={actionFilter}
          onChange={e => setAction(e.target.value)}
          className="h-8 px-2 text-xs text-slate-700 border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500"
        >
          <option value="">All actions</option>
          {['INSERT', 'UPDATE', 'DELETE'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={tableFilter}
          onChange={e => setTable(e.target.value)}
          className="h-8 px-2 text-xs text-slate-700 border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500"
        >
          <option value="">All tables</option>
          {['kyc_clients', 'obligations', 'sar_entries', 'evidence_files', 'user_profiles'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          className="flex items-center gap-1.5 h-8 px-3 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white rounded-[2px] hover:bg-black transition-colors"
        >
          <Search className="w-3 h-3" /> Apply
        </button>

        {(orgFilter || actionFilter || tableFilter) && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
          >
            Clear
          </button>
        )}

        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">When</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Table</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No entries found</td>
              </tr>
            )}
            {entries.map(entry => (
              <>
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-700">{entry.org_name}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border',
                      actionColors[entry.action] ?? 'text-slate-600 bg-slate-100 border-slate-200'
                    )}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{entry.table_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {entry.user_id ? entry.user_id.slice(0, 8) + '…' : 'system'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {entry.ip_address ?? '—'}
                  </td>
                </tr>
                {expanded === entry.id && (
                  <tr key={`${entry.id}-detail`} className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        {entry.old_values && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Before</div>
                            <pre className="text-[11px] text-slate-700 bg-white border border-slate-200 rounded-[2px] p-3 overflow-auto max-h-40">
                              {JSON.stringify(entry.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.new_values && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">After</div>
                            <pre className="text-[11px] text-slate-700 bg-white border border-slate-200 rounded-[2px] p-3 overflow-auto max-h-40">
                              {JSON.stringify(entry.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {!entry.old_values && !entry.new_values && (
                          <div className="col-span-2 text-xs text-slate-400">No value diff recorded</div>
                        )}
                      </div>
                      {entry.record_id && (
                        <div className="text-[10px] text-slate-400 font-mono mt-2">
                          Record ID: {entry.record_id}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0 || isPending}
              onClick={() => load({ page: page - 1 })}
              className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1 || isPending}
              onClick={() => load({ page: page + 1 })}
              className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}