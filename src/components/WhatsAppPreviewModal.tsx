import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageSquare, Send, Smartphone, Sparkles } from 'lucide-react';
import { ProcessedOrderRow } from '../types';
import {
  formatSingleRowForWhatsApp,
  formatMultipleRowsForWhatsApp,
  generateWhatsAppWebUrl,
  copyToClipboard
} from '../utils/whatsappFormatter';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: ProcessedOrderRow[];
  mode: 'single' | 'batch';
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  rows,
  mode
}) => {
  const [copied, setCopied] = useState(false);
  const [includeItemDetails, setIncludeItemDetails] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    setCopied(false);
  }, [rows, mode]);

  if (!isOpen || rows.length === 0) return null;

  const row = rows[0];

  const generatedText =
    mode === 'single'
      ? formatSingleRowForWhatsApp(row, {
          includeHeader: true,
          includeItemDetails,
          customNote
        })
      : formatMultipleRowsForWhatsApp(rows, {
          title: customTitle || undefined,
          includeItemDetails
        });

  const handleCopy = async () => {
    const success = await copyToClipboard(generatedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const phone = mode === 'single' ? row.hpPelanggan : '';
    const url = generateWhatsAppWebUrl(phone, generatedText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'single'
                  ? `Pratinjau Pesan WhatsApp PO #${row.noPoIdh}`
                  : `Pratinjau Salin Batch (${rows.length} Order)`}
              </h3>
              <p className="text-xs text-slate-400">
                Format WhatsApp Friendly siap paste di grup atau chat personal
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Settings / Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeItemDetails}
                onChange={(e) => setIncludeItemDetails(e.target.checked)}
                className="rounded bg-slate-700 border-slate-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Sertakan rincian produk (Barang / Qty)</span>
            </label>

            {mode === 'single' && (
              <div className="text-slate-400">
                Tujuan Kontak: <span className="text-white font-mono">{row.hpPelanggan || 'Sembarang'}</span>
              </div>
            )}
          </div>

          {/* Custom Note Input */}
          {mode === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tambahkan Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Mohon dikonfirmasi ketersediaan stok secepatnya..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Judul Pesan Kustom (Opsional):
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`Daftar Order IDH (${rows.length} Baris Perlu Konfirmasi)`}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* WhatsApp Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Tampilan di WhatsApp:
              </span>
              <span className="text-[11px] text-slate-500">
                {generatedText.split('\n').length} baris • {generatedText.length} karakter
              </span>
            </div>

            <div className="bg-[#0b141a] border border-[#202c33] rounded-xl p-4 font-mono text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed shadow-inner max-h-[300px] overflow-y-auto selection:bg-emerald-600 selection:text-white">
              {generatedText}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Chat WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-slate-950 text-xs font-bold shadow-md transition-all"
              title="Buka WhatsApp Web atau WhatsApp Desktop langsung"
            >
              <Send className="w-4 h-4" />
              <span>Buka di WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
