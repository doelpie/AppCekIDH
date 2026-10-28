import React, { useState, useEffect, useMemo } from 'react';
import {
  ProcessedOrderRow,
  ProcessedReturRow,
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
import { parseCsvFile, parseReturCsvFile, ParseProgress } from './utils/csvParser';
import { loadOrdersFromIndexedDB, loadReturFromIndexedDB } from './utils/idbStorage';
import { buildLargeOrdersCsvBlob } from './utils/whatsappFormatter';
import { testFirestoreConnection } from './firebase';
import {
  FollowUpRecord,
  subscribeFollowUpOrders,
  saveFollowUpOrder,
  seedDefaultMasterToFirestore,
  fetchMasterDpsFromFirestore,
  fetchMasterDepoFromFirestore,
  syncAllOrdersToFirestore,
  clearAllUploadedOrdersInFirestore,
  subscribeUploadedOrdersFromFirestore,
  syncAllReturToFirestore,
  subscribeReturFromFirestore
} from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FileUpload } from './components/FileUpload';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { DataTable } from './components/DataTable';
import { ReturTukarView } from './components/ReturTukarView';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { MasterPcpModal } from './components/MasterPcpModal';
import { FollowUpModal } from './components/FollowUpModal';
import {
  Check,
  AlertCircle,
  Flame,
  Info,
  UploadCloud,
  X,
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
  const [activeTab, setActiveTab] = useState<'transaksi' | 'retur' | 'followup' | 'master'>('transaksi');

  // Order data
  const [orders, setOrders] = useState<ProcessedOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');

  // Retur & Tukar data
  const [returRows, setReturRows] = useState<ProcessedReturRow[]>([]);
  const [isReturLoading, setIsReturLoading] = useState<boolean>(false);
  const [returProgress, setReturProgress] = useState<ParseProgress | null>(null);

  // Filtering state
  const [filter, setFilter] = useState<FilterState>({
    statusFilter: 'blank_only', // Default focus on OPEN / blank orders
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

  // Notification Toast & Error Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load default Retur & Tukar sample CSV
  const loadSampleReturData = async (syncToCloud = false) => {
    setIsReturLoading(true);
    setReturProgress({ loadedRows: 0, percent: 10, status: 'parsing' });
    try {
      const parsed = await parseReturCsvFile(
        '/assets/sample-retur-idh.csv',
        dpsMaster,
        depoMaster,
        adminMode,
        false,
        (prog) => setReturProgress(prog)
      );
      setReturRows(parsed);
      if (syncToCloud && isFirebaseConnected) {
        await syncAllReturToFirestore(parsed, 'storeretur-idh_23(10)_NEW.csv');
      }
    } catch (e) {
      console.warn('Retur sample load warning:', e);
    } finally {
      setIsReturLoading(false);
      setReturProgress(null);
    }
  };

  // Test Firestore Connection on boot & Restore from IndexedDB / Subscribe to Firebase data
  useEffect(() => {
    let unsubFollowUp: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubRetur: (() => void) | undefined;

    async function initAppAndStorage() {
      // 1. Check high-capacity local IndexedDB first (instant load for 100MB-800MB datasets)
      const cachedOrders = await loadOrdersFromIndexedDB();
      if (cachedOrders && cachedOrders.rows.length > 0) {
        setOrders(cachedOrders.rows);
        setActiveFileName(cachedOrders.fileName);
      }

      const cachedRetur = await loadReturFromIndexedDB();
      if (cachedRetur && cachedRetur.rows.length > 0) {
        setReturRows(cachedRetur.rows);
      } else {
        await loadSampleReturData(false);
      }

      // 2. Connect to Firebase Firestore
      const res = await testFirestoreConnection();
      setIsFirebaseConnected(res.connected);
      if (res.connected) {
        unsubFollowUp = subscribeFollowUpOrders((records) => {
          setFollowUpRecords(records);
        });

        unsubOrders = subscribeUploadedOrdersFromFirestore((cloudOrders, fileName) => {
          if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
            setOrders((prev) => {
              // If local IndexedDB already holds a larger dataset from a 500MB file, keep the full dataset
              if (prev.length > cloudOrders.length) return prev;
              return cloudOrders;
            });
            if (fileName) setActiveFileName(fileName);
          }
        });

        unsubRetur = subscribeReturFromFirestore((cloudRetur) => {
          if (Array.isArray(cloudRetur) && cloudRetur.length > 0) {
            setReturRows((prev) => (prev.length > cloudRetur.length ? prev : cloudRetur));
          }
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

    initAppAndStorage();

    return () => {
      if (unsubFollowUp) unsubFollowUp();
      if (unsubOrders) unsubOrders();
      if (unsubRetur) unsubRetur();
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
      setErrorBanner(`Gagal sinkron Master PCP ke Firebase: ${err.message}`);
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

  // Load custom CSV file (supports 5MB - 800MB via 2MB streaming chunks, deletes old Firebase data & syncs new data)
  const handleFileUpload = async (file: File) => {
    setErrorBanner(null);
    setIsLoading(true);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setActiveFileName(`${file.name} (${sizeMb} MB)`);
    setParseProgress({
      loadedRows: 0,
      rawRowsRead: 0,
      bytesRead: 0,
      totalBytes: file.size,
      percent: 1,
      status: 'parsing'
    });

    try {
      const results = await parseCsvFile(
        file,
        dpsMaster,
        depoMaster,
        adminMode,
        (prog) => setParseProgress(prog),
        { mode: 'auto' }
      );

      if (results.length === 0) {
        throw new Error(
          'Tidak ditemukan baris order yang valid. Pastikan kolom CSV memiliki Tanggal / IDH #PO / Principal.'
        );
      }

      setOrders(results);
      setSelectedRowIds(new Set());
      setFilter((prev) => ({ ...prev, dateFilter: '' }));

      setParseProgress({
        loadedRows: results.length,
        percent: 10,
        status: 'syncing'
      });

      await syncAllOrdersToFirestore(results, `${file.name} (${sizeMb} MB)`, (synced, total) => {
        const pct = total > 0 ? Math.min(99, Math.round((synced / total) * 100)) : 100;
        setParseProgress({
          loadedRows: synced,
          percent: pct,
          status: 'syncing'
        });
      });

      const blankCount = results.filter((r) => r.isStatusBlank).length;
      showToast(
        `Sukses memproses file ${sizeMb} MB! ${results.length.toLocaleString(
          'id-ID'
        )} ORDERAN PO IDH (${blankCount.toLocaleString('id-ID')} Status OPEN) tersinkron ke sistem & Firebase.`
      );
    } catch (err: any) {
      console.error('CSV Upload Error:', err);
      setErrorBanner(`Gagal memproses file CSV (${file.name}): ${err.message || 'Format CSV tidak sesuai'}`);
    } finally {
      setIsLoading(false);
      setParseProgress(null);
    }
  };

  // Load sample data bundled in public/assets
  const handleLoadSample = async () => {
    setErrorBanner(null);
    setIsLoading(true);
    const sampleName = 'order-IDH.csv (Sampel Sistem)';
    setActiveFileName(sampleName);
    setParseProgress({ loadedRows: 0, percent: 5, status: 'parsing' });

    try {
      let sampleUrl = '/assets/sample-order-idh.csv';
      try {
        const checkLarge = await fetch('/assets/aistudio/order-IDH_01-20_10__7bfb880f.csv', { method: 'HEAD' });
        if (checkLarge.ok) {
          sampleUrl = '/assets/aistudio/order-IDH_01-20_10__7bfb880f.csv';
        }
      } catch (e) {
        // use default sample
      }

      const results = await parseCsvFile(
        sampleUrl,
        dpsMaster,
        depoMaster,
        adminMode,
        (prog) => setParseProgress(prog),
        { mode: 'auto' }
      );
      setOrders(results);
      setSelectedRowIds(new Set());
      setFilter((prev) => ({ ...prev, dateFilter: '' }));

      setParseProgress({
        loadedRows: results.length,
        percent: 15,
        status: 'syncing'
      });
      await syncAllOrdersToFirestore(results, sampleName, (synced, total) => {
        const pct = total > 0 ? Math.min(99, Math.round((synced / total) * 100)) : 100;
        setParseProgress({
          loadedRows: synced,
          percent: pct,
          status: 'syncing'
        });
      });

      const blankCount = results.filter((r) => r.isStatusBlank).length;
      showToast(
        `Berhasil memuat & sinkron ${results.length.toLocaleString(
          'id-ID'
        )} baris ke Firebase (${blankCount.toLocaleString('id-ID')} Status OPEN).`
      );
    } catch (err: any) {
      console.error(err);
      setErrorBanner(`Gagal memuat sampel CSV: ${err.message || 'File tidak ditemukan'}`);
    } finally {
      setIsLoading(false);
      setParseProgress(null);
    }
  };

  // Upload Retur & Tukar CSV file (supports 100MB - 500MB via streaming filter)
  const handleUploadReturCsv = async (file: File) => {
    setErrorBanner(null);
    setIsReturLoading(true);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setReturProgress({
      loadedRows: 0,
      rawRowsRead: 0,
      bytesRead: 0,
      totalBytes: file.size,
      percent: 2,
      status: 'parsing'
    });

    try {
      const parsed = await parseReturCsvFile(
        file,
        dpsMaster,
        depoMaster,
        adminMode,
        false,
        (prog) => setReturProgress(prog)
      );
      setReturRows(parsed);
      await syncAllReturToFirestore(parsed, `${file.name} (${sizeMb} MB)`);
      showToast(
        `Berhasil memproses CSV Retur (${sizeMb} MB): ditemukan ${parsed.length.toLocaleString(
          'id-ID'
        )} pengajuan Belum dikonfirmasi & tersinkron ke Firebase!`
      );
    } catch (err: any) {
      console.error('Retur CSV Upload Error:', err);
      setErrorBanner(`Gagal membaca CSV Retur (${file.name}): ${err.message || 'Format tidak sesuai'}`);
    } finally {
      setIsReturLoading(false);
      setReturProgress(null);
    }
  };

  // Reset / Upload New CSV File: delete old data from Firebase & IndexedDB and open upload screen
  const handleResetData = async () => {
    setErrorBanner(null);
    setActiveTab('transaksi');
    setOrders([]);
    setActiveFileName('');
    setSelectedRowIds(new Set());
    setParseProgress(null);

    try {
      await clearAllUploadedOrdersInFirestore();
      showToast('Data lama dihapus dari sistem & Firebase. Silakan upload file CSV baru.');
    } catch (e) {
      console.warn('Clear old Firestore orders error:', e);
    }
  };

  // Distinct lists for dropdowns
  const distinctDates = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      const d = orders[i].tglPoIdh;
      if (d && d !== '-') set.add(d);
    }
    return Array.from(set).sort();
  }, [orders]);

  const distinctPrincipals = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      const p = orders[i].principal;
      if (p && p !== '-') set.add(p);
    }
    return Array.from(set).sort();
  }, [orders]);

  const distinctTitikKirim = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      const tk = orders[i].titikKirim;
      if (tk) set.add(tk);
    }
    return Array.from(set).sort();
  }, [orders]);

  const distinctAdmins = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      const adm = orders[i].admint;
      if (adm && adm !== '-') set.add(adm);
    }
    return Array.from(set).sort();
  }, [orders]);

  // Filtered rows (including TGL PO filter)
  const filteredOrders = useMemo(() => {
    const query = filter.searchQuery.toLowerCase().trim();

    return orders.filter((row) => {
      if (filter.statusFilter === 'blank_only' && !row.isStatusBlank) return false;
      if (filter.statusFilter === 'confirmed' && row.statusProduk.toLowerCase() !== 'confirmed') return false;
      if (filter.statusFilter === 'canceled' && row.statusProduk.toLowerCase() !== 'canceled') return false;

      if (filter.dateFilter && row.tglPoIdh !== filter.dateFilter) return false;
      if (filter.principal && row.principal !== filter.principal) return false;
      if (filter.titikKirim && row.titikKirim !== filter.titikKirim) return false;
      if (filter.admint && row.admint !== filter.admint) return false;

      if (query) {
        const matchPo = (row.noPoIdh || '').toLowerCase().includes(query);
        const matchCust = (row.namaPelanggan || '').toLowerCase().includes(query);
        const matchProdOk = (row.prodOk || '').toLowerCase().includes(query);
        const matchPrinc = (row.principal || '').toLowerCase().includes(query);
        const matchTitik = (row.titikKirim || '').toLowerCase().includes(query);
        const matchAdmin = (row.admint || '').toLowerCase().includes(query);
        const matchTgl = (row.tglPoIdh || '').toLowerCase().includes(query);

        if (
          !matchPo &&
          !matchCust &&
          !matchProdOk &&
          !matchPrinc &&
          !matchTitik &&
          !matchAdmin &&
          !matchTgl
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
      const newSet = new Set(filteredOrders.map((r) => r.rowId));
      setSelectedRowIds(newSet);
    }
  };

  // WhatsApp Batch Copy (ALL filtered orders without 50 limit!)
  const handleBatchCopyWhatsApp = async () => {
    if (filteredOrders.length === 0) {
      setErrorBanner('Tidak ada data ORDERAN PO IDH yang tersedia untuk disalin.');
      return;
    }

    setPreviewModalState({
      isOpen: true,
      rows: filteredOrders,
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

  // Export processed data to clean CSV using chunked Blob (supports 100,000+ rows without memory error)
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      setErrorBanner('Tidak ada data yang dapat diekspor.');
      return;
    }

    try {
      const blob = buildLargeOrdersCsvBlob(filteredOrders);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Order_PO_IDH_${filter.dateFilter || 'Semua_Tgl'}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Berhasil export ${filteredOrders.length.toLocaleString('id-ID')} ORDERAN PO IDH ke CSV!`);
    } catch (err: any) {
      setErrorBanner(`Gagal mengekspor CSV: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#005b64] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-60 bg-[#005b64] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce border border-teal-400/40 max-w-md">
          <Check className="w-4 h-4 stroke-[3] text-teal-300 shrink-0" />
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
            if (tab === 'followup') {
              setIsFollowUpModalOpen(true);
            } else if (tab === 'master') {
              setIsMasterModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          followUpCount={followUpRecords.length}
          totalOrdersCount={orders.length}
          blankCount={orders.filter((r) => r.isStatusBlank).length}
          returCount={returRows.length}
          adminMode={adminMode}
          onChangeAdminMode={(mode) => {
            setAdminMode(mode);
          }}
          onOpenUpload={handleResetData}
          isFirebaseConnected={isFirebaseConnected}
        />

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {/* Dismissible Error Alert Banner */}
          {errorBanner && (
            <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="p-1 rounded hover:bg-rose-100 text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'retur' ? (
            <ReturTukarView
              returRows={returRows}
              isLoading={isReturLoading}
              returProgress={returProgress}
              onUploadReturCsv={handleUploadReturCsv}
              onReloadSampleRetur={() => loadSampleReturData(true)}
              onShowToast={showToast}
            />
          ) : orders.length === 0 ? (
            /* Upload Screen */
            <FileUpload
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              progress={parseProgress}
              isLoading={isLoading}
            />
          ) : (
            /* Active Transactions View */
            <div className="space-y-4">
              {/* Header Title Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Daftar Transaksi
                  </h2>
                  <p className="text-xs text-slate-500">
                    File Aktif:{' '}
                    <strong className="text-slate-800 font-medium">{activeFileName}</strong> •{' '}
                    <span className="text-emerald-700 font-semibold">
                      Tersinkron Penuh dengan Firebase &amp; IndexedDB ({orders.length.toLocaleString('id-ID')} ORDERAN PO IDH)
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all"
                    title="Hapus data lama dari Firebase dan upload file CSV baru"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload File CSV Baru</span>
                  </button>
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

              {/* Collapsible Filter / Export Bar with TGL PO Filter */}
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
                availableDates={distinctDates}
                filteredCount={filteredOrders.length}
                totalCount={orders.length}
                onBatchCopyWhatsApp={handleBatchCopyWhatsApp}
                onExportCsv={handleExportCsv}
                selectedRowsCount={selectedRowIds.size}
                onCopySelectedWhatsApp={handleCopySelectedWhatsApp}
              />

              {/* Processed Orders Table */}
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-2">
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
