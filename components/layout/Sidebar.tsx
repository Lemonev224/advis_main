'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardList, FolderLock, Users, AlertTriangle, FileText, Settings, LogOut, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';
import { createClient } from '@/lib/supabase/client';

const navItemDefs = [
  { href: '/',             icon: LayoutDashboard, key: 'nav.dashboard',    badge: null },
  { href: '/obligations',  icon: ClipboardList,   key: 'nav.obligations',  badge: null },
  { href: '/evidence',     icon: FolderLock,      key: 'nav.evidence',     badge: null },
  { href: '/kyc',          icon: Users,           key: 'nav.kyc',          badge: null },
  { href: '/sar',          icon: AlertTriangle,   key: 'nav.sar',          badge: null },
  { href: '/audit-report', icon: FileText,        key: 'nav.auditReport',  badge: null },
];

interface Props {
  orgName: string
  userRole: string
}

export default function Sidebar({ orgName, userRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();

  // Derive a short abbreviation (up to 4 chars) from the org name
  const orgAbbr = orgName
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 4) || orgName.slice(0, 3).toUpperCase();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/landing');
  };

  return (
    <>
      <aside className="hidden lg:flex w-72 flex-col glass-premium border-r border-white/5 m-6 rounded-3xl overflow-hidden h-[calc(100vh-48px)]">
        {/* Logo */}
        <div className="px-8 py-10 border-b border-white/5 flex flex-col items-center justify-center gap-5">
          <div className="relative w-14 h-14 flex flex-col items-center justify-center group cursor-pointer">
            <div className="absolute top-0 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-brand-cyan opacity-80 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="absolute top-2 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-[#1E88E5] opacity-90 mix-blend-screen group-hover:scale-105 transition-transform duration-500 delay-75"></div>
            <div className="absolute top-4 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-brand-blue opacity-100 group-hover:scale-105 transition-transform duration-500 delay-150"></div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-widest text-white font-display uppercase">Advisorly</div>
          </div>
        </div>

        {/* Bank Context — now dynamic */}
        <div className="px-6 py-5 border-b border-white/5">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] glass-hover group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center neon-glow flex-shrink-0">
                <span className="text-[9px] font-bold text-white font-display">{orgAbbr}</span>
              </div>
              <span className="text-xs text-white/80 font-medium font-body truncate">{orgName}</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-brand-cyan transition-colors flex-shrink-0 ml-2" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          <div className="text-[11px] font-semibold text-white/30 tracking-widest uppercase px-4 pb-4 font-mono-custom">Compliance OS</div>
          {navItemDefs.map((item) => {
            const active = pathname === item.href;
            const label = t(locale, item.key as Parameters<typeof t>[1]);
            return (
              <Link key={item.href} href={item.href}
                className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group relative overflow-hidden',
                  active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.03]')}>
                {active && (
                  <div className="absolute inset-0 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl" />
                )}
                <item.icon className={clsx('w-4 h-4 flex-shrink-0 relative z-10', active ? 'text-brand-cyan' : 'text-white/40 group-hover:text-brand-cyan transition-colors')} />
                <span className="flex-1 font-medium font-body relative z-10">{label}</span>
                {item.badge && (
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full relative z-10 font-mono-custom',
                    active ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-white/5 text-white/40 group-hover:bg-brand-cyan/10 group-hover:text-brand-cyan transition-colors')}>
                    {item.badge}
                  </span>
                )}
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-cyan rounded-r-full shadow-[0_0_10px_rgba(0,210,255,0.8)] z-10" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/5 space-y-2 bg-black/20">
          <Link href="/settings"
            className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all',
              pathname === '/settings' ? 'bg-brand-cyan/10 text-brand-cyan' : 'text-white/40 hover:text-white hover:bg-white/[0.03]')}>
            <Settings className="w-4 h-4" />
            <span className="font-medium font-body">{t(locale, 'nav.settings')}</span>
          </Link>
          <div className="pt-4 px-2 mt-3 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg group-hover:shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-shadow flex-shrink-0">
                <span className="text-[11px] font-bold text-white font-display tracking-widest">
                  {orgAbbr.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-white/90 font-medium leading-none font-body truncate">{orgName}</div>
                <div className="text-[10px] text-brand-cyan mt-1 font-mono-custom uppercase tracking-wider">{userRole.replace('_', ' ')}</div>
              </div>
              <LogOut className="w-4 h-4 text-white/20 group-hover:text-red-400 transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav — unchanged */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-premium border-t border-white/10 flex items-center px-2 py-2 pb-safe">
        {navItemDefs.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          const label = t(locale, item.key as Parameters<typeof t>[1]);
          return (
            <Link key={item.href} href={item.href}
              className={clsx('flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative', active ? 'text-brand-cyan' : 'text-white/40')}>
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium font-body">{label.split(' ')[0]}</span>
              {active && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-cyan rounded-b-full neon-glow" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}