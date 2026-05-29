'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, Search, Settings, LogOut, AlertTriangle, Clock, FileWarning, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

import { useLocale } from '@/lib/supabase/locale-context'
import { t } from '@/lib/supabase/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { clearDemoSession } from '@/app/actions/demo';

const navItems = [
  { href: '/',              translationKey: 'nav.dashboard' },
  { href: '/obligations',   translationKey: 'nav.obligations' },
  { href: '/evidence',      translationKey: 'nav.evidence' },
  { href: '/kyc',           translationKey: 'nav.kyc' },
  { href: '/sar',           translationKey: 'nav.sar' },
  { href: '/audit-report',  translationKey: 'nav.auditReport' },
]

interface NotificationItem {
  id: string;
  type: 'overdue_obligation' | 'kyc_due' | 'pending_sar';
  title: string;
  subtitle: string;
  href: string;
  urgent: boolean;
}

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showBell, setShowBell] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const bellRef = useRef<HTMLDivElement>(null)
  const { locale } = useLocale()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Fetch live notification data from Supabase
  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const [obRes, kycRes, sarRes] = await Promise.all([
        supabase
          .from('obligations')
          .select('id, title, due_date, status')
          .neq('status', 'compliant'),
        supabase
          .from('kyc_clients')
          .select('id, name, account_ref, review_due_date, status')
          .in('status', ['overdue', 'due_soon']),
        supabase
          .from('sar_entries')
          .select('id, client_ref, date')
          .eq('submitted_to_uifand', false),
      ])

      const items: NotificationItem[] = []

      // Overdue obligations
      const overdueObs = (obRes.data ?? []).filter(
        o => o.due_date < today && o.status !== 'overdue'
          ? true  // computed overdue
          : o.status === 'overdue'
      )
      overdueObs.slice(0, 5).forEach(o => {
        items.push({
          id: `obl-${o.id}`,
          type: 'overdue_obligation',
          title: o.title,
          subtitle: `Due ${o.due_date} — overdue`,
          href: '/obligations',
          urgent: true,
        })
      })

      // KYC due / overdue
      ;(kycRes.data ?? []).slice(0, 4).forEach(k => {
        items.push({
          id: `kyc-${k.id}`,
          type: 'kyc_due',
          title: k.name,
          subtitle: `${k.account_ref} — review ${k.status === 'overdue' ? 'overdue' : 'due soon'}: ${k.review_due_date}`,
          href: '/kyc',
          urgent: k.status === 'overdue',
        })
      })

      // Pending SARs
      ;(sarRes.data ?? []).slice(0, 3).forEach(s => {
        items.push({
          id: `sar-${s.id}`,
          type: 'pending_sar',
          title: `SAR — ${s.client_ref}`,
          subtitle: `Pending UIFAND submission since ${s.date}`,
          href: '/sar',
          urgent: true,
        })
      })

      setNotifications(items)
    }

    fetchNotifications()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const institution = user?.user_metadata?.institution_name ?? 'Compliance Workspace'

const  handleSignOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();      // clears real Supabase session
  await clearDemoSession();           // deletes demo cookie if it exists
  router.push('/landing');
  router.refresh();                   // optional, forces middleware re-check
};
  const urgentCount = notifications.filter(n => n.urgent).length

  const notifIcon: Record<NotificationItem['type'], React.ReactNode> = {
    overdue_obligation: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
    kyc_due:            <Clock className="w-3.5 h-3.5 text-blue-600" />,
    pending_sar:        <FileWarning className="w-3.5 h-3.5 text-red-600" />,
  }

  return (
    <header className="bg-[#2C3E50] text-[#ECF0F1] sticky top-0 z-50 shadow-sm flex flex-col font-sans print:hidden">
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/10 min-w-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg tracking-wider text-white">
            ADVISORLY
          </Link>
          <span className="hidden md:inline text-xs text-[#ECF0F1]/60 bg-black/20 px-2 py-0.5 rounded">
            {institution}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <button className="text-[#ECF0F1]/70 hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>

          {/* ── Bell with dropdown ── */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setShowBell(v => !v)}
              className="relative text-[#ECF0F1]/70 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {urgentCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow">
                  {urgentCount > 9 ? '9+' : urgentCount}
                </span>
              )}
            </button>

            {showBell && (
              <div className="absolute right-0 top-8 w-80 bg-white border border-slate-200 rounded-[2px] shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
                    {t(locale, 'topbar.notifications')}
                  </span>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[2px] uppercase">
                        {notifications.length} {t(locale, 'topbar.active')}
                      </span>
                    )}
                    <button onClick={() => setShowBell(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <Bell className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                      {t(locale, 'topbar.allClear')}
                    </div>
                  ) : (
                    notifications.map(n => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setShowBell(false)}
                        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors block"
                      >
                        <div className="mt-0.5 flex-shrink-0">{notifIcon[n.type]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-800 truncate">{n.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{n.subtitle}</div>
                        </div>
                        {n.urgent && (
                          <span className="flex-shrink-0 text-[8px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[2px] mt-0.5">
                            {t(locale, 'topbar.urgent')}
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-3 py-2 bg-slate-50 flex justify-between items-center">
                  <Link
                    href="/audit-report"
                    onClick={() => setShowBell(false)}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors"
                  >
                    {t(locale, 'topbar.viewAuditReport')}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowBell(false)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors"
                  >
                    {t(locale, 'topbar.notifSettings')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <LanguageSwitcher />
          
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-[#ECF0F1]/70 hover:text-white transition-colors ml-2 pl-2 border-l border-white/20"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t(locale, 'nav.settings')}</span>
          </Link>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="hidden sm:inline text-sm text-[#ECF0F1]/70">{displayName}</span>
            <button
              onClick={handleSignOut}
              title={t(locale, 'topbar.signOut')}
              className="text-[#ECF0F1]/50 hover:text-red-300 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center px-2 h-10 bg-[#243342] overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'px-4 h-full flex items-center text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0',
                active
                  ? 'bg-white text-[#243342]'
                  : 'text-[#ECF0F1]/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {t(locale, item.translationKey)}
            </Link>
          )
        })}
      </div>
    </header>
  )
}