import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Zap, Info, Database, Cpu } from 'lucide-react';
import { ParseProgress } from '../utils/csvParser';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  progress: ParseProgress | null;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onLoadSample,
  progress,
  isLoading
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
        onFileUpload(file);
      } else {
        alert('Mohon pilih file berekstensi .csv');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const formatMb = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#005b64] to-[#00474f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold backdrop-blur-xs">
              <CheckCircle className="w-3.5 h-3.5" /> IDH Distribution &amp; Logistics Hub • Delta Bali
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Upload Penuh Order IDH (Hingga 800 MB+)
            </h2>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              Mendukung file CSV harian maupun gabungan closing bulanan (<strong className="text-amber-300">5 MB – 100 MB – 800 MB</strong>) dengan teknologi <strong className="text-white">Chunked Streaming 2MB &amp; Kompresi 8-Kolom</strong>.
              Hanya memproses <strong className="text-white">TGL PO (tanpa jam), Nomor PO, Nama Outlet, ProdOk, Nama Principal, Titik Kirim, Nama Admint, dan Status Produk (OPEN)</strong> tanpa nama produk sehingga ringan di sistem dan database Firebase.
            </p>
          </div>

          {/* Quick Action Button in IDH Orange */}
          <div className="flex flex-col gap-2 shrink-0 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-xs">
            <span className="text-xs font-semibold text-teal-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300" /> Cepat Mulai (Sampel Sistem):
            </span>
            <button
              onClick={() => onLoadSample()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#f39c12] hover:bg-[#e67e22] active:scale-95 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileText className="w-4 h-4" />
              <span>Muat Semua Sampel order-IDH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-teal-200 text-center">
              Otomatis tersinkron penuh ke Firebase
            </span>
          </div>
        </div>

        {/* Info Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-teal-100">
          <div className="flex flex-wrap items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-300" />
            <span className="font-semibold text-white">Engine Anti-Hang (File Besar 100–800 MB):</span>
            <span className="px-2.5 py-0.5 rounded bg-[#f39c12] text-white font-bold">
              Stream 2MB/Chunk + Hybrid IndexedDB &amp; Cloud Firestore
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-teal-200">
            <Info className="w-3.5 h-3.5 text-amber-300" />
            <span>Master PCP aktif: 87 Principal DPS &amp; 4 DEPO</span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group bg-white shadow-xs ${
          isLoading
            ? 'opacity-60 pointer-events-none border-slate-200'
            : isDragOver
            ? 'border-[#005b64] bg-teal-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-[#005b64] hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#005b64] group-hover:scale-105 group-hover:bg-teal-100 transition-all">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-slate-800">
              Tarik &amp; Letakkan file CSV baru di sini, atau <span className="text-[#005b64] underline">Pilih File CSV</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Mendukung file CSV standar maupun file besar closingan 1–6 bulan (5 MB s/d 800 MB). Data lama di Firebase otomatis dihapus &amp; diganti data baru.
            </p>
          </div>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && progress && (
        <div className="mt-6 bg-white border border-teal-300 rounded-xl p-5 shadow-md space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#005b64] animate-pulse" />
              <span className="text-sm font-bold text-slate-800">
                {progress.status === 'syncing'
                  ? 'Menghapus data lama & menyinkronkan kompresi ke Firebase...'
                  : 'Streaming potongan CSV & Lookup Master PCP (Tanpa Nama Produk)...'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#005b64]">
              {progress.percent}% • {progress.loadedRows.toLocaleString('id-ID')} ORDERAN PO IDH
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#005b64] to-[#f39c12] h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              {progress.rawRowsRead
                ? `Baris CSV dibaca: ${progress.rawRowsRead.toLocaleString('id-ID')} baris`
                : 'Memproses baris CSV...'}
              {progress.totalBytes && progress.totalBytes > 0
                ? ` (${formatMb(progress.bytesRead)} / ${formatMb(progress.totalBytes)})`
                : ''}
            </span>
            {progress.isCompacted && (
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3" /> Kompresi Cerdas 8-Kolom Aktif (Hemat Memori &amp; Database)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
