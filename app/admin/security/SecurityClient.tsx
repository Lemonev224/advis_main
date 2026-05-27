'use client'

import { useState, useTransition } from 'react'
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Users, Activity,
  LogOut, Mail, RefreshCw, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { forceLogoutUser, resendInvite } from '@/app/actions/super-admin-security'
import type {
  FailedLoginSummary, SecurityEvent, SessionInfo,
  NeverActivatedUser,
} from '@/app/actions/super-admin-security'

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, alert = false,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; alert?: boolean
}) {
  return (
    <div className={clsx(
      'bg-white border rounded-[2px] px-5 py-4 flex items-start justify-between gap-4',
      alert && Number(value) > 0 ? 'border-red-200' : 'border-slate-200'
    )}>
      <div>
        <div className={clsx('text-[10px] font-bold uppercase tracking-widest mb-2',
          alert && Number(value) > 0 ? 'text-red-600' : 'text-slate-500'
        )}>{label}</div>
        <div className={clsx('text-3xl font-bold leading-none',
          alert && Number(value) > 0 ? 'text-red-700' : 'text-slate-900'
        )}>{value}</div>
        {sub && <div className="text-[11px] text-slate-400 font-medium mt-1.5">{sub}</div>}
      </div>
      <div className={clsx('w-9 h-9 rounded-[2px] flex items-center justify-center flex-shrink-0',
        alert && Number(value) > 0 ? 'bg-red-50' : 'bg-slate-100'
      )}>
        <Icon className={clsx('w-4 h-4', alert && Number(value) > 0 ? 'text-red-600' : 'text-slate-500')} />
      </div>
    </div>
  )
}

const eventTypeBadge: Record<string, { color: string; label: string }> = {
  force_logout:       { color: 'text-red-700 bg-red-50 border-red-200',     label: 'Force Logout' },
  user_removed:       { color: 'text-orange-700 bg-orange-50 border-orange-200', label: 'User Removed' },
  bank_provisioned:   { color: 'text-green-700 bg-green-50 border-green-200',  label: 'Bank Provisioned' },
  invite_sent:        { color: 'text-blue-700 bg-blue-50 border-blue-200',    label: 'Invite Sent' },
  suspicious_access:  { color: 'text-red-700 bg-red-50 border-red-200',     label: 'Suspicious Access' },
}

// ── Failed Logins ─────────────────────────────────────────────────────────────

