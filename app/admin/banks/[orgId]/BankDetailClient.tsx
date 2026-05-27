'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, X, Mail } from 'lucide-react'
import Link from 'next/link'
import { addUserToOrg, removeUser } from '@/app/actions/super-admin'
import type { SuperOrg, SuperOrgUser } from '@/app/actions/super-admin'

const inputCls = 'w-full h-9 px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-[2px] focus:outline-none focus:border-slate-500 transition-colors'
const labelCls = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  compliance_officer: 'Compliance Officer',
  read_only: 'Read Only',
}

// ── Invite User Modal ────────────────────────────────────────────────────────

function InviteModal({ orgId, onClose, onDone }: { orgId: string; onClose: () => void; onDone: () => void }) {
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    start(async () => {
      try {
        await addUserToOrg({
          orgId,
          email: fd.get('email') as string,
          fullName: fd.get('fullName') as string,
          role: fd.get('role') as 'admin' | 'compliance_officer' | 'read_only',
        })
        onDone()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to invite user')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-[2px] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Invite User</h2>
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
            <input name="email" type="email" required className={inputCls} placeholder="anna@bank.ad" />
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
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-black rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bank Detail Client ───────────────────────────────────────────────────────

export default function BankDetailClient({ org, users: initialUsers }: { org: SuperOrg; users: SuperOrgUser[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from ${org.name}? They will lose access immediately.`)) return
    setRemoving(userId)
    setError('')
    try {
      await removeUser(userId)
      setUsers(u => u.filter(x => x.id !== userId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove user')
    } finally {
      setRemoving(null)
    }
  }

  const handleInviteDone = () => window.location.reload()

  return (
    <div className="space-y-6 max-w-3xl">
      {showInvite && (
        <InviteModal orgId={org.id} onClose={() => setShowInvite(false)} onDone={handleInviteDone} />
      )}

      {/* Back + Header */}
      <div>
        <Link href="/admin/banks" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest mb-4 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Banks
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>{org.country}</span>
              <span>·</span>
              <span className="font-mono">{org.slug}</span>
              <span>·</span>
              <span>Created {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-[2px] hover:bg-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Invite User
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[2px] px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Org details */}
      <div className="bg-white border border-slate-200 rounded-[2px] divide-y divide-slate-100">
        <div className="px-4 py-3 bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organisation Details</span>
        </div>
        {[
          { label: 'ID', value: org.id },
          { label: 'Last Login', value: org.lastLogin ? new Date(org.lastLogin).toLocaleString('en-GB') : 'Never' },
        ].map(row => (
          <div key={row.label} className="flex items-center px-4 py-3 gap-4">
            <span className="text-xs text-slate-500 w-28 flex-shrink-0">{row.label}</span>
            <span className="text-xs font-medium text-slate-800 font-mono">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Users */}
      <div className="space-y-2">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{users.length} User{users.length !== 1 ? 's' : ''}</h2>
        <div className="bg-white border border-slate-200 rounded-[2px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Login</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No users yet</td>
                </tr>
              )}
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {user.email ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[2px]">
                      {roleLabel[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : <span className="text-amber-600">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(user.id, user.full_name ?? user.email ?? 'this user')}
                      disabled={removing === user.id}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors disabled:opacity-50"
                      title="Remove user"
                    >
                      {removing === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}