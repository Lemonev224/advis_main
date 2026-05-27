'use client'

// app/admin/layout.tsx
// Fully responsive — collapsible sidebar on desktop, bottom nav on mobile

import { useState } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, CheckCircle2, ShieldAlert,
  ScrollText, LogOut, BarChart3, FileDown, Menu, X,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/admin',                 icon: LayoutDashboard, label: 'Overview',         short: 'Home' },
  { href: '/admin/banks',           icon: Building2,       label: 'Banks',            short: 'Banks' },
  { href: '/admin/access-requests', icon: CheckCircle2,    label: 'Access Requests',  short: 'Requests' },
  { href: '/admin/compliance',      icon: BarChart3,       label: 'Compliance',       short: 'Compliance' },
  { href: '/admin/security',        icon: ShieldAlert,     label: 'Security',         short: 'Security' },
  { href: '/admin/audit-log',       icon: ScrollText,      label: 'Audit Log',        short: 'Audit' },
  { href: '/admin/reports',         icon: FileDown,        label: 'Reports',          short: 'Reports' },
]

function NavLink({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-[2px] text-[11px] font-semibold transition-colors',
        active
          ? 'bg-slate-700 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      )}
    >
      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

function Sidebar({ email, onClose }: { email: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Advisorly</div>
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Super Admin</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavLink key={item.href} item={item} onClick={onClose} />)}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="text-[10px] text-slate-500 px-3 mb-2 truncate">{email}</div>
        <Link
          href="/landing"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[2px] text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Link>
      </div>
    </div>
  )
}

function MobileBottomNav() {
  const pathname = usePathname()
  // Show first 5 items on mobile bottom nav
  const mobileItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex lg:hidden">
      {mobileItems.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors',
              active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <item.icon className={clsx('w-5 h-5', active ? 'text-white' : 'text-slate-500')} />
            {item.short}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayoutClient({
  children,
  email,
}: {
  children: React.ReactNode
  email: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar email={email} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar email={email} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">Advisorly</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Super Admin</div>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}