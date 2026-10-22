import React from 'react';
import {
  Menu,
  Flame,
  MessageSquare,
  Database,
  UploadCloud,
  ChevronDown,
  User,
  Hexagon,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  totalRows: number;
  blankCount: number;
  followUpCount: number;
  onOpenFollowUpModal: () => void;
  onOpenMasterModal: () => void;
  onOpenUploadModal: () => void;
  isFirebaseConnected: boolean;
  hasData: boolean;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  totalRows,
  blankCount,
  followUpCount,
  onOpenFollowUpModal,
  onOpenMasterModal,
  onOpenUploadModal,
  isFirebaseConnected,
  hasData,
  onResetData
}) => {
  return (
    <header className="bg-[#005b64] text-white sticky top-0 z-50 shadow-md">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Hamburger & Brand IDH.ID */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors focus:outline-none"
            title="Buka / Tutup Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* IDH.ID brand logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded bg-white text-[#005b64] flex items-center justify-center font-black shadow-sm">
              <Hexagon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none text-white font-mono">
                IDH<span className="text-teal-200">.ID</span>
              </span>
              <span className="text-[9px] text-teal-100 font-medium tracking-wide uppercase">
                Delta Bali • Cek Order
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Database badge */}
        <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 text-xs">
          <Flame
            className={`w-3.5 h-3.5 ${
              isFirebaseConnected ? 'text-amber-300 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="text-white/80">Database:</span>
          <span className="font-mono font-bold text-amber-300">CekOrderIDHLookup</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Right: Quick actions & User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Follow-up shortcut button */}
          <button
            onClick={onOpenFollowUpModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
            title="Buka riwayat follow-up WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Follow-Up WA</span>
            {followUpCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-white text-[10px]">
                {followUpCount}
              </span>
            )}
          </button>

          {/* Master PCP shortcut */}
          <button
            onClick={onOpenMasterModal}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/15"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Master PCP</span>
          </button>

          {/* Upload New File button */}
          {hasData && (
            <button
              onClick={onResetData}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white font-medium text-xs transition-all border border-white/15"
              title="Ganti file CSV saat ini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ganti File</span>
            </button>
          )}

          {/* User profile dropdown pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-bold text-white">Delta Bali</p>
              <p className="text-[10px] text-teal-200">Admin IDH</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
