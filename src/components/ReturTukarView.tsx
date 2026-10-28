import React, { useState, useRef, useMemo } from 'react';
import {
  Zap,
  SquarePen,
  Copy,
  Check,
  Share2,
  UploadCloud,
  X,
  MessageSquare,
  Send,
  Smartphone,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProcessedReturRow } from '../types';
import { ParseProgress } from '../utils/csvParser';
import {
  formatSingleReturForWhatsApp,
  formatMultipleReturForWhatsApp,
  copyToClipboard,
  generateWhatsAppWebUrl
} from '../utils/whatsappFormatter';

interface ReturTukarViewProps {
  returRows: ProcessedReturRow[];
  isLoading: boolean;
  returProgress?: ParseProgress | null;
  onUploadReturCsv: (file: File) => void;
  onReloadSampleRetur: () => void;
  onShowToast: (msg: string) => void;
}

export const ReturTukarView: React.FC<ReturTukarViewProps> = ({
  returRows,
  isLoading,
  returProgress,
  onUploadReturCsv,
  onReloadSampleRetur,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [principalFilter, setPrincipalFilter] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const [waModalState, setWaModalState] = useState<{
    isOpen: boolean;
    rows: ProcessedReturRow[];
    mode: 'single' | 'batch';
  }>({
    isOpen: false,
    rows: [],
    mode: 'single'
  });
  const [modalCopied, setModalCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safely check both statusKonfirmasi and statusRetur for "Belum dikonfirmasi"
  const unconfirmedRows = useMemo(() => {
    return returRows.filter((r) => {
      const st = (r.statusKonfirmasi || r.statusRetur || '').trim().toLowerCase();
      return st === 'belum dikonfirmasi';
    });
  }, [returRows]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    unconfirmedRows.forEach((r) => {
      if (r.tglPengajuan) set.add(r.tglPengajuan);
    });
    return Array.from(set).sort().reverse();
  }, [unconfirmedRows]);

  const availablePrincipals = useMemo(() => {
    const set = new Set<string>();
    unconfirmedRows.forEach((r) => {
      if (r.principal) set.add(r.principal);
    });
    return Array.from(set).sort();
  }, [unconfirmedRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return unconfirmedRows.filter((row) => {
      if (dateFilter && row.tglPengajuan !== dateFilter) return false;
      if (principalFilter && row.principal !== principalFilter) return false;

      if (q) {
        const matchId = (row.idPengajuan || '').toLowerCase().includes(q);
        const matchCust = (row.namaPelanggan || '').toLowerCase().includes(q);
        const matchPrinc = (row.principal || '').toLowerCase().includes(q);
        const matchAdmin = (row.admint || '').toLowerCase().includes(q);
        const matchProdOk = (row.prodOk || '').toLowerCase().includes(q);
        if (!matchId && !matchCust && !matchPrinc && !matchAdmin && !matchProdOk) {
          return false;
        }
      }
      return true;
    });
  }, [unconfirmedRows, searchQuery, dateFilter, principalFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCurrentPage(1);
      onUploadReturCsv(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleQuickCopySingle = async (row: ProcessedReturRow) => {
    const text = formatSingleReturForWhatsApp(row);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(row.idPengajuan);
      onShowToast(`Format WA Retur No. ${row.idPengajuan} berhasil disalin!`);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleExportReturCsv = () => {
    if (filteredRows.length === 0) {
      alert('Tidak ada data Retur & Tukar untuk diekspor.');
      return;
    }

    const headers = [
      'ID Pengajuan',
      'Waktu Pengajuan',
      'Nama Pelanggan',
      'Nama Principal',
      'ProdOk',
      'Titik Kirim',
      'Nama Admint',
      'Sum Retur',
      'Sum Tukar',
      'Status Konfirmasi',
      'Status Dari Pelanggan'
    ];

    const escapeCsv = (val: string | number | undefined) => {
      const s = String(val ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };

    const blobParts: BlobPart[] = [headers.join(',') + '\n'];
    const CHUNK = 3000;

    for (let i = 0; i < filteredRows.length; i += CHUNK) {
      const slice = filteredRows.slice(i, i + CHUNK);
      const lines = slice.map((r) =>
        [
          escapeCsv(r.idPengajuan),
          escapeCsv(r.waktuPengajuan),
          escapeCsv(r.namaPelanggan),
          escapeCsv(r.principal),
          escapeCsv(r.prodOk),
          escapeCsv(r.titikKirim),
          escapeCsv(r.admint),
          escapeCsv(r.sumRetur),
          escapeCsv(r.sumTukar),
          escapeCsv(r.statusKonfirmasi || r.statusRetur || 'Belum dikonfirmasi'),
          escapeCsv(r.statusDariPelanggan)
        ].join(',')
      );
      blobParts.push(lines.join('\n') + '\n');
    }

    const blob = new Blob(blobParts, { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Retur_Tukar_IDH_Belum_Dikonfirmasi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`CSV Retur & Tukar (${filteredRows.length.toLocaleString('id-ID')} pengajuan) berhasil didownload!`);
  };

  // Visual preview capped at 100 items so modal never lags on large Retur files
  const modalPreviewText = useMemo(() => {
    if (!waModalState.isOpen || waModalState.rows.length === 0) return '';
    return waModalState.mode === 'single'
      ? formatSingleReturForWhatsApp(waModalState.rows[0])
      : formatMultipleReturForWhatsApp(waModalState.rows, undefined, 100);
  }, [waModalState]);

  const handleModalCopy = async () => {
    const fullText =
      waModalState.mode === 'single'
        ? formatSingleReturForWhatsApp(waModalState.rows[0])
        : formatMultipleReturForWhatsApp(waModalState.rows);
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setModalCopied(true);
      onShowToast('Format WhatsApp Retur & Tukar berhasil disalin penuh!');
      setTimeout(() => setModalCopied(false), 2500);
    }
  };

  const handleModalShareWa = async () => {
    const fullText =
      waModalState.mode === 'single'
        ? formatSingleReturForWhatsApp(waModalState.rows[0])
        : formatMultipleReturForWhatsApp(waModalState.rows);
    await copyToClipboard(fullText);
    const phone = waModalState.mode === 'single' ? waModalState.rows[0]?.hpPelanggan || '' : '';
    const url = generateWhatsAppWebUrl(phone, fullText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Teal Underline matching attached screenshot */}
      <div className="pb-1">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Daftar Retur &amp; Tukar Barang Pelanggan
        </h2>
        <div className="w-12 h-0.5 bg-[#005b64] mt-2" />
      </div>

      {/* Streaming Progress Bar for Large Retur CSVs (100MB - 500MB) */}
      {isLoading && returProgress && (
        <div className="bg-white border border-teal-300 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>
              Streaming CSV Retur &amp; Menyaring Status &quot;Belum dikonfirmasi&quot;...
            </span>
            <span className="font-mono text-[#005b64]">
              {returProgress.percent}% ({returProgress.loadedRows.toLocaleString('id-ID')} pengajuan aktif dari{' '}
              {(returProgress.rawRowsRead || 0).toLocaleString('id-ID')} baris)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#005b64] to-[#f5a623] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, returProgress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Card Box matching screenshot */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs p-4 sm:p-6">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          {/* Search Input matching screenshot */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full sm:w-64 bg-white border border-slate-300 rounded px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005b64]"
            />

            {/* Optional Date Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#005b64]" />
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none"
              >
                <option value="">Semua Tanggal ({availableDates.length})</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    Tgl: {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Action Buttons matching screenshot + Upload & Share WA */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded border border-teal-600 bg-teal-50 hover:bg-teal-100 text-[#005b64] text-xs font-bold transition-all disabled:opacity-50"
              title="Upload file CSV Retur & Tukar baru hingga 500MB (menghapus data lama di Firebase)"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload CSV Retur</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (filteredRows.length === 0) {
                  alert('Tidak ada data Retur & Tukar untuk di-share.');
                  return;
                }
                setModalCopied(false);
                setWaModalState({
                  isOpen: true,
                  rows: filteredRows,
                  mode: 'batch'
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#f39c12] hover:bg-[#e67e22] text-white text-xs font-bold shadow-2xs transition-all"
              title="Share / Copy Semua Retur & Tukar yang Belum Dikonfirmasi ke Format WA"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WA ({filteredRows.length.toLocaleString('id-ID')})</span>
            </button>

            <button
              type="button"
              onClick={onReloadSampleRetur}
              disabled={isLoading}
              className="px-4 py-2 rounded border border-[#005b64] bg-white hover:bg-slate-50 text-[#005b64] text-xs font-semibold transition-all"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-4 py-2 rounded bg-[#005b64] hover:bg-[#00474f] text-white text-xs font-semibold transition-all"
            >
              Filter/Export CSV
            </button>
          </div>
        </div>

        {/* Collapsible Filter / Export Panel */}
        {showFilterPanel && (
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Filter Principal:
                </label>
                <select
                  value={principalFilter}
                  onChange={(e) => {
                    setPrincipalFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                >
                  <option value="">Semua Principal ({availablePrincipals.length})</option>
                  {availablePrincipals.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || dateFilter || principalFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('');
                    setPrincipalFilter('');
                    setCurrentPage(1);
                  }}
                  className="mt-4 px-3 py-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportReturCsv}
                className="px-4 py-2 rounded bg-[#005b64] hover:bg-[#00474f] text-white font-bold"
              >
                Download Export CSV ({filteredRows.length.toLocaleString('id-ID')} Pengajuan)
              </button>
            </div>
          </div>
        )}

        {/* Table matching the screenshot */}
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#005b64] text-white text-xs font-bold uppercase tracking-wide">
                <th className="py-3.5 px-4 text-center sm:text-left">WAKTU</th>
                <th className="py-3.5 px-4 text-center sm:text-left">PELANGGAN</th>
                <th className="py-3.5 px-4 text-center">Σ RETUR</th>
                <th className="py-3.5 px-4 text-center">Σ TUKAR</th>
                <th className="py-3.5 px-4 text-center">STATUS KONFIRMASI</th>
                <th className="py-3.5 px-4 text-center">STATUS DARI PELANGGAN</th>
                <th className="py-3.5 px-4 text-center">ATUR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    Tidak ada pengajuan Retur &amp; Tukar berstatus &quot;Belum dikonfirmasi&quot;.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const hasNumericPrefix = /^\d+/.test((row.namaPelanggan || '').trim());
                  const isRowCopied = copiedId === row.idPengajuan;

                  return (
                    <tr
                      key={row.idPengajuan}
                      className={`${
                        idx % 2 === 1 ? 'bg-[#f2f2f2]' : 'bg-white'
                      } hover:bg-teal-50/40 transition-colors align-top`}
                    >
                      {/* WAKTU Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start space-y-1">
                          <span className="text-[#007b88] font-medium text-xs">
                            No. {row.idPengajuan}
                          </span>
                          <span className="text-[#007b88] text-xs">
                            {row.waktuPengajuan}
                          </span>
                          <span className="inline-block bg-[#f8e694] text-slate-900 font-bold text-[11px] px-2 py-0.5 rounded uppercase tracking-tight shadow-2xs">
                            {row.principal}
                          </span>
                        </div>
                      </td>

                      {/* PELANGGAN Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center flex-wrap gap-1 pt-0.5">
                          <span className="text-[#007b88] font-medium text-xs">
                            {row.namaPelanggan}
                          </span>
                          {hasNumericPrefix && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#005b64] text-white text-[11px] font-bold leading-none">
                              I
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Σ RETUR Column */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-800 text-xs pt-4">
                        {row.sumRetur}
                      </td>

                      {/* Σ TUKAR Column */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-800 text-xs pt-4">
                        {row.sumTukar}
                      </td>

                      {/* STATUS KONFIRMASI Column */}
                      <td className="py-3.5 px-4 text-center pt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f5a623] text-slate-950 font-bold text-xs shadow-2xs whitespace-nowrap">
                          <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                          <span>Belum dikonfirmasi</span>
                        </span>
                      </td>

                      {/* STATUS DARI PELANGGAN Column */}
                      <td className="py-3.5 px-4 text-center text-slate-600 text-xs pt-4">
                        {row.statusDariPelanggan || ''}
                      </td>

                      {/* ATUR Column */}
                      <td className="py-3.5 px-4 text-center pt-3">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickCopySingle(row)}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isRowCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                            title="Copy Format WA Retur & Tukar ini"
                          >
                            {isRowCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>WA</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setModalCopied(false);
                              setWaModalState({
                                isOpen: true,
                                rows: [row],
                                mode: 'single'
                              });
                            }}
                            className="p-1 text-[#005b64] hover:text-[#003d44] hover:bg-slate-200/60 rounded transition-colors"
                            title="Detail & Share Format WhatsApp"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer for Large Retur Files */}
        {totalPages > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan <strong>{startIndex + 1}</strong> -{' '}
              <strong>{Math.min(startIndex + pageSize, filteredRows.length)}</strong> dari{' '}
              <strong>{filteredRows.length.toLocaleString('id-ID')}</strong> pengajuan Belum dikonfirmasi
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono font-bold text-[#005b64] bg-teal-50 border border-teal-200 rounded">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Preview & Share Modal for Retur & Tukar */}
      {waModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {waModalState.mode === 'single'
                      ? `Format WA Retur & Tukar No. ${waModalState.rows[0]?.idPengajuan}`
                      : `Share Semua Retur & Tukar (${waModalState.rows.length.toLocaleString('id-ID')} Pengajuan Belum Dikonfirmasi)`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Siap disalin atau dikirim langsung ke WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModalState((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {waModalState.mode === 'single' && waModalState.rows[0] && (
                <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 space-y-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-bold text-amber-300">
                      No. {waModalState.rows[0].idPengajuan} • {waModalState.rows[0].waktuPengajuan}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      ⚡ {waModalState.rows[0].statusKonfirmasi || waModalState.rows[0].statusRetur || 'Belum dikonfirmasi'}
                    </span>
                  </div>
                  <p>
                    <strong>Pelanggan:</strong> {waModalState.rows[0].namaPelanggan} |{' '}
                    <strong>Principal:</strong> {waModalState.rows[0].principal}
                  </p>
                  <p>
                    <strong>ProdOk:</strong> {waModalState.rows[0].prodOk} |{' '}
                    <strong>Titik Kirim:</strong> {waModalState.rows[0].titikKirim} |{' '}
                    <strong>Admint:</strong> {waModalState.rows[0].admint}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Format Pesan WhatsApp:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Total: {waModalState.rows.length.toLocaleString('id-ID')} Pengajuan
                  </span>
                </div>
                <div className="bg-[#0b141a] border border-[#202c33] rounded-xl p-4 font-mono text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto">
                  {modalPreviewText}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <button
                onClick={() => setWaModalState((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleModalCopy}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    modalCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy ke Format WA ({waModalState.rows.length.toLocaleString('id-ID')})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleModalShareWa}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-bold transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Share ke WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
