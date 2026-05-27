// app/admin/banks/BanksClient.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import type { SuperOrg } from '@/app/actions/super-admin'

export default function BanksClient({ orgs }: { orgs: SuperOrg[] }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Banks</h1>
        <p className="text-xs text-slate-500 mt-1">{orgs.length} organisation{orgs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2px] overflow-hidden">
        {orgs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">No banks yet</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orgs.map(org => (
              <li key={org.id}>
                <Link
                  href={`/admin/banks/${org.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{org.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {org.userCount} user{org.userCount !== 1 ? 's' : ''} · {org.country}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}