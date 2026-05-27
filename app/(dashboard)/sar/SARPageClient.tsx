'use client';

import { useState, useTransition } from 'react';
import {
  AlertTriangle, Lock, Plus, X, Loader2, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { logSAREntry, submitToUIFAND, closeSAREntry } from '@/app/actions/sar';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

type SARStatus = 'pending' | 'submitted' | 'closed';

interface SAREntry {
  id: string;
  date: string;
  client_ref: string;
  description: string;
  submitted_to_uifand: boolean;
  submission_date?: string | null;
  follow_up_status: SARStatus;
  reference_number?: string | null;
  logged_by?: string | null;
  created_at: string;
}

const statusConfig: Record<SARStatus, { color: string; bg: string; icon: React.ElementType; labelKey: string }> = {
  pending:   { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',  icon: Clock,         labelKey: 'status.pending' },
  submitted: { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',    icon: CheckCircle2,  labelKey: 'status.submitted' },
  closed:    { color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200',    icon: XCircle,       labelKey: 'status.closed' },
};

// ─── Log SAR Modal ────────────────────────────────────────────────────────────
function LogSARModal({ onClose, onLogged }: { onClose: () => void; onLogged: () => void }) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const clientRef = fd.get('clientRef') as string;
    const description = fd.get('description') as string;

    if (!date || !clientRef.trim() || !description.trim()) {
      setError('All fields are required.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        await logSAREntry({ date, clientRef, description });
        onLogged();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to log SAR entry.');
      }
    });
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[2px] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors';
  const labelCls = 'text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-[2px] p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'sar.logSuspicious')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{t(locale, 'sar.logSuspiciousSub')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t(locale, 'sar.dateOfObservation')}</label>
              <input name="date" type="date" required className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className={labelCls}>{t(locale, 'sar.clientReference')}</label>
              <input name="clientRef" required placeholder="e.g. ACC-10045" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t(locale, 'sar.descriptionLabel')}</label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder={t(locale, 'sar.descriptionPlaceholder')}
              className={inputCls + ' resize-none leading-relaxed'}
            />
          </div>

          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-[2px] px-3 py-2.5">
            <Lock className="w-3.5 h-3.5 text-orange-700 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-orange-800 font-medium leading-relaxed">{t(locale, 'sar.immutableWarning')}</p>
          </div>

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              {t(locale, 'common.cancel')}
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t(locale, 'sar.logSarButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Submit to UIFAND Modal ───────────────────────────────────────────────────
function SubmitUifandModal({
  entry, onClose, onSubmitted,
}: {
  entry: SAREntry;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmed) { setError('Please confirm the submission.'); return; }
    const fd = new FormData(e.currentTarget);
    const refNumber = fd.get('refNumber') as string;

    setError('');
    startTransition(async () => {
      try {
        await submitToUIFAND(entry.id, refNumber);
        onSubmitted();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Submission failed.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-slate-300 rounded-[2px] p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'sar.submitUifand')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{t(locale, 'sar.submitUifandSub')} <span className="font-bold text-slate-800">{entry.client_ref}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'sar.uifandRefNumber')}</label>
            <input
              name="refNumber"
              placeholder={t(locale, 'sar.uifandRefPlaceholder')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[2px] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1 font-medium">{t(locale, 'sar.uifandRefHint')}</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-slate-800"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <span className="text-[11px] text-slate-700 font-medium leading-relaxed">{t(locale, 'sar.uifandConfirmWarning')}</span>
          </label>

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              {t(locale, 'common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || !confirmed}
              className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t(locale, 'sar.confirmSubmission')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SAR Entry Card ───────────────────────────────────────────────────────────
function SARCard({ entry, onUpdate }: { entry: SAREntry; onUpdate: () => void }) {
  const { locale } = useLocale();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cfg = statusConfig[entry.follow_up_status];
  const Icon = cfg.icon;

  const handleMarkClosed = () => {
    startTransition(async () => {
      await closeSAREntry(entry.id);
      onUpdate();
    });
  };

  const dateFormatted = new Date(entry.created_at).toLocaleString(
    locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <>
      {showSubmitModal && (
        <SubmitUifandModal
          entry={entry}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={onUpdate}
        />
      )}

      <div className={clsx('bg-white border rounded-[2px] p-4 flex flex-col gap-3', entry.follow_up_status === 'pending' ? 'border-orange-200' : 'border-slate-300')}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">{entry.date}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-bold text-slate-800 tracking-wide">{entry.client_ref}</span>
            {entry.reference_number && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t(locale, 'sar.ref')} {entry.reference_number}</span>
              </>
            )}
          </div>
          <div className={clsx('flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border flex-shrink-0', cfg.bg, cfg.color)}>
            <Icon className="w-3 h-3" />
            {entry.submitted_to_uifand ? t(locale, 'sar.submittedToUifand') : t(locale, 'sar.pendingSubmission')}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">{entry.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
            <span>{dateFormatted}</span>
            {entry.submitted_to_uifand && entry.submission_date && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-green-700 font-bold">{t(locale, 'sar.submittedOn')} {entry.submission_date}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!entry.submitted_to_uifand && entry.follow_up_status === 'pending' && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] border border-slate-800 bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                {t(locale, 'sar.submitUifand')}
              </button>
            )}
            {entry.submitted_to_uifand && entry.follow_up_status !== 'closed' && (
              <button
                onClick={handleMarkClosed}
                disabled={isPending}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-[2px] border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {t(locale, 'sar.markClosed')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SARPageClient({ initialEntries }: { initialEntries: SAREntry[] }) {
  const { locale } = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<'all' | SARStatus>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  const refresh = () => window.location.reload();

  const filtered = filter === 'all' ? entries : entries.filter(e => e.follow_up_status === filter);

  const counts = {
    all:       entries.length,
    pending:   entries.filter(e => e.follow_up_status === 'pending').length,
    submitted: entries.filter(e => e.follow_up_status === 'submitted').length,
    closed:    entries.filter(e => e.follow_up_status === 'closed').length,
  };

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">
      {showLogModal && <LogSARModal onClose={() => setShowLogModal(false)} onLogged={refresh} />}

      {/* Immutable notice */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-1">{t(locale, 'sar.immutableTitle')}</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{t(locale, 'sar.immutableDesc')}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'pending', 'submitted', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-[2px] border transition-colors',
                filter === f
                  ? f === 'all'
                    ? 'bg-slate-800 border-slate-800 text-white'
                    : statusConfig[f as SARStatus]
                      ? clsx(statusConfig[f as SARStatus].bg, statusConfig[f as SARStatus].color)
                      : 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
            >
              {f === 'all' ? t(locale, 'sar.allSars') : t(locale, `status.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white border border-slate-800 px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wide transition-colors"
        >
          <Plus className="w-3 h-3" /> {t(locale, 'sar.logSar')}
        </button>
      </div>

      {/* SAR list */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <SARCard key={entry.id} entry={entry} onUpdate={refresh} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{t(locale, 'sar.noEntriesMatch')}</p>
          </div>
        )}
      </div>
    </div>
  );
}