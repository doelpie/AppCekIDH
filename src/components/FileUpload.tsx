import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Zap, Info, Layers } from 'lucide-react';
import { ParseProgress } from '../utils/csvParser';

interface FileUploadProps {
  onFileUpload: (file: File, maxRows?: number) => void;
  onLoadSample: (maxRows?: number) => void;
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
  const [selectedLimit, setSelectedLimit] = useState<number | undefined>(10000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
        onFileUpload(file, selectedLimit);
      } else {
        alert('Mohon pilih file berekstensi .csv');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0], selectedLimit);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#005b64] to-[#00474f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold backdrop-blur-xs">
              <CheckCircle className="w-3.5 h-3.5" /> IDH Distribution & Logistics Hub • Delta Bali
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Proses Order IDH & Lookup Master PCP
            </h2>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              Upload file export <code className="text-amber-300 font-mono bg-black/20 px-1.5 py-0.5 rounded text-xs">order-IDH.csv</code>.
              Sistem akan mencocokkan kolom <strong className="text-white">Principal</strong> dengan Master PCP IDH untuk menarik
              data <strong className="text-amber-300">Prod Ok</strong> dan <strong className="text-amber-300">ADMINT</strong> (DPS & Depo),
              serta menyaring <strong className="text-amber-300">Status Produk Blank</strong> dengan format chat WhatsApp siap kirim.
            </p>
          </div>

          {/* Quick Action Button in IDH Orange */}
          <div className="flex flex-col gap-2 shrink-0 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-xs">
            <span className="text-xs font-semibold text-teal-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300" /> Cepat Mulai (Sampel Sistem):
            </span>
            <button
              onClick={() => onLoadSample(selectedLimit)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#f39c12] hover:bg-[#e67e22] active:scale-95 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileText className="w-4 h-4" />
              <span>Muat Sampel order-IDH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-teal-200 text-center">
              Menggunakan data asli Oktober 2026
            </span>
          </div>
        </div>

        {/* Limit Selector */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-teal-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-200" />
            <span className="font-semibold text-white">Batas Baris yang Dimuat:</span>
            <div className="inline-flex rounded-lg bg-black/20 p-0.5 border border-white/15">
              <button
                type="button"
                onClick={() => setSelectedLimit(5000)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  selectedLimit === 5000 ? 'bg-[#f39c12] text-white font-bold' : 'text-teal-200 hover:text-white'
                }`}
              >
                5.000 Baris (Kilat)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLimit(15000)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  selectedLimit === 15000 ? 'bg-[#f39c12] text-white font-bold' : 'text-teal-200 hover:text-white'
                }`}
              >
                15.000 Baris (Rekomendasi)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLimit(undefined)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  selectedLimit === undefined ? 'bg-[#f39c12] text-white font-bold' : 'text-teal-200 hover:text-white'
                }`}
              >
                Semua Baris (122k+)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-teal-200">
            <Info className="w-3.5 h-3.5 text-amber-300" />
            <span>Master PCP aktif: 87 Principal DPS & 4 DEPO</span>
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
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group bg-white shadow-xs ${
          isDragOver
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
              Tarik & Letakkan file CSV di sini, atau <span className="text-[#005b64] underline">Pilih File</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Format: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">order-IDH_*.csv</code>
            </p>
          </div>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isLoading && progress && (
        <div className="mt-6 bg-white border border-teal-300 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#005b64] animate-pulse" />
              <span className="text-sm font-bold text-slate-800">
                Memproses & Melakukan Lookup Master PCP...
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#005b64]">
              {progress.percent}% ({progress.loadedRows.toLocaleString('id-ID')} baris)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#005b64] to-[#f39c12] h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
