'use client'

import { useState, useEffect, useTransition } from 'react'
import { User, Bell, Shield, Building2, Check, Lock, AlertCircle, Users, Plus, Trash2, Loader2, X, Mail } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { getOrgUsers, getOrgInfo, inviteUserToOrg, removeUserFromOrg } from '@/app/actions/admin'
import type { OrgUser } from '@/app/actions/admin'
import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'

const inputCls    = 'w-full h-9 px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500 transition-colors'
const readOnlyCls = 'w-full h-9 px-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-[2px] cursor-not-allowed'
const labelCls    = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block'

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={clsx('relative w-9 h-5 rounded-full transition-all flex-shrink-0', value ? 'bg-slate-700' : 'bg-gray-200')}
    >
      <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', value ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{title}</h3>
      <div className="bg-white border border-slate-300 rounded-[2px] divide-y divide-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-slate-500 flex-shrink-0 w-36">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const notificationDefaults = [
  { id: 'obligation_overdue', label: 'Obligation overdue',     description: 'When a regulatory obligation passes its due date',       email: true,  inApp: true  },
  { id: 'kyc_expiring',       label: 'KYC review due',         description: 'When a client KYC review is due within 30 days',         email: true,  inApp: true  },
  { id: 'sar_pending',        label: 'SAR pending submission', description: 'When a SAR has not been submitted to UIFAND within 48h', email: true,  inApp: true  },
  { id: 'evidence_missing',   label: 'Evidence missing',       description: 'When an obligation has no evidence attached',            email: false, inApp: true  },
  { id: 'audit_report',       label: 'Audit report generated', description: 'When a new audit report is exported',                   email: true,  inApp: false },
  { id: 'team_changes',       label: 'Team changes',           description: 'When a user is added or removed from the workspace',     email: false, inApp: true  },
]

