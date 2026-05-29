'use client';

import { useState, useCallback, useTransition, useRef, useEffect } from 'react';
import {
  Upload, Search, FolderOpen, Plus, FileText, File, Download, Trash2, Loader2, X,
} from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { uploadEvidenceFile, deleteEvidenceFile, getSignedDownloadUrl } from '@/app/actions/evidence';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

interface EvidenceRow {
  id: string;
  name: string;
  regulation: string;
  obligation_id: string;
  upload_date: string;
  file_type: string;
  file_size: string;
  uploaded_by: string;
  storage_path?: string | null;
}

interface Obligation {
  id: string;
  title: string;
  regulation: string;
  regulation_code: string;
  evidenceCount: number;
  color?: string;
}

const regColors: Record<string, string> = {
  'AML Law 14/2017': '#4F7CFF',
  'MiFID II (Law 7/2024)': '#10B981',
  'AFA Annual Review': '#F59E0B',
  'CRS/FATCA': '#8B5CF6',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeIcon(type: string) {
  if (type === 'PDF')  return <FileText className="w-4 h-4 text-red-600" />;
  if (type === 'DOCX') return <FileText className="w-4 h-4 text-blue-600" />;
  if (type === 'XLSX') return <FileText className="w-4 h-4 text-green-600" />;
  return <File className="w-4 h-4 text-slate-500" />;
}

function getFileType(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const map: Record<string, string> = { PDF: 'PDF', DOCX: 'DOCX', DOC: 'DOCX', XLSX: 'XLSX', XLS: 'XLSX', PNG: 'PNG', JPG: 'JPG', JPEG: 'JPG' };
  return map[ext] || ext;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({
  onClose, onUploaded, obligations, pendingFile, preselectedObligationId,
}: {
  onClose: () => void;
  onUploaded: () => void;
  obligations: Obligation[];
  pendingFile?: File | null;
  preselectedObligationId?: string | null;
}) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(pendingFile || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

 const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!selectedFile) {
    setError(t(locale, 'evidence.fileStar'));
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
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(locale, 'evidence.uploadTitle')}</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium tracking-wide">{t(locale, 'evidence.uploadSubtitle')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'evidence.fileStar')}</label>
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-300 rounded-[2px]">
                {fileTypeIcon(getFileType(selectedFile))}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{selectedFile.name}</div>
                  <div className="text-[10px] text-slate-500">{formatBytes(selectedFile.size)}</div>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-[2px] p-6 text-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50"
              >
                <Upload className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                <div className="text-xs font-semibold text-slate-600">{t(locale, 'evidence.clickToSelect')}</div>
                <div className="text-[10px] text-slate-400 mt-1">{t(locale, 'evidence.fileTypes')}</div>
                <input
                  ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            )}
          </div>

          {/* Obligation selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'evidence.linkObligation')}</label>
            <select
              name="obligationId" required
              defaultValue={preselectedObligationId ?? ''}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-[2px] text-xs text-slate-800 focus:outline-none focus:border-slate-500 transition-colors"
            >
              <option value="">{t(locale, 'evidence.selectObligation')}</option>
              {obligations.map(o => (
                <option key={o.id} value={o.id}>[{o.regulation_code}] {o.title}</option>
              ))}
            </select>
          </div>

          {/* Uploaded by */}
          <div>
            <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1.5 block">{t(locale, 'evidence.uploadedBy')}</label>
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
              <div className="text-[10px] text-slate-500 mt-1 font-medium">{uploadProgress < 100 ? t(locale, 'evidence.uploading') : t(locale, 'evidence.done')}</div>
            </div>
          )}

          {error && <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[2px] transition-colors">
              {t(locale, 'common.cancel')}
            </button>
            <button type="submit" disabled={isPending || !selectedFile} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 border border-slate-800 rounded-[2px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t(locale, 'evidence.uploadFile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── File Row ─────────────────────────────────────────────────────────────────
function FileRow({ file, onDelete }: { file: EvidenceRow; onDelete: (id: string) => void }) {
  const { locale } = useLocale();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDownloading, startDownloadTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    startDeleteTransition(async () => {
      await deleteEvidenceFile(file.id, file.storage_path);
      onDelete(file.id);
    });
  };

const handleDownload = () => {
  if (!file.storage_path) {
    alert('This demo file has no actual file stored. Only real uploads are downloadable.');
    return;
  }
  startDownloadTransition(async () => {
    try {
      const url = await getSignedDownloadUrl(file.storage_path!);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  });
};
  return (
    <tr className={clsx('hover:bg-slate-50 transition-colors group', isDeleting && 'opacity-40')}>
      <td className="py-2.5 px-3 w-8">{fileTypeIcon(file.file_type)}</td>
      <td className="py-2.5 px-3">
        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate max-w-[280px] text-xs">{file.name}</div>
      </td>
      <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium tracking-wide whitespace-nowrap">
        {t(locale, 'evidence.uploadedOn')} {file.upload_date}
      </td>
      <td className="py-2.5 px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wider whitespace-nowrap">
        {file.uploaded_by}
      </td>
      <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium text-right w-20 tracking-wide">
        {file.file_size}
      </td>
      <td className="py-2.5 px-3 text-right w-24">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-6 h-6 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Download"
          >
            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-6 h-6 rounded-[2px] flex items-center justify-center text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EvidencePageClient({
  initialFiles, obligations
}: {
  initialFiles: EvidenceRow[];
  obligations: Obligation[];
}) {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState('');
  const [regFilter, setRegFilter] = useState('All');
  const [dragOver, setDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [preselectedOblId, setPreselectedOblId] = useState<string | null>(null);

  useEffect(() => {
    const oblId = searchParams.get('obligation');
    if (oblId) {
      setPreselectedOblId(oblId);
      setShowUploadModal(true);
      router.replace('/evidence');
    }
  }, [searchParams, router]);

  const refresh = () => window.location.reload();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setDroppedFile(file); setShowUploadModal(true); }
  }, []);

  const regs = ['All', ...Array.from(new Set(files.map(e => e.regulation)))];

  const filtered = files.filter(f => {
    const searchMatch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        f.regulation.toLowerCase().includes(search.toLowerCase()) ||
                        f.uploaded_by.toLowerCase().includes(search.toLowerCase());
    const regMatch = regFilter === 'All' || f.regulation === regFilter;
    return searchMatch && regMatch;
  });

  const grouped = filtered.reduce((acc, file) => {
    if (!acc[file.regulation]) acc[file.regulation] = [];
    acc[file.regulation].push(file);
    return acc;
  }, {} as Record<string, EvidenceRow[]>);

  const noEvidenceObs = obligations.filter(o => o.evidenceCount === 0);

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const openUploadFor = (oblId: string) => {
    setPreselectedOblId(oblId);
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-4 pb-12 font-sans bg-slate-50 min-h-screen px-6 pt-6">
      {showUploadModal && (
        <UploadModal
          onClose={() => { setShowUploadModal(false); setDroppedFile(null); setPreselectedOblId(null); }}
          onUploaded={refresh}
          obligations={obligations}
          pendingFile={droppedFile}
          preselectedObligationId={preselectedOblId}
        />
      )}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => setShowUploadModal(true)}
        className={clsx(
          'border-2 border-dashed rounded-[2px] p-8 text-center transition-all cursor-pointer bg-white',
          dragOver ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
        )}
      >
        <Upload className={clsx('w-6 h-6 mx-auto mb-3 transition-colors', dragOver ? 'text-slate-800' : 'text-slate-400')} />
        <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
          {t(locale, 'evidence.dropOrBrowse')} <span className="text-slate-900 underline underline-offset-2">{t(locale, 'evidence.browse')}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">{t(locale, 'evidence.fileTypes')}</div>
      </div>

      {/* Search + filter bar */}
      <div className="bg-white border border-slate-300 rounded-[2px] p-2 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder={t(locale, 'evidence.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[2px] text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {regs.map(r => (
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
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>{t(locale, 'evidence.filesCount', { count: filtered.length })}</span>
          <span className="text-slate-300">|</span>
          <span>{t(locale, 'evidence.linkedTo', { count: new Set(filtered.map(f => f.obligation_id)).size })}</span>
          {noEvidenceObs.length > 0 && (
            <><span className="text-slate-300">|</span><span className="text-orange-700">{t(locale, 'evidence.missingEvidence', { count: noEvidenceObs.length })}</span></>
          )}
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white border border-slate-800 px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wide transition-colors"
        >
          <Plus className="w-3 h-3" /> {t(locale, 'evidence.upload')}
        </button>
      </div>

      {/* Grouped file list */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([reg, regFiles]) => (
          <div key={reg} className="bg-white border border-slate-300 rounded-[2px] flex flex-col">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ background: regColors[reg] || '#64748B' }} />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{reg}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{regFiles.length} {t(locale, 'evidence.files')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-slate-100">
                  {regFiles.map(file => (
                    <FileRow key={file.id} file={file} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">{t(locale, 'evidence.noFilesMatch')}</div>
        )}
      </div>

      {/* Obligations missing evidence */}
      {noEvidenceObs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-[2px] p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3 border-b border-orange-200/50 pb-2">
            <FolderOpen className="w-4 h-4 text-orange-700" />
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-widest">{t(locale, 'evidence.missingEvidenceTitle')}</span>
          </div>
          <div className="space-y-2">
            {noEvidenceObs.map(ob => (
              <div key={ob.id} className="flex items-center justify-between group">
                <div className="text-xs font-semibold text-orange-900">
                  {ob.title}
                  <span className="text-orange-700/60 font-medium text-[11px] tracking-wide ml-2">| {ob.regulation}</span>
                </div>
                <button
                  onClick={() => openUploadFor(ob.id)}
                  className="flex items-center gap-1.5 border border-orange-300 text-orange-800 bg-white font-bold px-2 py-1 rounded-[2px] text-[9px] hover:bg-orange-100 transition-colors uppercase tracking-widest opacity-0 group-hover:opacity-100"
                >
                  <Plus className="w-3 h-3" /> {t(locale, 'evidence.addEvidence')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}