import React, { useState, useEffect, useMemo } from 'react';
import {
  ProcessedOrderRow,
  FilterState,
  AdminResolutionMode,
  MasterPcpEntry,
  MasterDepoEntry
} from './types';
import {
  getStoredMasterDps,
  saveStoredMasterDps,
  getStoredMasterDepo,
  saveStoredMasterDepo,
  resetMasterDataToDefault
} from './data/masterPcpData';
import { parseCsvFile, ParseProgress } from './utils/csvParser';
import { testFirestoreConnection } from './firebase';
import {
  FollowUpRecord,
  subscribeFollowUpOrders,
  saveFollowUpOrder,
  seedDefaultMasterToFirestore,
  fetchMasterDpsFromFirestore,
  fetchMasterDepoFromFirestore
} from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { DataTable } from './components/DataTable';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { MasterPcpModal } from './components/MasterPcpModal';
import { FollowUpModal } from './components/FollowUpModal';
import { formatMultipleRowsForWhatsApp } from './utils/whatsappFormatter';
import {
  Check,
  AlertCircle,
  FileSpreadsheet,
  Flame,
  Info,
  Settings,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Play
} from 'lucide-react';

export default function App() {
  // Master PCP references
  const [dpsMaster, setDpsMaster] = useState<MasterPcpEntry[]>(() => getStoredMasterDps());
  const [depoMaster, setDepoMaster] = useState<MasterDepoEntry[]>(() => getStoredMasterDepo());
  const [adminMode, setAdminMode] = useState<AdminResolutionMode>('auto');

  // Firebase connection & Follow-Up orders state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>([]);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transaksi' | 'followup' | 'master'>('transaksi');

  // Order data
  const [orders, setOrders] = useState<ProcessedOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');

  // Filtering state
  const [filter, setFilter] = useState<FilterState>({
    statusFilter: 'blank_only', // Default focus on blank orders as requested
    principal: '',
    titikKirim: '',
    admint: '',
    searchQuery: '',
    dateFilter: ''
  });

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    rows: ProcessedOrderRow[];
    mode: 'single' | 'batch';
  }>({
    isOpen: false,
    rows: [],
    mode: 'single'
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Test Firestore Connection on boot & Subscribe to FollowUp orders
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initFirestore() {
      const res = await testFirestoreConnection();
      setIsFirebaseConnected(res.connected);
      if (res.connected) {
        unsubscribe = subscribeFollowUpOrders((records) => {
          setFollowUpRecords(records);
        });

        try {
          const cloudDps = await fetchMasterDpsFromFirestore();
          if (cloudDps.length > 0) {
            setDpsMaster(cloudDps);
          }
          const cloudDepo = await fetchMasterDepoFromFirestore();
          if (cloudDepo.length > 0) {
            setDepoMaster(cloudDepo);
          }
        } catch (e) {
          console.warn('Initial cloud master fetch note:', e);
        }
      }
    }

    initFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Map of rowId -> followUpStatus for quick lookup in table
  const followUpMap = useMemo(() => {
    const map = new Map<string, string>();
    followUpRecords.forEach((r) => {
      map.set(r.id, r.followUpStatus);
    });
    return map;
  }, [followUpRecords]);

  // Save/record order to Firestore follow-up
  const handleSaveOrderToFirebase = async (
    row: ProcessedOrderRow,
    status: 'wa_sent' | 'pending' | 'confirmed' = 'wa_sent'
  ) => {
    try {
      await saveFollowUpOrder(row, status);
      showToast(`Order #${row.noPoIdh} tercatat di database Firebase!`);
    } catch (err: any) {
      console.error('Firebase save error:', err);
    }
  };

  // Seed / sync master data to Firestore
  const handleSyncMasterToFirestore = async () => {
    try {
      showToast('Menyinkronkan Master PCP ke Firebase CekOrderIDHLookup...');
      const res = await seedDefaultMasterToFirestore();
      showToast(`Sukses! ${res.dpsCount} DPS dan ${res.depoCount} DEPO tersimpan di Firestore.`);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Gagal sinkron ke Firebase: ${err.message}`);
    }
  };

  // Save changes to master data
  const handleSaveDpsList = (newList: MasterPcpEntry[]) => {
    setDpsMaster(newList);
    saveStoredMasterDps(newList);
    showToast('Data Master DPS diperbarui.');
  };

  const handleSaveDepoList = (newList: MasterDepoEntry[]) => {
    setDepoMaster(newList);
    saveStoredMasterDepo(newList);
    showToast('Data Master DEPO diperbarui.');
  };

  const handleResetMaster = () => {
    const { dps, depo } = resetMasterDataToDefault();
    setDpsMaster(dps);
    setDepoMaster(depo);
    showToast('Data Master dikembalikan ke bawaan.');
  };

  // Load custom CSV file
  const handleFileUpload = async (file: File, maxRows?: number) => {
    setIsLoading(true);
    setActiveFileName(file.name);
    setParseProgress({ loadedRows: 0, percent: 0, status: 'parsing' });

    try {
      const results = await parseCsvFile(
        file,
        dpsMaster,
        depoMaster,
        adminMode,
        (prog) => setParseProgress(prog),
        maxRows
      );
      setOrders(results);
      setSelectedRowIds(new Set());
      const blankCount = results.filter((r) => r.isStatusBlank).length;
      showToast(
        `Sukses memuat ${results.length.toLocaleString('id-ID')} baris! Ditemukan ${blankCount.toLocaleString(
          'id-ID'
        )} item berstatus blank.`
      );
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membaca file CSV: ${err.message || 'Format tidak valid'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample data bundled in public/assets
  const handleLoadSample = async (maxRows?: number) => {
    setIsLoading(true);
    setActiveFileName('order-IDH (Sampel Sistem)');
    setParseProgress({ loadedRows: 0, percent: 5, status: 'parsing' });

    try {
      let sampleUrl = '/assets/sample-order-idh.csv';
      try {
        const checkLarge = await fetch('/assets/aistudio/order-IDH_01-20_10__7bfb880f.csv', { method: 'HEAD' });
        if (checkLarge.ok) {
          sampleUrl = '/assets/aistudio/order-IDH_01-20_10__7bfb880f.csv';
        }
      } catch (e) {
        // use lightweight sample
      }

      const results = await parseCsvFile(
        sampleUrl,
        dpsMaster,
        depoMaster,
        adminMode,
        (prog) => setParseProgress(prog),
        maxRows
      );
      setOrders(results);
      setSelectedRowIds(new Set());
      const blankCount = results.filter((r) => r.isStatusBlank).length;
      showToast(
        `Berhasil memuat sampel! Total: ${results.length.toLocaleString(
          'id-ID'
        )} baris (${blankCount.toLocaleString('id-ID')} Status Blank).`
      );
    } catch (err: any) {
      console.error(err);
      alert(`Gagal memuat sampel CSV: ${err.message || 'File tidak ditemukan'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Tutup data transaksi saat ini dan kembali ke menu upload?')) {
      setOrders([]);
      setActiveFileName('');
      setSelectedRowIds(new Set());
      setParseProgress(null);
    }
  };

  // Distinct lists for dropdowns
  const distinctPrincipals = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((r) => {
      if (r.principal && r.principal !== '-') set.add(r.principal);
    });
    return Array.from(set).sort();
  }, [orders]);

  const distinctTitikKirim = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((r) => {
      if (r.titikKirim) set.add(r.titikKirim);
    });
    return Array.from(set).sort();
  }, [orders]);

  const distinctAdmins = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((r) => {
      if (r.admint && r.admint !== '-') set.add(r.admint);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Filtered rows
  const filteredOrders = useMemo(() => {
    const query = filter.searchQuery.toLowerCase().trim();

    return orders.filter((row) => {
      if (filter.statusFilter === 'blank_only' && !row.isStatusBlank) return false;
      if (filter.statusFilter === 'confirmed' && row.statusProduk.toLowerCase() !== 'confirmed') return false;
      if (filter.statusFilter === 'canceled' && row.statusProduk.toLowerCase() !== 'canceled') return false;

      if (filter.principal && row.principal !== filter.principal) return false;
      if (filter.titikKirim && row.titikKirim !== filter.titikKirim) return false;
      if (filter.admint && row.admint !== filter.admint) return false;

      if (query) {
        const matchPo = row.noPoIdh.toLowerCase().includes(query);
        const matchCust = row.namaPelanggan.toLowerCase().includes(query);
        const matchIdCust = row.idPelanggan.toLowerCase().includes(query);
        const matchHp = row.hpPelanggan.toLowerCase().includes(query);
        const matchAddr = row.alamatPelanggan.toLowerCase().includes(query);
        const matchBarang = row.namaBarang?.toLowerCase().includes(query) || false;
        const matchPrinc = row.principal.toLowerCase().includes(query);
        const matchAdmin = row.admint.toLowerCase().includes(query);

        if (
          !matchPo &&
          !matchCust &&
          !matchIdCust &&
          !matchHp &&
          !matchAddr &&
          !matchBarang &&
          !matchPrinc &&
          !matchAdmin
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filter]);

  // Selection handlers
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      const newSet = new Set(filteredOrders.slice(0, 500).map((r) => r.rowId));
      setSelectedRowIds(newSet);
    }
  };

  // WhatsApp Batch Copy
  const handleBatchCopyWhatsApp = async () => {
    const rowsToCopy = filteredOrders.slice(0, 50);
    if (rowsToCopy.length === 0) {
      alert('Tidak ada data yang tersedia untuk disalin.');
      return;
    }

    setPreviewModalState({
      isOpen: true,
      rows: rowsToCopy,
      mode: 'batch'
    });
  };

  const handleCopySelectedWhatsApp = () => {
    const selectedList = orders.filter((r) => selectedRowIds.has(r.rowId));
    if (selectedList.length === 0) return;

    setPreviewModalState({
      isOpen: true,
      rows: selectedList,
      mode: 'batch'
    });
  };

  const handlePreviewSingleRow = (row: ProcessedOrderRow) => {
    setPreviewModalState({
      isOpen: true,
      rows: [row],
      mode: 'single'
    });
  };

  // Export processed data to clean CSV
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      alert('Tidak ada data yang dapat diekspor.');
      return;
    }

    const headers = [
      'TGL PO IDH',
      'nomor IDH #PO',
      'Prod_Ok',
      'Principal',
      'ID Pelanggan',
      'Nama Pelanggan',
      'HP Pelanggan',
      'Alamat Pelanggan',
      'Titik Kirim',
      'ADMINT',
      'Status Produk',
      'Nama Barang',
      'Qty'
    ];

    const escapeCsv = (val: string | undefined) => {
      if (!val) return '""';
      return `"${val.replace(/"/g, '""')}"`;
    };

    const csvLines = [headers.join(',')];

    filteredOrders.forEach((row) => {
      const line = [
        escapeCsv(row.tglPoIdh),
        escapeCsv(row.noPoIdh),
        escapeCsv(row.prodOk),
        escapeCsv(row.principal),
        escapeCsv(row.idPelanggan),
        escapeCsv(row.namaPelanggan),
        escapeCsv(row.hpPelanggan),
        escapeCsv(row.alamatPelanggan),
        escapeCsv(row.titikKirim),
        escapeCsv(row.admint),
        escapeCsv(row.isStatusBlank ? 'BLANK' : row.statusProduk),
        escapeCsv(row.namaBarang || ''),
        escapeCsv(row.qty || '')
      ];
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hasil_Lookup_IDH_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File CSV berhasil didownload!');
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#005b64] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-60 bg-[#005b64] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce border border-teal-400/40">
          <Check className="w-4 h-4 stroke-[3] text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar in IDH Teal */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        totalRows={orders.length}
        blankCount={orders.filter((r) => r.isStatusBlank).length}
        followUpCount={followUpRecords.length}
        onOpenFollowUpModal={() => setIsFollowUpModalOpen(true)}
        onOpenMasterModal={() => setIsMasterModalOpen(true)}
        onOpenUploadModal={handleResetData}
        isFirebaseConnected={isFirebaseConnected}
        hasData={orders.length > 0}
        onResetData={handleResetData}
      />

      {/* Portal Layout: Sidebar + Main Content */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'followup') {
              setIsFollowUpModalOpen(true);
            } else if (tab === 'master') {
              setIsMasterModalOpen(true);
            }
          }}
          followUpCount={followUpRecords.length}
          totalOrdersCount={orders.length}
          blankCount={orders.filter((r) => r.isStatusBlank).length}
          adminMode={adminMode}
          onChangeAdminMode={(mode) => {
            setAdminMode(mode);
            if (orders.length > 0) {
              handleLoadSample(orders.length);
            }
          }}
          onOpenUpload={handleResetData}
          isFirebaseConnected={isFirebaseConnected}
        />

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {orders.length === 0 ? (
            /* Upload Screen */
            <FileUpload
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              progress={parseProgress}
              isLoading={isLoading}
            />
          ) : (
            /* Active Transactions View matching IDH Portal screenshot */
            <div className="space-y-4">
              {/* Header Title Bar matching Screenshot */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Daftar Transaksi
                  </h2>
                  <p className="text-xs text-slate-500">
                    File:{' '}
                    <strong className="text-slate-800 font-medium">{activeFileName}</strong> •
                    Titik Kirim Bali & Rujukan Master PCP
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMasterModalOpen(true)}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs"
                    title="Informasi Master PCP"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsFollowUpModalOpen(true)}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-amber-600 hover:text-amber-700 shadow-xs"
                    title="Riwayat Follow-Up Firebase"
                  >
                    <Flame className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <StatsCards
                data={orders}
                activeFilter={filter.statusFilter}
                onSelectFilter={(newStatus) =>
                  setFilter((prev) => ({ ...prev, statusFilter: newStatus }))
                }
              />

              {/* Collapsible Filter / Export Bar */}
              <FilterBar
                filter={filter}
                onFilterChange={(newVals) => setFilter((prev) => ({ ...prev, ...newVals }))}
                onResetFilters={() =>
                  setFilter({
                    statusFilter: 'all',
                    principal: '',
                    titikKirim: '',
                    admint: '',
                    searchQuery: '',
                    dateFilter: ''
                  })
                }
                principals={distinctPrincipals}
                titikKirimList={distinctTitikKirim}
                adminList={distinctAdmins}
                filteredCount={filteredOrders.length}
                totalCount={orders.length}
                onBatchCopyWhatsApp={handleBatchCopyWhatsApp}
                onExportCsv={handleExportCsv}
                selectedRowsCount={selectedRowIds.size}
                onCopySelectedWhatsApp={handleCopySelectedWhatsApp}
              />

              {/* Processed Orders Table with IDH Deep Teal Bar & Orange Buttons */}
              <DataTable
                rows={filteredOrders}
                selectedRowIds={selectedRowIds}
                onToggleSelectRow={handleToggleSelectRow}
                onToggleSelectAll={handleToggleSelectAll}
                onPreviewWhatsApp={handlePreviewSingleRow}
                onOpenRowDetail={handlePreviewSingleRow}
                followUpMap={followUpMap}
                onSaveToFirebase={handleSaveOrderToFirebase}
              />
            </div>
          )}
        </main>
      </div>

      {/* Master PCP Reference Modal */}
      <MasterPcpModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        dpsList={dpsMaster}
        depoList={depoMaster}
        onSaveDpsList={handleSaveDpsList}
        onSaveDepoList={handleSaveDepoList}
        onResetMaster={handleResetMaster}
        onSyncToFirestore={handleSyncMasterToFirestore}
      />

      {/* Follow-Up Orders Modal (Firebase) */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        records={followUpRecords}
        onShowToast={showToast}
      />

      {/* WhatsApp Preview & Copy Modal */}
      <WhatsAppPreviewModal
        isOpen={previewModalState.isOpen}
        onClose={() =>
          setPreviewModalState((prev) => ({
            ...prev,
            isOpen: false
          }))
        }
        rows={previewModalState.rows}
        mode={previewModalState.mode}
      />

      {/* Footer styled exactly like screenshot */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-2">
          {/* Social icons */}
          <div className="flex items-center gap-4 text-[#005b64]">
            <Play className="w-4 h-4 fill-current cursor-pointer hover:opacity-80" />
            <Facebook className="w-4 h-4 fill-current cursor-pointer hover:opacity-80" />
            <Twitter className="w-4 h-4 fill-current cursor-pointer hover:opacity-80" />
            <Instagram className="w-4 h-4 cursor-pointer hover:opacity-80" />
            <Youtube className="w-4 h-4 cursor-pointer hover:opacity-80" />
          </div>
          <p className="text-[11px] text-slate-500">
            © 2019 - 2026 IDH - Indonesia Distribution Hub • Delta Group Denpasar Bali
          </p>
        </div>
      </footer>
    </div>
  );
}
