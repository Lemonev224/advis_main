import {
  AlertOctagon, AlertTriangle, Clock, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Minus, Users, FolderLock,
  ClipboardList, FileWarning,
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getObligations } from '@/app/actions/obligations';
import { getKYCClients } from '@/app/actions/kyc';
import { getSAREntries } from '@/app/actions/sar';
import { t } from '@/lib/supabase/i18n';
import { getServerLocale } from '@/lib/supabase/i18n-server';

export const dynamic = 'force-dynamic';

const severityColors = {
  critical: 'bg-red-50 text-red-700 border border-red-200',
  high:     'bg-orange-50 text-orange-700 border border-orange-200',
  medium:   'bg-slate-50 text-slate-700 border border-slate-200',
  low:      'bg-slate-50 text-slate-600 border border-slate-200',
};

function StatCard({
  label,
  value,
  sub,
  href,
  alert,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className={`block bg-white border rounded-[2px] px-4 py-3 hover:bg-slate-50 transition-colors ${alert ? 'border-red-200' : 'border-slate-300'}`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${alert ? 'text-red-600' : 'text-slate-500'}`}>{label}</div>
      <div className={`text-2xl font-bold leading-none ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 font-medium mt-1.5 tracking-wide">{sub}</div>}
    </Link>
  );
}

export default async function ComplianceDashboard() {
  // Fetch all live data in parallel
  const [stats, obligations, kycClients, sarEntries] = await Promise.all([
    getDashboardStats(),
    getObligations(),
    getKYCClients(),
    getSAREntries(),
  ]);

  const locale = await getServerLocale();

  const today = new Date().toISOString().split('T')[0];
  const overdueObligations = obligations.filter(o => o.status === 'overdue');
  const pendingSARs = sarEntries.filter(s => !s.submitted_to_uifand);
  const overdueKYC = kycClients.filter(k => k.status === 'overdue');
  const dueSoonKYC = kycClients.filter(k => k.status === 'due_soon');

  // AFA readiness score: % of obligations that are compliant
  const afaScore = stats.obligations.total > 0
    ? Math.round((stats.obligations.compliant / stats.obligations.total) * 100)
    : 0;

  const hasCritical = overdueObligations.length > 0 || pendingSARs.length > 0;
  const controlStatus = hasCritical ? t(locale, 'dashboard.attentionRequired') : afaScore >= 80 ? t(locale, 'dashboard.onTrack') : t(locale, 'dashboard.reviewNeeded');
  const controlColor = hasCritical ? 'bg-orange-50 border-orange-200 text-orange-800' : afaScore >= 80 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-slate-300 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{t(locale, 'dashboard.title')}</h1>
              <span className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[2px] border border-slate-300">{t(locale, 'dashboard.live')}</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium tracking-wide">
              {t(locale, 'dashboard.lastSync')} {new Date().toLocaleString(locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{t(locale, 'dashboard.afaReadiness')}</span>
              <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-[2px]">
                <span className={`font-bold text-lg leading-none ${afaScore >= 70 ? 'text-green-700' : 'text-orange-700'}`}>
                  {afaScore}<span className="text-xs text-slate-500 font-semibold">/100</span>
                </span>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{t(locale, 'dashboard.controlStatus')}</span>
              <div className={`border px-2.5 py-1.5 rounded-[2px] flex items-center gap-2 ${controlColor}`}>
                {hasCritical && <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />}
                <span className="font-bold text-xs leading-none uppercase tracking-wider">{controlStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical alert banner — only shown when there are real pending SARs */}
        {pendingSARs.length > 0 && (
          <div className="bg-white border-l-4 border-l-red-600 border border-slate-300 rounded-[2px] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-red-700 mb-0.5">
                  {pendingSARs.length > 1 ? t(locale, 'dashboard.pendingUifandPlural') : t(locale, 'dashboard.pendingUifand')}
                </div>
                <div className="text-[13px] font-semibold text-slate-900">
                  {pendingSARs.length} {t(locale, 'dashboard.sarImmediateAction')}
                </div>
              </div>
            </div>
            <Link
              href="/sar"
              className="border border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-[2px] text-[11px] hover:bg-slate-50 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              {t(locale, 'dashboard.viewSarLog')}
            </Link>
          </div>
        )}

        {/* Overdue obligations banner */}
        {overdueObligations.length > 0 && (
          <div className="bg-white border-l-4 border-l-orange-500 border border-slate-300 rounded-[2px] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-orange-700 mb-0.5">{t(locale, 'dashboard.overdueObligations')}</div>
                <div className="text-[13px] font-semibold text-slate-900">
                  {overdueObligations.length} {overdueObligations.length > 1 ? t(locale, 'dashboard.regObligationsPastDue') : t(locale, 'dashboard.regObligationPastDue')}{' '}
                  {overdueObligations.slice(0, 2).map(o => o.title).join(', ')}
                  {overdueObligations.length > 2 ? ` ${t(locale, 'dashboard.andMore')} ${overdueObligations.length - 2} ${t(locale, 'dashboard.more')}` : ''}.
                </div>
              </div>
            </div>
            <Link
              href="/obligations"
              className="border border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-[2px] text-[11px] hover:bg-slate-50 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              {t(locale, 'dashboard.viewObligations')}
            </Link>
          </div>
        )}
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label={t(locale, 'dashboard.kpiCompliant')}
          value={stats.obligations.compliant}
          sub={t(locale, 'dashboard.kpiCompliantSub', { total: stats.obligations.total })}
          href="/obligations"
        />
        <StatCard
          label={t(locale, 'dashboard.kpiOverdue')}
          value={stats.obligations.overdue}
          sub={stats.obligations.overdue > 0 ? t(locale, 'dashboard.kpiOverdueAction') : t(locale, 'dashboard.kpiOverdueTrack')}
          href="/obligations"
          alert={stats.obligations.overdue > 0}
        />
        <StatCard
          label={t(locale, 'dashboard.kpiKyc')}
          value={stats.kyc.overdue}
          sub={t(locale, 'dashboard.kpiKycSub', { soon: stats.kyc.due_soon })}
          href="/kyc"
          alert={stats.kyc.overdue > 0}
        />
        <StatCard
          label={t(locale, 'dashboard.kpiSar')}
          value={stats.sar.unsubmitted}
          sub={t(locale, 'dashboard.kpiSarSub', { total: stats.sar.total })}
          href="/sar"
          alert={stats.sar.unsubmitted > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Obligations breakdown */}
        <div className="bg-white border border-slate-300 rounded-[2px] flex flex-col">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'nav.obligations')}</span>
            </div>
            <Link href="/obligations" className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
              {t(locale, 'common.viewAll')}
            </Link>
          </div>
          <div className="p-0 divide-y divide-slate-100">
            {obligations.slice(0, 6).map(ob => {
              const statusColors = {
                compliant:   'text-green-700',
                in_progress: 'text-slate-600',
                overdue:     'text-red-700',
                not_started: 'text-slate-400',
              };
              const statusIcons = {
                compliant:   CheckCircle2,
                in_progress: Clock,
                overdue:     XCircle,
                not_started: AlertTriangle,
              };
              const Icon = statusIcons[ob.status];
              return (
                <div key={ob.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <div
                    className="flex-shrink-0 w-10 text-center text-[8px] font-bold tracking-widest uppercase border px-1 py-0.5 rounded-[2px]"
                    style={{ color: ob.color, borderColor: ob.color + '40', backgroundColor: ob.color + '10' }}
                  >
                    {ob.regulation_code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{ob.title}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{ob.owner} · Due {ob.due_date}</div>
                  </div>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${statusColors[ob.status]}`} />
                </div>
              );
            })}
            {obligations.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">{t(locale, 'dashboard.noObligations')}</div>
            )}
          </div>
        </div>

        {/* KYC snapshot */}
        <div className="bg-white border border-slate-300 rounded-[2px] flex flex-col">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'dashboard.kycReviews')}</span>
            </div>
            <Link href="/kyc" className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
              {t(locale, 'common.viewAll')}
            </Link>
          </div>

          {/* Summary pills */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="py-3 text-center">
              <div className="text-xl font-bold text-red-700">{stats.kyc.overdue}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{t(locale, 'dashboard.kycOverdue')}</div>
            </div>
            <div className="py-3 text-center">
              <div className="text-xl font-bold text-orange-600">{stats.kyc.due_soon}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{t(locale, 'dashboard.kycDueSoon')}</div>
            </div>
            <div className="py-3 text-center">
              <div className="text-xl font-bold text-green-700">{stats.kyc.current}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{t(locale, 'dashboard.kycCurrent')}</div>
            </div>
          </div>

          <div className="p-0 divide-y divide-slate-100 flex-1">
            {[...overdueKYC, ...dueSoonKYC].slice(0, 5).map(client => (
              <div key={client.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${client.status === 'overdue' ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{client.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{client.account_ref} · Due {client.review_due_date}</div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border ${client.status === 'overdue' ? 'text-red-700 bg-red-50 border-red-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
                  {client.status === 'overdue' ? t(locale, 'dashboard.kycOverdue') : t(locale, 'dashboard.kycDueSoon')}
                </span>
              </div>
            ))}
            {overdueKYC.length === 0 && dueSoonKYC.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">{t(locale, 'dashboard.allKycCurrent')}</div>
            )}
          </div>
        </div>

        {/* SAR & Evidence */}
        <div className="flex flex-col gap-4">

          {/* SAR */}
          <div className="bg-white border border-slate-300 rounded-[2px] flex flex-col flex-1">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'nav.sar')}</span>
              </div>
              <Link href="/sar" className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                {t(locale, 'common.viewAll')}
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingSARs.slice(0, 3).map(sar => (
                <div key={sar.id} className="px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-xs text-slate-800 truncate">{sar.client_ref}</div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[2px] flex-shrink-0">Pending</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{sar.description}</div>
                </div>
              ))}
              {pendingSARs.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">{t(locale, 'dashboard.noPendingSar')}</div>
              )}
            </div>
          </div>

          {/* Evidence vault summary */}
          <div className="bg-white border border-slate-300 rounded-[2px]">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'nav.evidence')}</span>
              </div>
              <Link href="/evidence" className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                {t(locale, 'common.viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="py-3 text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.evidence.total}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{t(locale, 'dashboard.totalFiles')}</div>
              </div>
              <div className="py-3 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {obligations.filter(o => o.evidence_count === 0 && o.status !== 'not_started').length}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{t(locale, 'dashboard.missingEvidence')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Obligation register preview — by regulation */}
      <div className="bg-white border border-slate-300 rounded-[2px]">
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'dashboard.frameworkStatus')}</span>
          <Link href="/audit-report" className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
            {t(locale, 'topbar.viewAuditReport')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 px-3 font-bold">{t(locale, 'dashboard.regulation')}</th>
                <th className="py-2 px-3 font-bold text-center">{t(locale, 'status.compliant')}</th>
                <th className="py-2 px-3 font-bold text-center">{t(locale, 'status.in_progress')}</th>
                <th className="py-2 px-3 font-bold text-center">{t(locale, 'status.overdue')}</th>
                <th className="py-2 px-3 font-bold text-center">{t(locale, 'status.not_started')}</th>
                <th className="py-2 px-3 font-bold text-center">{t(locale, 'dashboard.coverage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(['AML Law 14/2017', 'MiFID II (Law 7/2024)', 'AFA Annual Review', 'CRS/FATCA'] as const).map(reg => {
                const regObs = obligations.filter(o => o.regulation === reg);
                const compliant = regObs.filter(o => o.status === 'compliant').length;
                const inProgress = regObs.filter(o => o.status === 'in_progress').length;
                const overdue = regObs.filter(o => o.status === 'overdue').length;
                const notStarted = regObs.filter(o => o.status === 'not_started').length;
                const coverage = regObs.length > 0 ? Math.round((compliant / regObs.length) * 100) : 0;
                const regColors: Record<string, string> = {
                  'AML Law 14/2017': '#4F7CFF',
                  'MiFID II (Law 7/2024)': '#10B981',
                  'AFA Annual Review': '#F59E0B',
                  'CRS/FATCA': '#8B5CF6',
                };
                return (
                  <tr key={reg} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-[1px] flex-shrink-0" style={{ backgroundColor: regColors[reg] }} />
                        <span className="font-semibold text-slate-800">{reg}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-green-700">{compliant}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{inProgress}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-red-700">{overdue}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{notStarted}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-20 bg-slate-200 rounded-none overflow-hidden">
                          <div
                            className={`h-full rounded-none ${coverage >= 70 ? 'bg-green-500' : coverage >= 40 ? 'bg-orange-400' : 'bg-red-500'}`}
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px] w-9 text-right">{coverage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}