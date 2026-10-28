import React from 'react';
import {
  ShoppingCart,
  MessageSquare,
  Database,
  UploadCloud,
  Settings,
  MapPin,
  Flame,
  RotateCcw
} from 'lucide-react';
import { AdminResolutionMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  activeTab: 'transaksi' | 'retur' | 'followup' | 'master';
  onChangeTab: (tab: 'transaksi' | 'retur' | 'followup' | 'master') => void;
  followUpCount: number;
  totalOrdersCount: number;
  blankCount: number;
  returCount: number;
  adminMode: AdminResolutionMode;
  onChangeAdminMode: (mode: AdminResolutionMode) => void;
  onOpenUpload: () => void;
  isFirebaseConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  activeTab,
  onChangeTab,
  followUpCount,
  totalOrdersCount,
  returCount,
  adminMode,
  onChangeAdminMode,
  onOpenUpload,
  isFirebaseConnected
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Company Profile Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-600 flex flex-col items-center justify-center text-white font-extrabold shadow-sm shrink-0 leading-none p-1 text-center">
              <span className="text-[10px] tracking-widest font-black uppercase">DELTA</span>
              <span className="text-[7px] text-red-200 uppercase scale-90">DP•DSD•DPP•DPI</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate leading-snug">
                Delta Group
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">(ID: 421330858)</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate">KOTA DENPASAR, BALI</span>
              </div>
            </div>
          </div>

          {/* Database & Subscription Badge */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[9px] font-bold text-teal-700">
                IDH
              </div>
              <div className="leading-tight">
                <p className="text-[10px] text-slate-400">Database</p>
                <p className="text-[11px] font-bold text-teal-900 truncate max-w-[95px]">
                  CekOrderIDHLookup
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isFirebaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500" />
              <span>{isFirebaseConnected ? 'Cloud On' : 'Offline'}</span>
            </span>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
          {/* Main Transaksi Group */}
          <div className="pt-1 pb-1 space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Menu Utama IDH
            </p>

            {/* Transaksi / Daftar Transaksi */}
            <button
              onClick={() => {
                onChangeTab('transaksi');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                activeTab === 'transaksi'
                  ? 'bg-[#005b64]/10 text-[#005b64] font-bold border-l-4 border-[#005b64]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-[#005b64]" />
                <span>Daftar Transaksi</span>
              </div>
              {totalOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                  {totalOrdersCount.toLocaleString('id-ID')}
                </span>
              )}
            </button>

            {/* Retur & Tukar IDH */}
            <button
              onClick={() => {
                onChangeTab('retur');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                activeTab === 'retur'
                  ? 'bg-[#005b64]/10 text-[#005b64] font-bold border-l-4 border-[#005b64]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#f5a623]" />
                <span>Retur & Tukar IDH</span>
              </div>
              {returCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  {returCount.toLocaleString('id-ID')}
                </span>
              )}
            </button>

            {/* Follow-Up WhatsApp */}
            <button
              onClick={() => {
                onChangeTab('followup');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                activeTab === 'followup'
                  ? 'bg-[#005b64]/10 text-[#005b64] font-bold border-l-4 border-[#005b64]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Follow-Up WA</span>
              </div>
              {followUpCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                  {followUpCount}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Firebase</span>
              )}
            </button>

            {/* Master PCP Reference */}
            <button
              onClick={() => {
                onChangeTab('master');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                activeTab === 'master'
                  ? 'bg-[#005b64]/10 text-[#005b64] font-bold border-l-4 border-[#005b64]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-teal-600" />
                <span>Master PCP & DEPO</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">87 PCP</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="pt-3 border-t border-slate-100">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Alat & Pengaturan
            </p>

            <button
              onClick={() => {
                onOpenUpload();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload File CSV Baru</span>
            </button>

            {/* Mode Admint Dropdown */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mt-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-slate-500" /> Mode ADMINT:
              </label>
              <select
                value={adminMode}
                onChange={(e) => onChangeAdminMode(e.target.value as AdminResolutionMode)}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005b64]"
              >
                <option value="auto">Otomatis (Depo/DPS)</option>
                <option value="dps_first">DPS Saja</option>
                <option value="depo_first">Depo Prioritas</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                Singaraja, Negara, Karangasem, Klungkung memakai Admin Depo.
              </p>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50/50">
          <p className="font-semibold text-slate-700">IDH Delta Bali v3.0</p>
          <p className="text-[10px] text-slate-400">Terintegrasi Cloud Firestore</p>
        </div>
      </aside>
    </>
  );
};
