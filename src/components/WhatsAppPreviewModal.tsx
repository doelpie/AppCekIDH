import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, MessageSquare, Send, Smartphone } from 'lucide-react';
import { ProcessedOrderRow } from '../types';
import {
  formatSingleRowForWhatsApp,
  formatMultipleRowsForWhatsApp,
  getUniquePoRows,
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
  const [isCopying, setIsCopying] = useState(false);
  const [deduplicatePo, setDeduplicatePo] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    setCopied(false);
  }, [rows, mode]);

  const effectiveCount = useMemo(() => {
    if (!isOpen || rows.length === 0) return 0;
    if (mode === 'single') return 1;
    return deduplicatePo ? getUniquePoRows(rows).length : rows.length;
  }, [isOpen, rows, mode, deduplicatePo]);

  // Render at most 150 items in the visual preview box so DOM never freezes on 50,000+ rows
  const previewText = useMemo(() => {
    if (!isOpen || rows.length === 0) return '';
    if (mode === 'single') {
      return formatSingleRowForWhatsApp(rows[0], {
        includeHeader: true,
        customNote
      });
    }
    return formatMultipleRowsForWhatsApp(rows, {
      title: customTitle || undefined,
      deduplicateByPo: deduplicatePo,
      maxPreviewItems: 150
    });
  }, [isOpen, rows, mode, customNote, customTitle, deduplicatePo]);

  if (!isOpen || rows.length === 0) return null;

  const row = rows[0];

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const fullText =
        mode === 'single'
          ? formatSingleRowForWhatsApp(row, {
              includeHeader: true,
              customNote
            })
          : formatMultipleRowsForWhatsApp(rows, {
              title: customTitle || undefined,
              deduplicateByPo: deduplicatePo
            });

      const success = await copyToClipboard(fullText);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    const fullText =
      mode === 'single'
        ? formatSingleRowForWhatsApp(row, {
            includeHeader: true,
            customNote
          })
        : formatMultipleRowsForWhatsApp(rows, {
            title: customTitle || undefined,
            deduplicateByPo: deduplicatePo
          });

    // Always copy full text to clipboard first so user has 100% of rows even if URL is long
    await copyToClipboard(fullText);
    const url = generateWhatsAppWebUrl('', fullText);
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
                  : `Pratinjau Share WA (${effectiveCount.toLocaleString('id-ID')} ORDERAN PO IDH)`}
              </h3>
              <p className="text-xs text-slate-400">
                Hanya menampilkan TGL PO (tanpa jam), Nomor PO, Nama Outlet, ProdOk, Principal, Titik Kirim, Nama Admint &amp; Status Produk
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
          {mode === 'batch' && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={deduplicatePo}
                  onChange={(e) => setDeduplicatePo(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Gabungkan Nomor PO yang sama (1 Nomor PO = 1 entri)</span>
              </label>
              <span className="text-emerald-400 font-semibold">
                Semua {effectiveCount.toLocaleString('id-ID')} ORDERAN PO IDH siap di-share
              </span>
            </div>
          )}

          {/* Custom Note / Title Input */}
          {mode === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tambahkan Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Mohon segera ditindaklanjuti..."
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
                placeholder={`DAFTAR ORDER IDH (${effectiveCount} ORDERAN PO IDH PERLU TINDAKAN)`}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* WhatsApp Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Tampilan Format Chat WhatsApp:
              </span>
              <span className="text-[11px] text-slate-500">
                Total: {effectiveCount.toLocaleString('id-ID')} ORDERAN PO IDH
              </span>
            </div>

            <div className="bg-[#0b141a] border border-[#202c33] rounded-xl p-4 font-mono text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed shadow-inner max-h-[320px] overflow-y-auto selection:bg-emerald-600 selection:text-white">
              {previewText}
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
              disabled={isCopying}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Tersalin {effectiveCount.toLocaleString('id-ID')} PO ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    {isCopying
                      ? 'Menyalin...'
                      : `Salin Semua Chat WA (${effectiveCount.toLocaleString('id-ID')})`}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-slate-950 text-xs font-bold shadow-md transition-all"
              title="Salin seluruh pesan & buka WhatsApp"
            >
              <Send className="w-4 h-4" />
              <span>Share ke WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
