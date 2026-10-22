import React, { useState } from 'react';
import { X, Search, Plus, RotateCcw, Image, Save, Check, ShieldCheck, MapPin } from 'lucide-react';
import { MasterPcpEntry, MasterDepoEntry } from '../types';

interface MasterPcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dpsList: MasterPcpEntry[];
  depoList: MasterDepoEntry[];
  onSaveDpsList: (newList: MasterPcpEntry[]) => void;
  onSaveDepoList: (newList: MasterDepoEntry[]) => void;
  onResetMaster: () => void;
  onSyncToFirestore?: () => void;
}

export const MasterPcpModal: React.FC<MasterPcpModalProps> = ({
  isOpen,
  onClose,
  dpsList,
  depoList,
  onSaveDpsList,
  onSaveDepoList,
  onResetMaster,
  onSyncToFirestore
}) => {
  const [activeTab, setActiveTab] = useState<'dps' | 'depo' | 'image'>('dps');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newPrdOk, setNewPrdOk] = useState('');
  const [newDivisi, setNewDivisi] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [newNd, setNewNd] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  if (!isOpen) return null;

  const filteredDps = dpsList.filter(
    (item) =>
      item.principal.toLowerCase().includes(search.toLowerCase()) ||
      item.prdOk.toLowerCase().includes(search.toLowerCase()) ||
      item.admin.toLowerCase().includes(search.toLowerCase()) ||
      (item.divisi && item.divisi.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrincipal.trim() || !newPrdOk.trim()) {
      alert('Nama Principal dan Prod Ok wajib diisi');
      return;
    }

    const newItem: MasterPcpEntry = {
      id: Date.now().toString(),
      principal: newPrincipal.trim(),
      prdOk: newPrdOk.trim(),
      divisi: newDivisi.trim() || undefined,
      admin: newAdmin.trim() || '-',
      nd: newNd.trim() || undefined
    };

    const updated = [newItem, ...dpsList];
    onSaveDpsList(updated);
    setNewPrincipal('');
    setNewPrdOk('');
    setNewDivisi('');
    setNewAdmin('');
    setNewNd('');
    setShowAddModal(false);
    setSaveSuccessMessage('Principal baru berhasil ditambahkan!');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Hapus pemetaan principal ini dari Master PCP?')) {
      const updated = dpsList.filter((item) => item.id !== id);
      onSaveDpsList(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Data Rujukan Master PCP & DEPO IDH</span>
            </h3>
            <p className="text-xs text-slate-400">
              Daftar pencocokan Principal ke Prod Ok & ADMINT sesuai master resmi IDH
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection & Search */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dps')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'dps'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Master DPS ({dpsList.length} Principal)
            </button>
            <button
              onClick={() => setActiveTab('depo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'depo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Master DEPO ({depoList.length} Titik Kirim)
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'image'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Foto Screenshot Asli</span>
            </button>
          </div>

          {activeTab === 'dps' && (
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Principal, Prod Ok, Admin..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {saveSuccessMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {activeTab === 'dps' && (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
                <thead className="bg-slate-950/70 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Principal (PCP)</th>
                    <th className="py-2.5 px-3">Prod_Ok</th>
                    <th className="py-2.5 px-3">Divisi</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">ND</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredDps.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">{item.principal}</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-mono font-medium">{item.prdOk}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.divisi || '-'}</td>
                      <td className="py-2.5 px-3 text-indigo-300 font-medium">{item.admin}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{item.nd || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                          title="Hapus pemetaan"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'depo' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-950/30 border border-teal-500/20 rounded-xl text-xs text-teal-300">
                Data master DEPO digunakan untuk pesanan dengan Titik Kirim di luar Denpasar (Singaraja, Negara, Karangasem, Klungkung).
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
                  <thead className="bg-slate-950/70 text-[11px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Titik Kirim (DEPO)</th>
                      <th className="py-3 px-4">Kode AREA</th>
                      <th className="py-3 px-4">ADMINT Bertugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {depoList.map((depo) => (
                      <tr key={depo.titikKirim} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-400" />
                          <span>{depo.titikKirim}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{depo.area}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-300">{depo.admint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-3 text-center">
              <p className="text-xs text-slate-400">
                Gambar referensi master asli dari dokumen: <code className="text-emerald-400">master_pcp_IDH.png</code>
              </p>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-[500px] overflow-y-auto">
                <img
                  src="/assets/aistudio/master_pcp_IDH_95e446b1.png"
                  alt="Master PCP IDH Reference Screenshot"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Kembalikan seluruh data master PCP ke pengaturan bawaan dokumen?')) {
                  onResetMaster();
                  setSaveSuccessMessage('Data master berhasil dikembalikan ke bawaan.');
                  setTimeout(() => setSaveSuccessMessage(''), 3000);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Master Bawaan</span>
            </button>

            {onSyncToFirestore && (
              <button
                onClick={onSyncToFirestore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 text-xs text-amber-300 font-semibold transition-all"
                title="Sinkronkan data Master PCP ke Cloud Firestore CekOrderIDHLookup"
              >
                <span>🔥 Simpan ke Firebase</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>

      {/* Mini Modal Add Principal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleAddNew}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <h4 className="text-sm font-bold text-white">Tambah Data Principal Baru</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Principal:*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. ABC MAKMUR"
                  value={newPrincipal}
                  onChange={(e) => setNewPrincipal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Prod_Ok:*</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ABC"
                  value={newPrdOk}
                  onChange={(e) => setNewPrdOk(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Admin (DPS):</label>
                <input
                  type="text"
                  placeholder="Contoh: Ratna & Teguh"
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Divisi:</label>
                <input
                  type="text"
                  placeholder="Contoh: Local 1 / Farmasi"
                  value={newDivisi}
                  onChange={(e) => setNewDivisi(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">ND:</label>
                <input
                  type="text"
                  placeholder="Contoh: DSD / DPI / PLZ"
                  value={newNd}
                  onChange={(e) => setNewNd(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
