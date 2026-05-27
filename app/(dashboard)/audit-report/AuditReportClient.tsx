'use client';

import { useState } from 'react';
import {
  FileText, Download, CheckCircle2, XCircle, Clock,
  AlertTriangle, Shield, Printer, Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import type { ObligationRow } from '@/app/actions/obligations';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

type ObligationStatus = 'compliant' | 'in_progress' | 'overdue' | 'not_started';

const statusIcon: Record<ObligationStatus, React.ReactNode> = {
  compliant:   <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-slate-700" />,
  overdue:     <XCircle className="w-3.5 h-3.5 text-red-700" />,
  not_started: <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />,
};

const statusColor: Record<ObligationStatus, string> = {
  compliant:   'text-green-700',
  in_progress: 'text-slate-700',
  overdue:     'text-red-700',
  not_started: 'text-slate-500',
};

interface EvidenceFile {
  id: string;
  name: string;
  regulation: string;
  obligation_id: string;
  upload_date: string;
  file_type: string;
  file_size: string;
  uploaded_by: string;
}

interface KYCClient {
  id: string;
  name: string;
  account_ref: string;
  risk_tier: string;
  status: string;
  review_due_date: string;
  documents_missing: string[];
}

interface SAREntry {
  id: string;
  date: string;
  client_ref: string;
  description: string;
  submitted_to_uifand: boolean;
  submission_date?: string | null;
  follow_up_status: string;
  reference_number?: string | null;
}

interface Props {
  obligations: ObligationRow[];
  kycClients: KYCClient[];
  sarEntries: SAREntry[];
  evidenceFiles: EvidenceFile[];
  orgName: string
}

export default function AuditReportClient({ obligations, kycClients, sarEntries, evidenceFiles, orgName }: Props) {
  const { locale } = useLocale();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const today = new Date().toLocaleDateString(
    locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  const stats = {
    totalObligations: obligations.length,
    compliant:        obligations.filter(o => o.status === 'compliant').length,
    inProgress:       obligations.filter(o => o.status === 'in_progress').length,
    overdue:          obligations.filter(o => o.status === 'overdue').length,
    notStarted:       obligations.filter(o => o.status === 'not_started').length,
    totalEvidence:    evidenceFiles.length,
    kycOverdue:       kycClients.filter(k => k.status === 'overdue').length,
    sarPending:       sarEntries.filter(s => !s.submitted_to_uifand).length,
  };

  const score = stats.totalObligations > 0
    ? Math.round((stats.compliant / stats.totalObligations) * 100)
    : 0;

  const byReg: Record<string, ObligationRow[]> = {};
  obligations.forEach(o => {
    if (!byReg[o.regulation]) byReg[o.regulation] = [];
    byReg[o.regulation].push(o);
  });

  const highRiskKYC = kycClients.filter(k => k.risk_tier === 'high');
  const pendingSARs = sarEntries.filter(s => !s.submitted_to_uifand);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  const handleDownload = () => { window.print(); };

  // Helper for status labels using translation keys
  const statusLabel = (s: ObligationStatus) => {
    const map: Record<ObligationStatus, string> = {
      compliant:   t(locale, 'audit.compliant'),
      in_progress: t(locale, 'audit.inProgress'),
      overdue:     t(locale, 'audit.overdue'),
      not_started: t(locale, 'audit.notStarted'),
    };
    return map[s];
  };

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">

      {/* Generate panel */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-5 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'audit.title')}</h2>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl mt-1">
            {t(locale, 'audit.subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-700" /> {t(locale, 'audit.compliantObs', { count: stats.compliant })}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-700" /> {t(locale, 'audit.evidenceFiles', { count: stats.totalEvidence })}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-orange-700" /> {t(locale, 'audit.itemsNeedAttention', { count: stats.overdue + stats.sarPending })}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-[2px] text-[11px] font-bold uppercase tracking-wide transition-colors border',
                generating
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800'
              )}
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t(locale, 'audit.generating')}</>
              ) : (
                <><FileText className="w-3.5 h-3.5" /> {t(locale, 'audit.generatePdf')}</>
              )}
            </button>
            {generated && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-[2px] text-[11px] font-bold uppercase tracking-wide bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> {t(locale, 'audit.download')}
              </button>
            )}
          </div>
          {generated && (
            <div className="text-[9px] font-bold uppercase tracking-widest text-green-700 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> {t(locale, 'audit.reportGenerated')}
            </div>
          )}
        </div>
      </div>

      {/* Report preview */}
      <div id="audit-report-print" className="bg-white border border-slate-300 rounded-[2px] overflow-hidden flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-300 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{t(locale, 'audit.reportPreview')}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{today}</span>
        </div>

        {/* Report body */}
        <div className="p-6 lg:p-10 space-y-8 bg-white max-w-[800px] mx-auto w-full">

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">{orgName}</div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t(locale, 'audit.annualReport')}</h1>
                <div className="text-xs text-slate-600 font-semibold mt-1 uppercase tracking-wide">
                  {t(locale, 'audit.preparedFor')} {today}
                </div>
              </div>
              <div className="text-right">
                <div className={clsx('text-4xl font-bold tracking-tighter leading-none', score >= 70 ? 'text-green-700' : 'text-orange-700')}>{score}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t(locale, 'audit.afaReadiness')}</div>
              </div>
            </div>
          </div>

          {/* Executive summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">{t(locale, 'audit.executiveSummary')}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-slate-300 rounded-[2px] overflow-hidden divide-x divide-slate-200">
              <div className="p-4 bg-slate-50 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.compliant}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-1">{t(locale, 'audit.compliant')}</div>
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <div className="text-2xl font-bold text-slate-700">{stats.inProgress}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-1">{t(locale, 'audit.inProgress')}</div>
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-1">{t(locale, 'audit.overdue')}</div>
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <div className="text-2xl font-bold text-slate-500">{stats.notStarted}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-1">{t(locale, 'audit.notStarted')}</div>
              </div>
            </div>
          </div>

          {/* Obligations by regulation */}
          <div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">{t(locale, 'audit.obligationsByReg')}</div>
            <div className="space-y-5">
              {Object.entries(byReg).map(([reg, obs]) => (
                <div key={reg}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-[1px] bg-slate-800" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{reg}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({obs.length} {t(locale, 'audit.obligations')})</span>
                  </div>
                  <div className="border border-slate-300 rounded-[2px] overflow-hidden divide-y divide-slate-100">
                    {obs.map(ob => (
                      <div key={ob.id} className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{ob.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {t(locale, 'audit.owner')}: {ob.owner} · {t(locale, 'audit.due')}: {ob.due_date} · {ob.evidence_count} {ob.evidence_count !== 1 ? t(locale, 'audit.evidenceFiles2') : t(locale, 'audit.evidenceFile')}
                          </div>
                        </div>
                        <div className={clsx('flex items-center gap-1.5 text-[10px] font-bold flex-shrink-0', statusColor[ob.status as ObligationStatus])}>
                          {statusIcon[ob.status as ObligationStatus]}
                          <span className="hidden sm:inline">{statusLabel(ob.status as ObligationStatus)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {obligations.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 border border-slate-200 rounded-[2px]">
                  {t(locale, 'audit.noObligations')}
                </div>
              )}
            </div>
          </div>

          {/* KYC Summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
              {t(locale, 'audit.kycReviewStatus')}
            </div>
            <div className="grid grid-cols-3 gap-0 border border-slate-300 rounded-[2px] overflow-hidden divide-x divide-slate-200 mb-3">
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-slate-900">{kycClients.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.totalClients')}</div>
              </div>
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-red-700">{stats.kycOverdue}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.overdueReviews')}</div>
              </div>
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-orange-600">{highRiskKYC.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.highRisk')}</div>
              </div>
            </div>
            {highRiskKYC.length > 0 && (
              <div className="border border-slate-300 rounded-[2px] overflow-hidden divide-y divide-slate-100">
                {highRiskKYC.map(client => (
                  <div key={client.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800">{client.name}</div>
                      <div className="text-[10px] text-slate-500">{client.account_ref} · {t(locale, 'audit.reviewDue')} {client.review_due_date}</div>
                    </div>
                    <span className={clsx('text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border',
                      client.status === 'overdue' ? 'text-red-700 bg-red-50 border-red-200' :
                      client.status === 'due_soon' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                      'text-green-700 bg-green-50 border-green-200')}>
                      {t(locale, `status.${client.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAR Summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
              {t(locale, 'audit.sarTitle')}
            </div>
            <div className="grid grid-cols-3 gap-0 border border-slate-300 rounded-[2px] overflow-hidden divide-x divide-slate-200 mb-3">
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-slate-900">{sarEntries.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.totalSars')}</div>
              </div>
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-green-700">{sarEntries.filter(s => s.submitted_to_uifand).length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.submitted')}</div>
              </div>
              <div className="p-3 bg-slate-50 text-center">
                <div className="text-xl font-bold text-red-700">{stats.sarPending}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-0.5">{t(locale, 'audit.pending')}</div>
              </div>
            </div>
            {pendingSARs.length > 0 && (
              <div className="border border-orange-200 rounded-[2px] overflow-hidden divide-y divide-orange-100 bg-orange-50">
                {pendingSARs.map(sar => (
                  <div key={sar.id} className="flex items-start gap-3 px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800">{sar.client_ref} · {sar.date}</div>
                      <div className="text-[10px] text-slate-600 leading-relaxed">{sar.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">
              {t(locale, 'audit.evidenceVault')}
            </div>
            <div className="text-xs text-slate-700 font-medium">
              {stats.totalEvidence} {stats.totalEvidence !== 1 ? t(locale, 'audit.evidenceFiles2') : t(locale, 'audit.evidenceFile')} {locale === 'en' ? 'on record across all obligations.' : ''}{' '}
              {obligations.filter(o => o.evidence_count === 0).length} {obligations.filter(o => o.evidence_count === 0).length !== 1 ? t(locale, 'audit.evidenceFiles2') : t(locale, 'audit.evidenceFile')} {locale === 'en' ? 'have no evidence attached.' : ''}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <span>{t(locale, 'audit.generatedBy')}</span>
            <span>{t(locale, 'audit.confidential')} {today}</span>
          </div>
        </div>
      </div>
    </div>
  );
}