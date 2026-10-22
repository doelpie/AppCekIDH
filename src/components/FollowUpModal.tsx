import React, { useState } from 'react';
import { X, Trash2, CheckCircle, Clock, Send, MessageSquare, AlertCircle, Edit3, ExternalLink } from 'lucide-react';
import { FollowUpRecord, updateFollowUpStatus, deleteFollowUpOrder } from '../services/firestoreService';
import { generateWhatsAppWebUrl, copyToClipboard } from '../utils/whatsappFormatter';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: FollowUpRecord[];
  onShowToast: (msg: string) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  records,
  onShowToast
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.followUpStatus === filterStatus;
  });

  const handleStatusChange = async (
    id: string,
    newStatus: 'pending' | 'wa_sent' | 'confirmed' | 'canceled'
  ) => {
    await updateFollowUpStatus(id, newStatus);
    onShowToast(`Status diperbarui ke ${newStatus}`);
  };

  const handleSaveNote = async (id: string) => {
    await updateFollowUpStatus(id, records.find((r) => r.id === id)?.followUpStatus || 'wa_sent', editNote);
    setEditingId(null);
    onShowToast('Catatan berhasil diperbarui');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus order ini dari daftar tindak lanjut Firebase?')) {
      await deleteFollowUpOrder(id);
      onShowToast('Data dihapus dari Firebase');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Riwayat Tindak Lanjut Order (Firebase)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CekOrderIDHLookup
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Data pesanan blank yang telah dikonfirmasi atau dihubungi via WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl font-semibold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({records.length})
            </button>
            <button
              onClick={() => setFilterStatus('wa_sent')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'wa_sent' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>WA Terkirim</span>
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'confirmed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              <span>Terkonfirmasi</span>
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </button>
          </div>

          <span className="text-slate-400">
            Tersimpan secara realtime di Cloud Firestore
          </span>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-500" />
              <p className="font-semibold text-white">Belum ada catatan tindak lanjut</p>
              <p className="text-xs text-slate-500">
                Gunakan tombol &quot;Simpan ke Firebase&quot; atau &quot;Tandai WA Terkirim&quot; pada tabel data.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-600 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">#{item.noPoIdh}</span>
                    <span className="text-slate-400 text-xs">({item.tglPoIdh})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {item.prodOk}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                      {item.titikKirim}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      Admin: {item.admint}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <strong className="text-white">{item.namaPelanggan}</strong> ({item.idPelanggan}) • Telp:{' '}
                    <span className="font-mono text-emerald-400">{item.hpPelanggan}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{item.alamatPelanggan}</p>

                  {/* Catatan Tindak Lanjut */}
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Tulis catatan respon pelanggan..."
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <span className="text-slate-400 italic">
                        Catatan: {item.catatan || 'Belum ada catatan'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditNote(item.catatan || '');
                        }}
                        className="text-slate-500 hover:text-slate-300"
                        title="Edit catatan"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={item.followUpStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          item.id,
                          e.target.value as 'pending' | 'wa_sent' | 'confirmed' | 'canceled'
                        )
                      }
                      className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-white font-semibold"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="wa_sent">💬 WA Terkirim</option>
                      <option value="confirmed">✅ Terkonfirmasi</option>
                      <option value="canceled">❌ Dibatalkan</option>
                    </select>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60"
                      title="Hapus dari Firebase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500">
                    Update: {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString('id-ID') : '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total {filtered.length} order tersimpan di Firestore
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