// ── Team Tab ──────────────────────────────────────────────────────────────────

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    start(async () => {
      try {
        await inviteUserToOrg({
          email: fd.get('email') as string,
          fullName: fd.get('fullName') as string,
          role: fd.get('role') as 'admin' | 'compliance_officer' | 'read_only',
        })
        onDone()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invite failed')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-slate-300 rounded-[2px] p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Invite Team Member</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-[2px] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input name="fullName" required className={inputCls} placeholder="Anna Mir" />
          </div>
          <div>
            <label className={labelCls}>Work Email *</label>
            <input name="email" type="email" required className={inputCls} placeholder="anna@yourbank.ad" />
          </div>
          <div>
            <label className={labelCls}>Role *</label>
            <select name="role" required className={inputCls}>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="admin">Admin</option>
              <option value="read_only">Read Only</option>
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeamTab() {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    compliance_officer: 'Compliance Officer',
    read_only: 'Read Only',
  }

  const load = async () => {
    setLoading(true)
    try { setUsers(await getOrgUsers()) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name}? They will lose access immediately.`)) return
    setRemoving(userId)
    setError('')
    try {
      await removeUserFromOrg(userId)
      setUsers(u => u.filter(x => x.id !== userId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove user')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onDone={load} />}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{users.length} member{users.length !== 1 ? 's' : ''}</div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] bg-slate-800 text-white hover:bg-slate-900 transition-colors"
        >
          <Plus className="w-3 h-3" /> Invite Member
        </button>
      </div>
      <div className="bg-white border border-slate-300 rounded-[2px] divide-y divide-slate-100 overflow-hidden">
        {users.map(user => (
          <div key={user.id} className="flex items-center gap-4 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {(user.full_name ?? user.email ?? '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{user.full_name ?? '—'}</div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Mail className="w-3 h-3" />{user.email ?? ''}
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[2px]">
              {roleLabel[user.role] ?? user.role}
            </div>
            <button
              onClick={() => handleRemove(user.id, user.full_name ?? user.email ?? 'this user')}
              disabled={removing === user.id}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors disabled:opacity-50"
            >
              {removing === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
        {users.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">No team members yet</div>}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'profile',       label: 'My Profile',   icon: User },
  { id: 'organisation',  label: 'Organisation', icon: Building2 },
  { id: 'team',          label: 'Team',         icon: Users },
  { id: 'security',      label: 'Security',     icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [notifs, setNotifs]       = useState(notificationDefaults)
  const [orgInfo, setOrgInfo]     = useState<{ name: string; slug: string; country: string } | null>(null)

  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail]       = useState('')
  const [initials, setInitials] = useState('?')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError]     = useState<string | null>(null)
  const [pwSaved, setPwSaved]     = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      const name  = (u.user_metadata?.full_name as string) ?? ''
      const title = (u.user_metadata?.job_title  as string) ?? ''
      setFullName(name)
      setJobTitle(title)
      setEmail(u.email ?? '')
      setInitials(name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : (u.email?.slice(0, 2).toUpperCase() ?? '?'))
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'organisation') {
      import('@/app/actions/admin').then(m => m.getOrgInfo()).then(setOrgInfo)
    }
  }, [activeTab])

  const handleSaveProfile = async () => {
    setError(null); setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ data: { full_name: fullName, job_title: jobTitle } })
    setSaving(false)
    if (err) { setError(err.message) } else {
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      setInitials(fullName ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase())
    }
  }

  const handleChangePassword = async () => {
    setPwError(null)
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    if (err) { setPwError(err.message); return }
    setPwSaved(true); setNewPw(''); setConfirmPw('')
    setTimeout(() => setPwSaved(false), 3000)
  }

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">
      {/* Tab bar */}
      <div className="bg-white border border-slate-300 rounded-[2px] flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-b-2 flex-shrink-0',
              activeTab === tab.id ? 'border-slate-800 text-slate-900 bg-slate-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-slate-300 rounded-[2px] p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white tracking-widest flex-shrink-0">{initials}</div>
            <div>
              <div className="text-base font-bold text-slate-900">{fullName || 'Your Name'}</div>
              <div className="text-sm text-slate-500 mt-0.5">{jobTitle || 'Compliance Professional'}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{email}</div>
            </div>
          </div>
          <Section title="Personal Information">
            <Field label="Full name"><input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="Maria Coma" /></Field>
            <Field label="Job title"><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className={inputCls} placeholder="Chief Compliance Officer" /></Field>
            <Field label="Email"><input value={email} readOnly className={readOnlyCls} /></Field>
          </Section>
          {error && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
          <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-[2px] hover:bg-slate-900 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : null}
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Organisation — read-only for bank users */}
      {activeTab === 'organisation' && (
        <div className="space-y-6 max-w-2xl">
          <Section title="Institution Details">
            <Field label="Institution"><input readOnly value={orgInfo?.name ?? '…'} className={readOnlyCls} /></Field>
            <Field label="Country"><input readOnly value={orgInfo?.country ?? '…'} className={readOnlyCls} /></Field>
          </Section>
          <p className="text-xs text-slate-500 px-1">To update institution details, contact your Advisorly account manager.</p>
        </div>
      )}

      {/* Team — bank admins can invite/remove their own users */}
      {activeTab === 'team' && <TeamTab />}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <Section title="Change Password">
            <Field label="New password"><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputCls} placeholder="Min 8 characters" /></Field>
            <Field label="Confirm password"><input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputCls} placeholder="Repeat password" /></Field>
          </Section>
          {pwError && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}</div>}
          {pwSaved && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[2px] px-4 py-3"><Check className="w-4 h-4 flex-shrink-0" /> Password updated</div>}
          <button onClick={handleChangePassword} disabled={!newPw || !confirmPw} className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-[2px] hover:bg-slate-900 transition-colors disabled:opacity-60">
            <Lock className="w-3.5 h-3.5" /> Update Password
          </button>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 max-w-2xl">
          <Section title="Alert Preferences">
            {notifs.map(n => (
              <div key={n.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{n.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.description}</div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    <Toggle value={n.email} onChange={v => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, email: v } : x))} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In-app</span>
                    <Toggle value={n.inApp} onChange={v => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, inApp: v } : x))} />
                  </div>
                </div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  )
}