import React, { useState } from 'react';
import {
  Copy,
  Check,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Calendar,
  Tag,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ProcessedOrderRow } from '../types';
import { formatSingleRowForWhatsApp, generateWhatsAppWebUrl, copyToClipboard } from '../utils/whatsappFormatter';

interface DataTableProps {
  rows: ProcessedOrderRow[];
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreviewWhatsApp: (row: ProcessedOrderRow) => void;
  onOpenRowDetail: (row: ProcessedOrderRow) => void;
  followUpMap?: Map<string, string>;
  onSaveToFirebase?: (row: ProcessedOrderRow) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onPreviewWhatsApp,
  followUpMap,
  onSaveToFirebase
}) => {
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentRows = rows.slice(startIndex, startIndex + pageSize);

  const handleCopyRow = async (row: ProcessedOrderRow) => {
    const formatted = formatSingleRowForWhatsApp(row);
    const success = await copyToClipboard(formatted);
    if (success) {
      setCopiedRowId(row.rowId);
      setTimeout(() => {
        setCopiedRowId(null);
      }, 2500);
    }
  };

  const handleDirectWhatsApp = (row: ProcessedOrderRow) => {
    const text = formatSingleRowForWhatsApp(row);
    const url = generateWhatsAppWebUrl('', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isAllFilteredSelected = rows.length > 0 && selectedRowIds.size === rows.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Sub-header Controls */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">
            Menampilkan <strong className="text-slate-900">{rows.length === 0 ? 0 : startIndex + 1}</strong> -{' '}
            <strong className="text-slate-900">{Math.min(startIndex + pageSize, rows.length)}</strong> dari{' '}
            <strong className="text-[#005b64] font-bold">{rows.length.toLocaleString('id-ID')}</strong> ORDERAN PO IDH
          </span>
          {selectedRowIds.size > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#005b64] font-bold">
              {selectedRowIds.size.toLocaleString('id-ID')} dipilih
            </span>
          )}
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-slate-500">
          <span>Tampilkan per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005b64]"
          >
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
            <option value={250}>250 baris</option>
            <option value={500}>500 baris</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto relative min-h-[350px]">
        {rows.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Tag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Tidak ada data ORDERAN PO IDH yang cocok</p>
            <p className="text-xs text-slate-400">Atur ulang filter TGL PO, status, atau kata kunci</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            {/* Table Header: Only the 8 requested fields + Checkbox & Action */}
            <thead className="bg-[#005b64] text-[11px] font-bold uppercase tracking-wider text-white sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-white/40 text-teal-700 focus:ring-teal-500 cursor-pointer"
                    title="Pilih semua ORDERAN PO IDH yang difilter"
                  />
                </th>
                <th className="py-3 px-3 whitespace-nowrap">TGL PO</th>
                <th className="py-3 px-3 whitespace-nowrap">NOMOR PO</th>
                <th className="py-3 px-3 whitespace-nowrap">NAMA OUTLET</th>
                <th className="py-3 px-3 whitespace-nowrap">PRODOK</th>
                <th className="py-3 px-3 whitespace-nowrap">NAMA PRINCIPAL</th>
                <th className="py-3 px-3 whitespace-nowrap">TITIK KIRIM</th>
                <th className="py-3 px-3 whitespace-nowrap">NAMA ADMINT</th>
                <th className="py-3 px-3 whitespace-nowrap">STATUS PRODUK</th>
                <th className="py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-[#005b64] z-20">
                  ATUR / SHARE WA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-sans">
              {currentRows.map((row) => {
                const isSelected = selectedRowIds.has(row.rowId);
                const isCopied = copiedRowId === row.rowId;
                const isFollowedUp = followUpMap && followUpMap.has(row.rowId);

                return (
                  <tr
                    key={row.rowId}
                    className={`transition-colors duration-100 ${
                      row.isStatusBlank
                        ? isSelected
                          ? 'bg-amber-100/70 hover:bg-amber-100'
                          : 'bg-amber-50/40 hover:bg-amber-100/50'
                        : isSelected
                        ? 'bg-teal-50/80 hover:bg-teal-100/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(row.rowId)}
                        className="rounded border-slate-300 text-[#005b64] focus:ring-[#005b64] cursor-pointer"
                      />
                    </td>

                    {/* 1. TGL PO (Tanpa Jam) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Calendar className="w-3 h-3 text-[#005b64] shrink-0" />
                        <span>{row.tglPoIdh}</span>
                      </div>
                    </td>

                    {/* 2. Nomor PO */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#005b64] text-sm">
                        #{row.noPoIdh}
                      </span>
                    </td>

                    {/* 3. Nama Outlet */}
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 font-bold block max-w-[230px] truncate" title={row.namaPelanggan}>
                        {row.namaPelanggan}
                      </strong>
                    </td>

                    {/* 4. ProdOk */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-[#005b64] border border-teal-200">
                        {row.prodOk}
                      </span>
                    </td>

                    {/* 5. Nama Principal */}
                    <td className="py-3 px-3">
                      <p
                        className="text-xs text-slate-700 font-semibold line-clamp-1 max-w-[210px]"
                        title={row.principal}
                      >
                        {row.principal}
                      </p>
                    </td>

                    {/* 6. Titik Kirim */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          row.titikKirim === 'DENPASAR'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-300 font-extrabold'
                        }`}
                      >
                        {row.titikKirim}
                      </span>
                    </td>

                    {/* 7. Nama Admint */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                        {row.admint}
                      </span>
                    </td>

                    {/* 8. Status Produk */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {row.isStatusBlank || row.statusProduk.toUpperCase() === 'OPEN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>OPEN</span>
                          </span>
                        ) : row.statusProduk.toLowerCase() === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Confirmed
                          </span>
                        ) : row.statusProduk.toLowerCase() === 'canceled' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Canceled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {row.statusProduk}
                          </span>
                        )}

                        {isFollowedUp && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Flame className="w-2.5 h-2.5 text-amber-600" />
                            <span>FB: WA Terkirim</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ATUR / Action Buttons */}
                    <td className="py-3 px-4 whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-xs z-20">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyRow(row);
                            if (onSaveToFirebase) onSaveToFirebase(row);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition-all shadow-sm active:scale-95 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#f39c12] hover:bg-[#e67e22] text-white'
                          }`}
                          title="Salin format WhatsApp & simpan ke Firebase"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy WA</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleDirectWhatsApp(row);
                            if (onSaveToFirebase) onSaveToFirebase(row);
                          }}
                          className="p-1.5 rounded bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs transition-all"
                          title="Share langsung ke WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onPreviewWhatsApp(row)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
                          title="Pratinjau Pesan WA"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Halaman <strong className="text-slate-900">{safePage}</strong> dari{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-medium"
            >
              Awal
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono font-bold text-[#005b64] bg-teal-50 border border-teal-200 rounded">
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-medium"
            >
              Akhir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
