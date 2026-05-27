'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Clock, CheckCircle2, XCircle,
  Users, FileWarning, Building2, ChevronDown, ChevronUp,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  BankComplianceRow, SARAlert, InactiveBank,
} from '@/app/actions/super-admin-compliance'

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthScore(bank: BankComplianceRow): 'good' | 'warn' | 'critical' {
  if (bank.overdueObligations > 0 || bank.pendingSARs > 2 || (bank.inactiveDays ?? 0) > 30) return 'critical'
  if (bank.obligationsWithNoEvidence > 0 || bank.pendingSARs > 0 || (bank.inactiveDays ?? 0) > 14) return 'warn'
  return 'good'
}

const healthConfig = {
  good:     { color: 'text-green-700 bg-green-50 border-green-200',   dot: 'bg-green-500',  label: 'Healthy' },
  warn:     { color: 'text-amber-700 bg-amber-50 border-amber-200',   dot: 'bg-amber-400',  label: 'Attention' },
  critical: { color: 'text-red-700 bg-red-50 border-red-200',         dot: 'bg-red-500',    label: 'Critical' },
}

function Pct({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 100 : Math.round((value / total) * 100)
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 flex-shrink-0 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── SAR Alerts ────────────────────────────────────────────────────────────────

function SARAlertsBanner({ alerts }: { alerts: SARAlert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-[2px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="text-sm font-bold text-red-800">
          {alerts.length} SAR{alerts.length !== 1 ? 's' : ''} unsubmitted for 24h+
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.sarId} className="flex items-start justify-between gap-4 bg-white border border-red-100 rounded-[2px] px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800">{alert.orgName}</div>
              <div className="text-[11px] text-slate-500 truncate">{alert.clientRef} — {alert.description}</div>
            </div>
            <div className="flex-shrink-0 text-[10px] font-bold text-red-700">
              {alert.hoursOld}h old
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inactive Banks ────────────────────────────────────────────────────────────

function InactiveBanksSection({ banks }: { banks: InactiveBank[] }) {
  if (banks.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[2px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm font-bold text-amber-800">
          {banks.length} bank{banks.length !== 1 ? 's' : ''} inactive for 7+ days
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {banks.map(bank => (
          <Link
            key={bank.orgId}
            href={`/admin/banks/${bank.orgId}`}
            className="flex items-center justify-between bg-white border border-amber-100 rounded-[2px] px-3 py-2 hover:bg-amber-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{bank.orgName}</div>
              <div className="text-[10px] text-slate-500">{bank.userCount} user{bank.userCount !== 1 ? 's' : ''}</div>
            </div>
            <div className="text-[10px] font-bold text-amber-700 flex-shrink-0 ml-2">
              {bank.daysInactive === 9999 ? 'Never' : `${bank.daysInactive}d`}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Bank Row ──────────────────────────────────────────────────────────────────

function BankRow({ bank }: { bank: BankComplianceRow }) {
  const [expanded, setExpanded] = useState(false)
  const health = healthScore(bank)
  const cfg    = healthConfig[health]

  return (
    <>
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Name + health */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
            <div>
              <div className="text-sm font-semibold text-slate-900">{bank.orgName}</div>
              <div className="text-[10px] text-slate-400">{bank.country}</div>
            </div>
          </div>
        </td>

        {/* Obligations */}
        <td className="px-4 py-3 min-w-[120px]">
          <Pct value={bank.completedObligations} total={bank.totalObligations} />
          {bank.overdueObligations > 0 && (
            <div className="text-[10px] text-red-600 font-bold mt-0.5">{bank.overdueObligations} overdue</div>
          )}
        </td>

        {/* KYC */}
        <td className="px-4 py-3">
          <div className="text-xs text-slate-700">{bank.totalKyc} clients</div>
          {bank.kycHighRisk > 0 && <div className="text-[10px] text-amber-600 font-bold">{bank.kycHighRisk} high risk</div>}
          {bank.kycMissingDocs > 0 && <div className="text-[10px] text-red-600 font-bold">{bank.kycMissingDocs} missing docs</div>}
        </td>

        {/* SARs */}
        <td className="px-4 py-3">
          {bank.pendingSARs === 0
            ? <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All submitted</span>
            : <span className="text-[10px] text-red-600 font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> {bank.pendingSARs} pending</span>
          }
        </td>

        {/* Evidence */}
        <td className="px-4 py-3">
          {bank.obligationsWithNoEvidence === 0
            ? <span className="text-[10px] text-green-600 font-bold">All covered</span>
            : <span className="text-[10px] text-amber-600 font-bold">{bank.obligationsWithNoEvidence} gaps</span>
          }
        </td>

        {/* Last login */}
        <td className="px-4 py-3">
          {bank.lastLogin
            ? <div>
                <div className="text-xs text-slate-600">{new Date(bank.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                {(bank.inactiveDays ?? 0) > 14 && (
                  <div className="text-[10px] text-amber-600 font-bold">{bank.inactiveDays}d ago</div>
                )}
              </div>
            : <span className="text-[10px] text-red-600 font-bold">Never</span>
          }
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-slate-400">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr className="bg-slate-50 border-t border-slate-100">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Obligations</div>
                <div className="text-slate-700">{bank.completedObligations} / {bank.totalObligations} completed</div>
                <div className="text-slate-500">{bank.overdueObligations} overdue</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">KYC</div>
                <div className="text-slate-700">{bank.totalKyc} clients</div>
                <div className="text-slate-500">{bank.kycHighRisk} high risk · {bank.kycMissingDocs} missing docs</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">SARs</div>
                <div className="text-slate-700">{bank.pendingSARs} unsubmitted</div>
                {bank.oldestUnsubmittedSAR && (
                  <div className="text-slate-500">Oldest: {new Date(bank.oldestUnsubmittedSAR).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Evidence</div>
                <div className="text-slate-700">{bank.totalEvidence} files uploaded</div>
                <div className="text-slate-500">{bank.obligationsWithNoEvidence} obligations uncovered</div>
              </div>
            </div>
            <div className="mt-3">
              <Link
                href={`/admin/banks/${bank.orgId}`}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
              >
                Manage this bank →
              </Link>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ComplianceClient({
  banks, sarAlerts, inactiveBanks,
}: {
  banks:        BankComplianceRow[]
  sarAlerts:    SARAlert[]
  inactiveBanks: InactiveBank[]
}) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warn' | 'good'>('all')

  const totalCritical = banks.filter(b => healthScore(b) === 'critical').length
  const totalWarn     = banks.filter(b => healthScore(b) === 'warn').length
  const totalGood     = banks.filter(b => healthScore(b) === 'good').length

  const visible = filter === 'all' ? banks : banks.filter(b => healthScore(b) === filter)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Health status across all {banks.length} banks</p>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { id: 'all',      label: `All (${banks.length})`,      color: 'bg-slate-200 text-slate-700' },
          { id: 'critical', label: `Critical (${totalCritical})`, color: totalCritical > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400' },
          { id: 'warn',     label: `Attention (${totalWarn})`,    color: totalWarn > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400' },
          { id: 'good',     label: `Healthy (${totalGood})`,      color: 'bg-green-100 text-green-700' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={clsx(
              'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] transition-colors',
              filter === f.id ? 'ring-2 ring-slate-400 ring-offset-1' : '',
              f.color
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      <SARAlertsBanner alerts={sarAlerts} />
      <InactiveBanksSection banks={inactiveBanks} />

      {/* Main table */}
      <div className="bg-white border border-slate-200 rounded-[2px] overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Obligations</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">KYC</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">SARs</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evidence</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Login</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No banks match this filter</td>
              </tr>
            )}
            {visible.map(bank => <BankRow key={bank.orgId} bank={bank} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}