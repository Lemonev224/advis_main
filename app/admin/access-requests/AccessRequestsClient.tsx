'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Clock, Building2, Mail, X, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { rejectAccessRequest, provisionBank } from '@/app/actions/super-admin'
import type { AccessRequest } from '@/app/actions/super-admin'
import clsx from 'clsx'

const inputCls = 'w-full h-9 px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500 transition-colors'
const labelCls = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block'

type UserEntry = { email: string; fullName: string; role: 'admin' | 'compliance_officer' | 'read_only' }

// ── Provision Modal (same as BanksClient but pre-filled from request) ────────

function ProvisionModal({ prefill, onClose, onDone }: {
  prefill: AccessRequest
  onClose: () => void
  onDone: () => void
}) {
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')
  const [users, setUsers] = useState<UserEntry[]>([
    { email: prefill.email, fullName: prefill.full_name, role: 'admin' },
  ])

  const addUser = () => setUsers(u => [...u, { email: '', fullName: '', role: 'compliance_officer' }])
  const removeUser = (i: number) => setUsers(u => u.filter((_, idx) => idx !== i))
  const setField = (i: number, field: string, val: string) =>
    setUsers(u => u.map((user, idx) => idx === i ? { ...user, [field]: val } : user))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    start(async () => {
      try {
        await provisionBank({
          requestId: prefill.id,
          orgName: fd.get('orgName') as string,
          country: fd.get('country') as string,
          afaLicense: fd.get('afaLicense') as string,
          users,
        })
        onDone()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Provisioning failed')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[2px] shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Approve & Provision</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Review details then click Provision to create the org and send invites</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-[2px] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Institution Name *</label>
              <input name="orgName" required defaultValue={prefill.institution_name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Country *</label>
              <select name="country" required className={inputCls} defaultValue="AD">
                <option value="AD">Andorra</option>
                <option value="ES">Spain</option>
                <option value="FR">France</option>
                <option value="GB">United Kingdom</option>
                <option value="LU">Luxembourg</option>
                <option value="CH">Switzerland</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>AFA Licence No.</label>
              <input name="afaLicense" defaultValue={prefill.afa_license ?? ''} className={inputCls} placeholder="AFA-2024-XXXX" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Users to Invite</div>
              <button type="button" onClick={addUser} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 border border-slate-300 px-2 py-1 rounded-[2px] transition-colors">
                <Plus className="w-3 h-3" /> Add user
              </button>
            </div>
            {users.map((user, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-[2px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User {i + 1}</span>
                  {users.length > 1 && (
                    <button type="button" onClick={() => removeUser(i)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input required value={user.fullName} onChange={e => setField(i, 'fullName', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" required value={user.email} onChange={e => setField(i, 'email', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Role *</label>
                    <select value={user.role} onChange={e => setField(i, 'role', e.target.value as UserEntry['role'])} className={inputCls}>
                      <option value="admin">Admin</option>
                      <option value="compliance_officer">Compliance Officer</option>
                      <option value="read_only">Read Only</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <pre className="whitespace-pre-wrap text-xs">{error}</pre>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? 'Provisioning…' : 'Provision & Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ req, onApprove, onReject }: {
  req: AccessRequest
  onApprove: (req: AccessRequest) => void
  onReject: (id: string) => void
}) {
  const [rejecting, startReject] = useTransition()

  const statusCfg = {
    pending:  { color: 'text-amber-700 bg-amber-50 border-amber-200',  icon: Clock,        label: 'Pending' },
    approved: { color: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle2, label: 'Approved' },
    rejected: { color: 'text-slate-500 bg-slate-50 border-slate-200',  icon: XCircle,      label: 'Rejected' },
  }[req.status]

  const Icon = statusCfg.icon

  return (
    <div className="bg-white border border-slate-200 rounded-[2px] p-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{req.full_name}</span>
            <span className={clsx('flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border', statusCfg.color)}>
              <Icon className="w-3 h-3" /> {statusCfg.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{req.email}</div>
            <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-slate-400" />{req.institution_name}</div>
            {req.role && <div className="text-slate-500">Role: {req.role}</div>}
            {req.afa_license && <div className="text-slate-500">AFA: {req.afa_license}</div>}
            {req.team_size && <div className="text-slate-500">Team size: {req.team_size}</div>}
          </div>
          {req.notes && (
            <div className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded-[2px] px-3 py-2">
              "{req.notes}"
            </div>
          )}
          <div className="text-[10px] text-slate-400">
            Submitted {new Date(req.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {req.reviewed_at && ` · Reviewed ${new Date(req.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </div>
        </div>

        {req.status === 'pending' && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onApprove(req)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] bg-slate-900 text-white hover:bg-black transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Approve & Provision
            </button>
            <button
              onClick={() => startReject(async () => { await rejectAccessRequest(req.id); onReject(req.id) })}
              disabled={rejecting}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page Client ──────────────────────────────────────────────────────────────

export default function AccessRequestsClient({ requests: initial }: { requests: AccessRequest[] }) {
  const [requests, setRequests] = useState(initial)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [provisionFor, setProvisionFor] = useState<AccessRequest | null>(null)

  const handleReject = (id: string) =>
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r))

  const handleProvisionDone = () => {
    setRequests(prev => prev.map(r => r.id === provisionFor?.id ? { ...r, status: 'approved' as const } : r))
  }

  const visible = filter === 'pending' ? requests.filter(r => r.status === 'pending') : requests
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6 max-w-3xl">
      {provisionFor && (
        <ProvisionModal
          prefill={provisionFor}
          onClose={() => setProvisionFor(null)}
          onDone={handleProvisionDone}
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pendingCount} pending</p>
      </div>

      <div className="flex items-center gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] border transition-colors',
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            )}
          >
            {f === 'pending' ? `Pending (${pendingCount})` : `All (${requests.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-400">
          {filter === 'pending' ? 'No pending requests.' : 'No requests yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              onApprove={r => setProvisionFor(r)}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}