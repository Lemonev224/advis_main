'use client';

import { useState, useTransition } from 'react';
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, Plus, X, Loader2, Upload,
  Search, Filter, FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { updateObligationStatus, addObligation } from '@/app/actions/obligations';
import { uploadEvidenceFile } from '@/app/actions/evidence';
import type { ObligationRow } from '@/app/actions/obligations';
import type { ObligationStatus } from '@/lib/data';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

const statuses: ObligationStatus[] = ['compliant', 'in_progress', 'overdue', 'not_started'];

const statusConfig: Record<ObligationStatus, { color: string; bg: string; icon: React.ElementType }> = {
  compliant:   { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle2 },
  in_progress: { color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-300',   icon: Clock },
  overdue:     { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
  not_started: { color: 'text-slate-400',  bg: 'bg-white border-slate-200',      icon: AlertTriangle },
};

// ─── Upload Evidence Modal ────────────────────────────────────────────────────
function EvidenceUploadModal({
  obligation, onClose, onUploaded,
}: {
  obligation: ObligationRow;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function getFileType(file: File) {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const map: Record<string, string> = { PDF: 'PDF', DOCX: 'DOCX', DOC: 'DOCX', XLSX: 'XLSX', XLS: 'XLSX', PNG: 'PNG', JPG: 'JPG', JPEG: 'JPG' };
    return map[ext] || ext;
  }

  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!selectedFile) {
    setError('Please select a file.');
    return;
  }

  const fd = new FormData(e.currentTarget);
  fd.append('file', selectedFile);

  setError('');
  startTransition(async () => {
    try {
      await uploadEvidenceFile(fd);
      onUploaded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  });
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-[2px] p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'obligations.uploadEvidence')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium tracking-wide truncate max-w-[340px]">
              {t(locale, 'obligations.linkingTo')} <span className="text-slate-800 font-bold">{obligation.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Locked obligation field */}
          <div className="bg-slate-50 border border-slate-200 rounded-[2px] px-3 py-2 flex items-center gap-2">
            <div
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] border flex-shrink-0"
              style={{ color: obligation.color, borderColor: obligation.color + '40', backgroundColor: obligation.color + '15' }}
            >
              {obligation.regulation_code}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">{obligation.title}</span>
          </div>

          {/* File picker */}
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'obligations.fileStar')}</label>
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-300 rounded-[2px]">
                <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{selectedFile.name}</div>
                  <div className="text-[10px] text-slate-500">{formatBytes(selectedFile.size)}</div>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-slate-300 rounded-[2px] p-6 text-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50">
                <Upload className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                <div className="text-xs font-semibold text-slate-600">{t(locale, 'obligations.clickToSelect')}</div>
                <div className="text-[10px] text-slate-400 mt-1">{t(locale, 'obligations.fileTypes')}</div>
                <input type="file" className="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          {/* Uploaded by */}
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'obligations.uploadedBy')}</label>
            <input
              name="uploadedBy" type="text" required placeholder="e.g. Maria Coma"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[2px] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>

          {isPending && uploadProgress > 0 && (
            <div>
              <div className="h-1.5 bg-slate-200 rounded-none overflow-hidden">
                <div className="h-full bg-slate-800 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">{uploadProgress < 100 ? t(locale, 'obligations.uploading') : t(locale, 'obligations.done')}</div>
            </div>
          )}

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              {t(locale, 'common.cancel')}
            </button>
            <button type="submit" disabled={isPending || !selectedFile} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t(locale, 'obligations.uploadFile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Status Modal ──────────────────────────────────────────────────────
function ChangeStatusModal({
  obligation, onClose, onChanged,
}: {
  obligation: ObligationRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ObligationStatus>(obligation.status);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (selected === obligation.status) { onClose(); return; }
    setError('');
    startTransition(async () => {
      try {
        await updateObligationStatus(obligation.id, selected);
        onChanged();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Update failed.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white border border-slate-300 rounded-[2px] p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'obligations.changeStatus')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate max-w-[260px]">{obligation.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {statuses.map(s => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-[2px] border transition-colors text-left',
                  selected === s ? cfg.bg + ' ' + cfg.color : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <cfg.icon className={clsx('w-4 h-4 flex-shrink-0', selected === s ? cfg.color : 'text-slate-400')} />
                <span className="text-xs font-bold uppercase tracking-wide">{t(locale, `status.${s}`)}</span>
                {s === obligation.status && (
                  <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t(locale, 'obligations.current')}</span>
                )}
              </button>
            );
          })}
        </div>

        {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2 mb-4">{error}</div>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
            {t(locale, 'common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t(locale, 'common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Obligation Modal ─────────────────────────────────────────────────────
function AddObligationModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const regulation = fd.get('regulation') as string;
    const title = fd.get('title') as string;
    const description = fd.get('description') as string;
    const owner = fd.get('owner') as string;
    const dueDate = fd.get('dueDate') as string;
    const category = fd.get('category') as string;

    const regCodes: Record<string, string> = {
      'AML Law 14/2017': 'AML',
      'MiFID II (Law 7/2024)': 'MIFID',
      'AFA Annual Review': 'AFA',
      'CRS/FATCA': 'CRS',
    };

    if (!regulation || !title || !owner || !dueDate || !category) {
      setError('All fields are required.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        await addObligation({
          regulation, regulationCode: regCodes[regulation] ?? 'OBL',
          title, description, owner, dueDate, category,
        });
        onAdded();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to add obligation.');
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
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'obligations.addObligationTitle')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{t(locale, 'obligations.addObligationSub')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>{t(locale, 'obligations.regulation')}</label>
              <select name="regulation" required className={inputCls}>
                <option value="">{t(locale, 'obligations.selectRegulation')}</option>
                {['AML Law 14/2017', 'MiFID II (Law 7/2024)', 'AFA Annual Review', 'CRS/FATCA'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{t(locale, 'obligations.title')}</label>
              <input name="title" required placeholder="e.g. Annual AML Risk Assessment" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{t(locale, 'obligations.description')}</label>
              <textarea name="description" rows={3} placeholder={t(locale, 'obligations.descriptionPlaceholder')} className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>{t(locale, 'obligations.owner')}</label>
              <input name="owner" required placeholder="e.g. Maria Coma" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t(locale, 'obligations.dueDate')}</label>
              <input name="dueDate" type="date" required className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{t(locale, 'obligations.category')}</label>
              <input name="category" required placeholder={t(locale, 'obligations.categoryPlaceholder')} className={inputCls} />
            </div>
          </div>

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              {t(locale, 'common.cancel')}
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t(locale, 'obligations.addObligation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Obligation Row ───────────────────────────────────────────────────────────
function ObligationRow({
  ob, onStatusClick, onUploadClick,
}: {
  ob: ObligationRow;
  onStatusClick: (ob: ObligationRow) => void;
  onUploadClick: (ob: ObligationRow) => void;
}) {
  const { locale } = useLocale();
  const cfg = statusConfig[ob.status];
  const Icon = cfg.icon;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = ob.due_date < today && ob.status !== 'compliant';

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors group">
      <div
        className="flex-shrink-0 w-10 text-center text-[8px] font-bold tracking-widest uppercase border px-1 py-0.5 rounded-[2px]"
        style={{ color: ob.color, borderColor: ob.color + '40', backgroundColor: ob.color + '10' }}
      >
        {ob.regulation_code}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800 truncate">{ob.title}</div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
          <span>{ob.owner}</span>
          <span className="text-slate-300">·</span>
          <span className={isOverdue ? 'text-red-600 font-bold' : ''}>{t(locale, 'obligations.due')} {ob.due_date}</span>
          <span className="text-slate-300">·</span>
          <span>{ob.evidence_count} {ob.evidence_count !== 1 ? t(locale, 'obligations.evidenceFiles') : t(locale, 'obligations.evidenceFile')}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onUploadClick(ob)}
          title={t(locale, 'obligations.uploadEvidence')}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-[2px] border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-3 h-3" />
          <span className="hidden sm:inline">{t(locale, 'obligations.uploadEvidence')}</span>
        </button>
      </div>
      <button
        onClick={() => onStatusClick(ob)}
        className={clsx(
          'flex items-center gap-1.5 text-[9px] font-bold flex-shrink-0 px-2 py-1 rounded-[2px] border transition-colors',
          cfg.bg, cfg.color
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t(locale, `status.${ob.status}`)}</span>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ObligationsPageClient({ initialObligations }: { initialObligations: ObligationRow[] }) {
  const { locale } = useLocale();
  const [obligations, setObligations] = useState(initialObligations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ObligationStatus>('all');
  const [regFilter, setRegFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [changeStatusOb, setChangeStatusOb] = useState<ObligationRow | null>(null);
  const [uploadEvidenceOb, setUploadEvidenceOb] = useState<ObligationRow | null>(null);

  const refresh = () => window.location.reload();

  const regulations = ['All', ...Array.from(new Set(obligations.map(o => o.regulation)))];

  const filtered = obligations.filter(ob => {
    const matchSearch = ob.title.toLowerCase().includes(search.toLowerCase()) ||
      ob.owner.toLowerCase().includes(search.toLowerCase()) ||
      ob.regulation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || ob.status === statusFilter;
    const matchReg = regFilter === 'All' || ob.regulation === regFilter;
    return matchSearch && matchStatus && matchReg;
  });

  const counts = {
    compliant:   obligations.filter(o => o.status === 'compliant').length,
    in_progress: obligations.filter(o => o.status === 'in_progress').length,
    overdue:     obligations.filter(o => o.status === 'overdue').length,
    not_started: obligations.filter(o => o.status === 'not_started').length,
  };

  const grouped = filtered.reduce((acc, ob) => {
    if (!acc[ob.regulation]) acc[ob.regulation] = [];
    acc[ob.regulation].push(ob);
    return acc;
  }, {} as Record<string, ObligationRow[]>);

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">

      {/* Modals */}
      {showAddModal && <AddObligationModal onClose={() => setShowAddModal(false)} onAdded={refresh} />}
      {changeStatusOb && (
        <ChangeStatusModal
          obligation={changeStatusOb}
          onClose={() => setChangeStatusOb(null)}
          onChanged={refresh}
        />
      )}
      {uploadEvidenceOb && (
        <EvidenceUploadModal
          obligation={uploadEvidenceOb}
          onClose={() => setUploadEvidenceOb(null)}
          onUploaded={refresh}
        />
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statuses.map(s => {
          const cfg = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={clsx(
                'px-3 py-3 rounded-[2px] border text-left flex flex-col transition-colors',
                statusFilter === s ? cfg.bg + ' ' + cfg.color : 'bg-white border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={clsx('text-[9px] font-bold uppercase tracking-widest mb-1', statusFilter === s ? cfg.color : 'text-slate-500')}>
                {t(locale, `status.${s}`)}
              </div>
              <div className={clsx('text-2xl font-bold leading-none', statusFilter === s ? cfg.color : 'text-slate-900')}>
                {counts[s]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filter bar */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-2 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder={t(locale, 'obligations.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[2px] text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {regulations.map(r => (
            <button
              key={r} onClick={() => setRegFilter(r)}
              className={clsx(
                'text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-[2px] border transition-colors whitespace-nowrap',
                regFilter === r ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
            >
              {r === 'All' ? t(locale, 'common.all') : r.split(' ')[0]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white border border-slate-800 px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wide transition-colors ml-auto"
        >
          <Plus className="w-3 h-3" /> {t(locale, 'common.addObligation')}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 gap-3">
        <span>{t(locale, 'obligations.obligationsCount', { count: filtered.length })}</span>
        <span className="text-slate-300">|</span>
        <span>{t(locale, 'obligations.missingEvidence', { count: obligations.filter(o => o.evidence_count === 0).length })}</span>
      </div>

      {/* Grouped obligation list */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([reg, obs]) => (
          <div key={reg} className="bg-white border border-slate-300 rounded-[2px]">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: obs[0]?.color ?? '#64748b' }} />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{reg}</span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">({obs.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {obs.map(ob => (
                <ObligationRow
                  key={ob.id}
                  ob={ob}
                  onStatusClick={setChangeStatusOb}
                  onUploadClick={setUploadEvidenceOb}
                />
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">{t(locale, 'obligations.noObligationsMatch')}</div>
        )}
      </div>
    </div>
  );
}