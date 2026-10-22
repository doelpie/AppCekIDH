import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, FileSpreadsheet, Store, Users, ShoppingCart } from 'lucide-react';
import { ProcessedOrderRow } from '../types';

interface StatsCardsProps {
  data: ProcessedOrderRow[];
  activeFilter: string;
  onSelectFilter: (filter: 'all' | 'blank_only' | 'confirmed' | 'canceled') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  activeFilter,
  onSelectFilter
}) => {
  const totalRows = data.length;
  const blankRows = data.filter((r) => r.isStatusBlank).length;
  const confirmedRows = data.filter((r) => r.statusProduk.toLowerCase() === 'confirmed').length;
  const canceledRows = data.filter((r) => r.statusProduk.toLowerCase() === 'canceled').length;
  const uniquePos = new Set(data.map((r) => r.noPoIdh)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {/* 1. Status Blank (Action Card - Amber) */}
      <button
        type="button"
        onClick={() => onSelectFilter('blank_only')}
        className={`text-left p-3 rounded-xl border transition-all duration-150 ${
          activeFilter === 'blank_only'
            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-xs'
            : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Status Blank
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {blankRows.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-amber-600 font-bold">baris</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Perlu konfirmasi WA</p>
      </button>

      {/* 2. Total Semua Baris (Teal) */}
      <button
        type="button"
        onClick={() => onSelectFilter('all')}
        className={`text-left p-3 rounded-xl border transition-all duration-150 ${
          activeFilter === 'all'
            ? 'bg-teal-50 border-[#005b64] ring-2 ring-[#005b64] shadow-xs'
            : 'bg-white border-slate-200 hover:border-teal-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#005b64]" /> Total Transaksi
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {totalRows.toLocaleString('id-ID')}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Semua data item</p>
      </button>

      {/* 3. Confirmed (Blue) */}
      <button
        type="button"
        onClick={() => onSelectFilter('confirmed')}
        className={`text-left p-3 rounded-xl border transition-all duration-150 ${
          activeFilter === 'confirmed'
            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-xs'
            : 'bg-white border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Confirmed
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {confirmedRows.toLocaleString('id-ID')}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Produk dikonfirmasi</p>
      </button>

      {/* 4. Canceled (Rose) */}
      <button
        type="button"
        onClick={() => onSelectFilter('canceled')}
        className={`text-left p-3 rounded-xl border transition-all duration-150 ${
          activeFilter === 'canceled'
            ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400 shadow-xs'
            : 'bg-white border-slate-200 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Canceled
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {canceledRows.toLocaleString('id-ID')}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Dibatalkan</p>
      </button>

      {/* 5. Total No. PO Unik */}
      <div className="p-3 rounded-xl border bg-white border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-teal-600" /> Total No. PO
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {uniquePos.toLocaleString('id-ID')}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">Nomor PO unik</p>
      </div>
    </div>
  );
};