function FailedLoginsSection({ logins }: { logins: FailedLoginSummary[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (logins.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[2px] px-4 py-3">
        <ShieldCheck className="w-4 h-4" /> No failed login attempts in the last 24 hours
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2px] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attempts (24h)</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Attempt</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">IPs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logins.map(login => (
            <>
              <tr
                key={login.email}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === login.email ? null : login.email)}
              >
                <td className="px-4 py-3 font-medium text-slate-800">{login.email}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'text-[11px] font-bold px-2 py-0.5 rounded-[2px]',
                    login.attempt_count >= 10 ? 'bg-red-100 text-red-700' :
                    login.attempt_count >= 5  ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  )}>
                    {login.attempt_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(login.last_attempt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 flex items-center gap-1">
                  {login.ip_addresses.slice(0, 2).join(', ')}
                  {login.ip_addresses.length > 2 && ` +${login.ip_addresses.length - 2}`}
                  {expanded === login.email
                    ? <ChevronUp className="w-3 h-3 ml-1" />
                    : <ChevronDown className="w-3 h-3 ml-1" />
                  }
                </td>
              </tr>
              {expanded === login.email && (
                <tr key={`${login.email}-expanded`} className="bg-slate-50">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold text-slate-700 mr-2">All IPs:</span>
                      {login.ip_addresses.join(', ')}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Active Sessions ───────────────────────────────────────────────────────────

function ActiveSessionsSection({ sessions }: { sessions: SessionInfo[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-[2px] px-4 py-8 text-center">
        No active sessions right now
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2px] divide-y divide-slate-100 overflow-hidden">
      {sessions.map(s => (
        <div key={s.org_id} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">{s.org_name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Last session: {new Date(s.last_session_created).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {s.active_session_count} active
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Never Activated Users ─────────────────────────────────────────────────────

function NeverActivatedSection({ users }: { users: NeverActivatedUser[] }) {
  const [resending, setResending] = useState<string | null>(null)
  const [, start] = useTransition()

  const handleResend = (user: NeverActivatedUser, email: string) => {
    setResending(user.id)
    start(async () => {
      try {
        await resendInvite(user.id, email, user.org_id)
        alert(`Invite resent to ${email}`)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Failed to resend')
      } finally {
        setResending(null)
      }
    })
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[2px] px-4 py-3">
        <ShieldCheck className="w-4 h-4" /> All invited users have activated their accounts
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2px] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invited</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800">{user.full_name ?? 'Unknown'}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{user.org_name}</td>
              <td className="px-4 py-3 text-xs text-amber-600 font-medium">
                {Math.floor((Date.now() - new Date(user.invited_at).getTime()) / 86400000)}d ago
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleResend(user, user.full_name ?? '')}
                  disabled={resending === user.id}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-[2px] border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  {resending === user.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Mail className="w-3 h-3" />
                  }
                  Resend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Security Events Feed ──────────────────────────────────────────────────────

function SecurityEventsFeed({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-[2px] px-4 py-8 text-center">
        No security events recorded yet
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2px] divide-y divide-slate-100 overflow-hidden">
      {events.map(event => {
        const badge = eventTypeBadge[event.event_type] ?? { color: 'text-slate-600 bg-slate-100 border-slate-200', label: event.event_type }
        return (
          <div key={event.id} className="flex items-start gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border', badge.color)}>
                  {badge.label}
                </span>
                <span className="text-xs text-slate-700">{event.org_name}</span>
              </div>
              {event.description && (
                <div className="text-[11px] text-slate-500 mt-0.5">{event.description}</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
              {new Date(event.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Force Logout button (used in BankDetailClient) ────────────────────────────

export function ForceLogoutButton({ userId, orgId, userName }: {
  userId: string; orgId: string; userName: string
}) {
  const [isPending, start] = useTransition()

  const handle = () => {
    if (!confirm(`Force-expire all sessions for ${userName}? They will be signed out immediately.`)) return
    start(async () => {
      try {
        await forceLogoutUser(userId, orgId)
        alert(`Sessions expired for ${userName}`)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      title="Force logout"
      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-[2px] transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  failedLogins:    FailedLoginSummary[]
  securityEvents:  SecurityEvent[]
  activeSessions:  SessionInfo[]
  neverActivated:  NeverActivatedUser[]
  stats: {
    highRiskLoginCount:  number
    failedLoginCount:    number
    neverActivatedCount: number
    totalActiveSessions: number
  }
}

export default function SecurityClient({
  failedLogins, securityEvents, activeSessions, neverActivated, stats,
}: Props) {
  const sections = [
    { id: 'logins',   label: 'Failed Logins (24h)',   icon: ShieldAlert },
    { id: 'sessions', label: 'Active Sessions',        icon: Activity },
    { id: 'inactive', label: 'Never Activated',        icon: Users },
    { id: 'events',   label: 'Security Event Log',     icon: RefreshCw },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time monitoring across all banks</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="High-Risk Logins" value={stats.highRiskLoginCount} icon={ShieldAlert} alert sub="5+ attempts" />
        <StatCard label="Failed Attempts" value={stats.failedLoginCount} icon={AlertTriangle} alert sub="last 24 hours" />
        <StatCard label="Never Activated" value={stats.neverActivatedCount} icon={Users} alert sub="7+ days since invite" />
        <StatCard label="Active Sessions" value={stats.totalActiveSessions} icon={Activity} sub="right now" />
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map(section => (
          <div key={section.id} className="space-y-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <section.icon className="w-3.5 h-3.5" />
              {section.label}
            </h2>
            {section.id === 'logins'   && <FailedLoginsSection    logins={failedLogins} />}
            {section.id === 'sessions' && <ActiveSessionsSection   sessions={activeSessions} />}
            {section.id === 'inactive' && <NeverActivatedSection   users={neverActivated} />}
            {section.id === 'events'   && <SecurityEventsFeed      events={securityEvents} />}
          </div>
        ))}
      </div>
    </div>
  )
}