'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, AlertCircle, Plus, ChevronDown, FileCheck, FileX, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { markClientReviewed, requestDocuments, addKYCClient } from '@/app/actions/kyc';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

type RiskTier = 'low' | 'medium' | 'high';
type KYCStatus = 'current' | 'due_soon' | 'overdue';

interface KYCClientRow {
  id: string;
  name: string;
  account_ref: string;
  onboarding_date: string;
  review_due_date: string;
  risk_tier: RiskTier;
  documents_received: string[];
  documents_missing: string[];
  status: KYCStatus;
  document_request_sent_at?: string | null;
  last_reviewed_at?: string | null;
  notes?: string | null;
}

const riskConfig = {
  low:    { color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200' },
  medium: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  high:   { color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

const statusConfig = {
  current:  { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle2 },
  due_soon: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Clock },
  overdue:  { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: AlertCircle },
};

const COMMON_DOCS = [
  'Passport', 'National ID', 'Proof of Address', 'Source of Funds', 'Source of Wealth',
  'UBO Declaration', 'Enhanced DD Report', 'Certificate of Incorporation',
  'Passport (Directors)', 'Financial Statements', 'Tax Residency Certificate',
  'Employment Letter', 'Bank Reference Letter',
];

function ClientCard({ client, onUpdate }: { client: KYCClientRow; onUpdate: () => void }) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'review' | 'request' | null>(null);
  const [requestSent, setRequestSent] = useState(!!client.document_request_sent_at);

  const risk = riskConfig[client.risk_tier];
  const status = statusConfig[client.status];
  const docTotal = client.documents_received.length + client.documents_missing.length;
  const docPct = docTotal > 0 ? Math.round((client.documents_received.length / docTotal) * 100) : 100;

  const handleMarkReviewed = () => {
    setAction('review');
    startTransition(async () => {
      await markClientReviewed(client.id);
      setAction(null);
      onUpdate();
    });
  };

  const handleRequestDocuments = () => {
    setAction('request');
    startTransition(async () => {
      await requestDocuments(client.id);
      setRequestSent(true);
      setAction(null);
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-[2px] flex flex-col mb-2 transition-all">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors">
        <div className={clsx('flex-shrink-0 w-8 h-8 rounded-[2px] flex items-center justify-center text-[10px] font-bold border uppercase tracking-widest', risk.bg, risk.color)}>
          {client.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-xs truncate">{client.name}</div>
          <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{client.account_ref}</div>
        </div>
        <div className="hidden sm:block w-24">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            <span>{t(locale, 'kyc.docs')}</span>
            <span>{client.documents_received.length}/{docTotal}</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-none overflow-hidden">
            <div className={clsx('h-full', client.documents_missing.length > 0 ? 'bg-orange-400' : 'bg-green-500')} style={{ width: `${docPct}%` }} />
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end mr-4">
          <div className="text-[11px] font-bold text-slate-900 tracking-wide">{client.review_due_date}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t(locale, 'kyc.reviewDue')}</div>
        </div>
        <div className={clsx('hidden sm:flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border mr-2', risk.bg, risk.color)}>
          {t(locale, `kyc.risk_${client.risk_tier}`)}
        </div>
        <div className={clsx('flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border', status.bg, status.color)}>
          <status.icon className="w-3 h-3" />
          <span className="hidden sm:inline">{t(locale, `status.${client.status}`)}</span>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ml-2', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <FileCheck className="w-3.5 h-3.5 text-green-700" /> {t(locale, 'kyc.docsReceived')}
              </div>
              <div className="space-y-1.5">
                {client.documents_received.map(doc => (
                  <div key={doc} className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{doc}
                  </div>
                ))}
              </div>
            </div>
            {client.documents_missing.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <FileX className="w-3.5 h-3.5 text-red-700" /> {t(locale, 'kyc.missingDocs')}
                </div>
                <div className="space-y-1.5">
                  {client.documents_missing.map(doc => (
                    <div key={doc} className="flex items-center gap-2 text-[11px] font-medium text-red-700/90">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{doc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {client.last_reviewed_at && (
            <div className="text-[10px] text-slate-500 font-medium">
              {t(locale, 'kyc.lastReviewed')} {new Date(client.last_reviewed_at).toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB')}
            </div>
          )}
          <div className="flex items-center gap-4 pt-3 mt-2 border-t border-slate-200">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex-1">
              <span>{t(locale, 'kyc.onboarded')} <span className="text-slate-800 tracking-wide">{client.onboarding_date}</span></span>
              <span className="text-slate-300">|</span>
              <span>{t(locale, 'kyc.risk')} <span className={risk.color}>{t(locale, `kyc.risk_${client.risk_tier}`)}</span></span>
            </div>
            <button
              onClick={handleRequestDocuments}
              disabled={isPending || client.documents_missing.length === 0}
              className={clsx(
                'border font-semibold px-3 py-1.5 rounded-[2px] text-[10px] transition-colors uppercase tracking-wide flex items-center gap-1.5',
                requestSent
                  ? 'border-green-300 text-green-700 bg-green-50'
                  : 'border-slate-300 text-slate-700 hover:bg-white',
                (isPending && action === 'request') && 'opacity-60'
              )}
            >
              {isPending && action === 'request' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {requestSent ? t(locale, 'kyc.requestSent') : t(locale, 'kyc.requestDocuments')}
            </button>
            <button
              onClick={handleMarkReviewed}
              disabled={isPending}
              className="border border-slate-800 bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-[2px] text-[10px] hover:bg-slate-900 transition-colors uppercase tracking-wide flex items-center gap-1.5 disabled:opacity-60"
            >
              {isPending && action === 'review' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {t(locale, 'kyc.markReviewed')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [docsReceived, setDocsReceived] = useState<string[]>([]);
  const [docsMissing, setDocsMissing] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError('');
    startTransition(async () => {
      try {
        await addKYCClient({
          name: fd.get('name') as string,
          accountRef: fd.get('accountRef') as string,
          riskTier: fd.get('riskTier') as RiskTier,
          onboardingDate: fd.get('onboardingDate') as string,
          reviewDueDate: fd.get('reviewDueDate') as string,
          documentsReceived: docsReceived,
          documentsMissing: docsMissing,
        });
        onAdded();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to add client');
      }
    });
  };

  const toggleDoc = (doc: string, list: string[], setList: (d: string[]) => void, other: string[], setOther: (d: string[]) => void) => {
    if (list.includes(doc)) setList(list.filter(d => d !== doc));
    else { setList([...list, doc]); setOther(other.filter(d => d !== doc)); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-slate-300 rounded-[2px] w-full max-w-lg mx-4 shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-800">{t(locale, 'kyc.addClient')}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t(locale, 'kyc.clientName')}</label>
              <input name="name" required className="w-full border border-slate-300 rounded-[2px] px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500" placeholder="e.g. Inversions Example SL" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t(locale, 'kyc.accountRef')}</label>
              <input name="accountRef" required className="w-full border border-slate-300 rounded-[2px] px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500" placeholder="ACC-10xxx" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t(locale, 'kyc.riskTier')}</label>
              <select name="riskTier" required className="w-full border border-slate-300 rounded-[2px] px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500">
                <option value="low">{t(locale, 'common.low')}</option>
                <option value="medium">{t(locale, 'common.medium')}</option>
                <option value="high">{t(locale, 'common.high')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t(locale, 'kyc.onboardingDate')}</label>
              <input name="onboardingDate" type="date" required className="w-full border border-slate-300 rounded-[2px] px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t(locale, 'kyc.reviewDueDate')}</label>
              <input name="reviewDueDate" type="date" required className="w-full border border-slate-300 rounded-[2px] px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500" />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{t(locale, 'kyc.documentsAssign')}</div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {COMMON_DOCS.map(doc => {
                const received = docsReceived.includes(doc);
                const missing = docsMissing.includes(doc);
                return (
                  <div key={doc} className="flex rounded-[2px] overflow-hidden border border-slate-200 text-[9px] font-bold uppercase tracking-wide">
                    <button type="button" onClick={() => toggleDoc(doc, docsReceived, setDocsReceived, docsMissing, setDocsMissing)}
                      className={clsx('px-2 py-1 transition-colors', received ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-green-50')}>✓</button>
                    <span className={clsx('px-2 py-1', received ? 'bg-green-50 text-green-800' : missing ? 'bg-red-50 text-red-800' : 'text-slate-600')}>{doc}</span>
                    <button type="button" onClick={() => toggleDoc(doc, docsMissing, setDocsMissing, docsReceived, setDocsReceived)}
                      className={clsx('px-2 py-1 transition-colors', missing ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-red-50')}>✗</button>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="border border-slate-300 text-slate-600 font-semibold px-4 py-1.5 rounded-[2px] text-[10px] uppercase tracking-wide hover:bg-slate-50">{t(locale, 'common.cancel')}</button>
            <button type="submit" disabled={isPending} className="bg-slate-800 text-white font-semibold px-4 py-1.5 rounded-[2px] text-[10px] uppercase tracking-wide hover:bg-slate-900 disabled:opacity-60 flex items-center gap-1.5">
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {t(locale, 'kyc.addClientBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KYCPageClient({ initialClients }: { initialClients: KYCClientRow[] }) {
  const { locale } = useLocale();
  const [clients, setClients] = useState(initialClients);
  const [filter, setFilter] = useState<'all' | KYCStatus>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskTier>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const refresh = () => window.location.reload();

  const filtered = clients.filter(c => {
    const statusMatch = filter === 'all' || c.status === filter;
    const riskMatch = riskFilter === 'all' || c.risk_tier === riskFilter;
    return statusMatch && riskMatch;
  });

  const counts = {
    overdue:  clients.filter(c => c.status === 'overdue').length,
    due_soon: clients.filter(c => c.status === 'due_soon').length,
    current:  clients.filter(c => c.status === 'current').length,
  };

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onAdded={refresh} />}

      <div className="grid grid-cols-3 gap-4">
        {(['overdue', 'due_soon', 'current'] as const).map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className={clsx('px-4 py-3 rounded-[2px] border text-left transition-colors flex flex-col',
              filter === s ? statusConfig[s].bg : 'bg-white border-slate-300 hover:bg-slate-50')}>
            <div className={clsx('text-[10px] font-bold uppercase tracking-widest mb-1', filter === s ? statusConfig[s].color : 'text-slate-500')}>{t(locale, `status.${s}`)}</div>
            <div className={clsx('text-2xl font-bold leading-none', filter === s ? statusConfig[s].color : 'text-slate-900')}>{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-300 rounded-[2px] p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2 px-2">{t(locale, 'kyc.riskLevel')}</span>
          {(['all', 'low', 'medium', 'high'] as const).map(r => (
            <button key={r} onClick={() => setRiskFilter(r)}
              className={clsx('text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-[2px] border transition-colors',
                riskFilter === r
                  ? r === 'all' ? 'bg-slate-800 border-slate-800 text-white' : `${riskConfig[r as RiskTier]?.bg} border ${riskConfig[r as RiskTier]?.color}`
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')}>
              {r === 'all' ? t(locale, 'common.allRisk') : t(locale, `common.${r}`)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white border border-slate-800 px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wide transition-colors">
          <Plus className="w-3.5 h-3.5" /> {t(locale, 'kyc.addClient')}
        </button>
      </div>

      <div className="space-y-0">
        {filtered.map(client => <ClientCard key={client.id} client={client} onUpdate={refresh} />)}
        {filtered.length === 0 && <div className="text-center py-12 text-sm text-slate-400">{t(locale, 'kyc.noClientsMatch')}</div>}
      </div>
    </div>
  );
}