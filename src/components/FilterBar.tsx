import React, { useState } from 'react';
import { Search, Filter, X, Copy, Download, Share2, AlertCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onResetFilters: () => void;
  principals: string[];
  titikKirimList: string[];
  adminList: string[];
  filteredCount: number;
  totalCount: number;
  onBatchCopyWhatsApp: () => void;
  onExportCsv: () => void;
  selectedRowsCount: number;
  onCopySelectedWhatsApp: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  onResetFilters,
  principals,
  titikKirimList,
  adminList,
  filteredCount,
  totalCount,
  onBatchCopyWhatsApp,
  onExportCsv,
  selectedRowsCount,
  onCopySelectedWhatsApp
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const isAnyFilterActive =
    filter.statusFilter !== 'all' ||
    filter.principal !== '' ||
    filter.titikKirim !== '' ||
    filter.admint !== '' ||
    filter.searchQuery !== '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs mb-5 overflow-hidden">
      {/* Top Bar: "Filter/Export CSV" styled like screenshot */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#005b64] hover:text-[#00474f]"
          >
            <span className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center text-xs font-bold">
              {isFilterExpanded ? '−' : '+'}
            </span>
            <span className="text-sm">Filter / Export CSV</span>
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ({filteredCount.toLocaleString('id-ID')} dari {totalCount.toLocaleString('id-ID')} baris)
          </span>
        </div>

        {/* Quick Export & Batch Actions */}
        <div className="flex items-center gap-2">
          {selectedRowsCount > 0 ? (
            <button
              onClick={onCopySelectedWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f39c12] hover:bg-[#e67e22] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Terpilih ({selectedRowsCount})</span>
            </button>
          ) : (
            <button
              onClick={onBatchCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f39c12] hover:bg-[#e67e22] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="Salin semua data yang difilter ke chat WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Salin WA ({Math.min(filteredCount, 50)})</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Filter Content */}
      {isFilterExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {/* Row 1: Search & Status Selector */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input styled like screenshot 'Nomor PO/Nama' */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                placeholder="Nomor PO / Nama Pelanggan / ID / No HP..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#005b64] focus:bg-white transition-all font-medium"
              />
              {filter.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 shrink-0 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => onFilterChange({ statusFilter: 'blank_only' })}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filter.statusFilter === 'blank_only'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-amber-800 hover:bg-amber-100/60'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Status Blank / Kosong</span>
              </button>

              <button
                type="button"
                onClick={() => onFilterChange({ statusFilter: 'all' })}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  filter.statusFilter === 'all'
                    ? 'bg-[#005b64] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Semua Status
              </button>

              <button
                type="button"
                onClick={() => onFilterChange({ statusFilter: 'confirmed' })}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  filter.statusFilter === 'confirmed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Confirmed
              </button>

              <button
                type="button"
                onClick={() => onFilterChange({ statusFilter: 'canceled' })}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  filter.statusFilter === 'canceled'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Canceled
              </button>
            </div>
          </div>

          {/* Row 2: Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Principal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Principal:
              </label>
              <select
                value={filter.principal}
                onChange={(e) => onFilterChange({ principal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005b64]"
              >
                <option value="">Semua Principal ({principals.length})</option>
                {principals.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Titik Kirim */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Titik Kirim:
              </label>
              <select
                value={filter.titikKirim}
                onChange={(e) => onFilterChange({ titikKirim: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005b64]"
              >
                <option value="">Semua Titik Kirim</option>
                {titikKirimList.map((tk) => (
                  <option key={tk} value={tk}>
                    {tk || '(Denpasar / Bawaan)'}
                  </option>
                ))}
              </select>
            </div>

            {/* ADMINT */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ADMINT:
              </label>
              <select
                value={filter.admint}
                onChange={(e) => onFilterChange({ admint: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005b64]"
              >
                <option value="">Semua ADMINT ({adminList.length})</option>
                {adminList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              {isAnyFilterActive ? (
                <button
                  onClick={onResetFilters}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-rose-600 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              ) : (
                <div className="w-full text-center py-1.5 text-xs text-slate-400 italic">
                  Filter standar aktif
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
