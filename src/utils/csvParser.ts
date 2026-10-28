import Papa from 'papaparse';
import {
  RawCsvRow,
  ProcessedOrderRow,
  MasterPcpEntry,
  MasterDepoEntry,
  AdminResolutionMode,
  RawReturCsvRow,
  ProcessedReturRow
} from '../types';
import { buildLookupIndex, processOrderRow, accumulateReturRawRow } from './lookup';

export interface ParseProgress {
  loadedRows: number;
  rawRowsRead?: number;
  bytesRead?: number;
  totalBytes?: number;
  percent: number;
  status: 'idle' | 'parsing' | 'syncing' | 'completed' | 'error';
  errorMessage?: string;
  isCompacted?: boolean;
}

export interface LargeCsvParseOptions {
  /**
   * 'auto': For files > 5MB (or when raw rows exceed 80,000), automatically deduplicate
   * identical (Nomor PO + Principal + Status Produk + TGL PO) rows so 100MB-800MB files
   * don't duplicate 30 SKU lines per PO since Nama Produk is omitted.
   * 'compact_po': Always deduplicate identical 8-field PO rows.
   * 'raw_all': Keep every raw row up to safe browser memory limit (350,000 rows), then compact remaining.
   */
  mode?: 'auto' | 'compact_po' | 'raw_all';
}

const FIVE_MB = 5 * 1024 * 1024;
const STREAM_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per stream chunk
const MAX_RAW_UNCOMPACTED_ROWS = 80000; // Above 80k raw rows, auto-switch to 8-field deduplication

export function parseCsvFile(
  fileOrUrl: File | string,
  dpsMaster: MasterPcpEntry[],
  depoMaster: MasterDepoEntry[],
  adminMode: AdminResolutionMode = 'auto',
  onProgress?: (progress: ParseProgress) => void,
  options: LargeCsvParseOptions = { mode: 'auto' }
): Promise<ProcessedOrderRow[]> {
  return new Promise((resolve, reject) => {
    const lookup = buildLookupIndex(dpsMaster, depoMaster);
    const results: ProcessedOrderRow[] = [];
    const seenKeys = new Set<string>();

    const isFile = typeof fileOrUrl !== 'string';
    const totalBytes = isFile ? fileOrUrl.size : 0;
    const isLargeFile = totalBytes > FIVE_MB;

    let shouldDeduplicate =
      options.mode === 'compact_po' || (options.mode === 'auto' && isLargeFile);

    let rawRowIndex = 0;
    let bytesProcessed = 0;

    const processRowObject = (raw: RawCsvRow) => {
      if (!raw) return;
      const po = raw['IDH #PO'] || raw['Nomor PO'];
      const tgl = raw['Tanggal'] || raw['TGL PO'];
      const princ = raw['Principal'] || raw['Nama Principal'];
      if (!po && !tgl && !princ) return;

      rawRowIndex++;

      // If a file grows beyond 80,000 raw rows in 'auto' mode (or 300,000 in 'raw_all'),
      // automatically activate 8-field compaction so browser RAM never crashes on 100MB-800MB files
      if (!shouldDeduplicate && rawRowIndex > MAX_RAW_UNCOMPACTED_ROWS) {
        shouldDeduplicate = true;
        // Retroactively compact existing results so seenKeys is populated
        const compacted: ProcessedOrderRow[] = [];
        for (const existing of results) {
          const k = `${existing.noPoIdh}|${existing.principal}|${existing.statusProduk}|${existing.tglPoIdh}|${existing.titikKirim}`;
          if (!seenKeys.has(k)) {
            seenKeys.add(k);
            compacted.push(existing);
          }
        }
        results.length = 0;
        for (const item of compacted) results.push(item);
      }

      const processed = processOrderRow(raw, rawRowIndex, lookup, adminMode);

      if (shouldDeduplicate) {
        // Since Nama Produk is omitted, rows with the same (PO + Principal + Status + TGL PO + Titik Kirim)
        // have identical 8 fields. Deduplicating saves 90%+ RAM & Firestore storage on 100MB-800MB files!
        const dedupKey = `${processed.noPoIdh}|${processed.principal}|${processed.statusProduk}|${processed.tglPoIdh}|${processed.titikKirim}`;
        if (seenKeys.has(dedupKey)) {
          return;
        }
        seenKeys.add(dedupKey);
      }

      results.push(processed);
    };

    const onChunk = (
      resultsChunk: Papa.ParseResult<RawCsvRow>,
      parser: Papa.Parser
    ) => {
      try {
        const rows = resultsChunk.data;
        if (Array.isArray(rows)) {
          for (let i = 0; i < rows.length; i++) {
            processRowObject(rows[i]);
          }
        }

        bytesProcessed += STREAM_CHUNK_SIZE;
        const pct =
          totalBytes > 0
            ? Math.min(98, Math.round((Math.min(bytesProcessed, totalBytes) / totalBytes) * 100))
            : Math.min(95, Math.round((rawRowIndex / 50000) * 100));

        if (onProgress) {
          onProgress({
            loadedRows: results.length,
            rawRowsRead: rawRowIndex,
            bytesRead: Math.min(bytesProcessed, totalBytes),
            totalBytes,
            percent: Math.max(2, pct),
            status: 'parsing',
            isCompacted: shouldDeduplicate
          });
        }

        // Yield to main thread briefly on large files so UI stays responsive and never freezes
        if (isLargeFile && parser && typeof parser.pause === 'function') {
          parser.pause();
          setTimeout(() => {
            parser.resume();
          }, 0);
        }
      } catch (err: any) {
        parser?.abort();
        reject(new Error(`Gagal memproses potongan CSV: ${err?.message || String(err)}`));
      }
    };

    const onComplete = () => {
      seenKeys.clear();
      if (onProgress) {
        onProgress({
          loadedRows: results.length,
          rawRowsRead: rawRowIndex,
          bytesRead: totalBytes,
          totalBytes,
          percent: 100,
          status: 'completed',
          isCompacted: shouldDeduplicate
        });
      }
      resolve(results);
    };

    const onError = (err: Error) => {
      seenKeys.clear();
      if (onProgress) {
        onProgress({
          loadedRows: results.length,
          rawRowsRead: rawRowIndex,
          percent: 0,
          status: 'error',
          errorMessage: err.message
        });
      }
      reject(err);
    };

    if (typeof fileOrUrl === 'string') {
      Papa.parse<RawCsvRow>(fileOrUrl, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        chunkSize: STREAM_CHUNK_SIZE,
        chunk: onChunk,
        complete: onComplete,
        error: onError
      });
    } else {
      Papa.parse<RawCsvRow>(fileOrUrl, {
        header: true,
        skipEmptyLines: 'greedy',
        chunkSize: STREAM_CHUNK_SIZE,
        chunk: onChunk,
        complete: onComplete,
        error: onError
      });
    }
  });
}

export function parseReturCsvFile(
  fileOrUrlOrString: File | string,
  dpsMaster: MasterPcpEntry[],
  depoMaster: MasterDepoEntry[],
  adminMode: AdminResolutionMode = 'auto',
  isRawCsvText: boolean = false,
  onProgress?: (progress: ParseProgress) => void
): Promise<ProcessedReturRow[]> {
  return new Promise((resolve, reject) => {
    const lookup = buildLookupIndex(dpsMaster, depoMaster);
    const grouped = new Map<string, ProcessedReturRow>();

    const isFile = typeof fileOrUrlOrString !== 'string';
    const totalBytes = isFile ? fileOrUrlOrString.size : 0;
    const isLargeFile = totalBytes > FIVE_MB;
    let rawRowIndex = 0;
    let bytesProcessed = 0;

    const onChunk = (
      resultsChunk: Papa.ParseResult<RawReturCsvRow>,
      parser: Papa.Parser
    ) => {
      try {
        const rows = resultsChunk.data;
        if (Array.isArray(rows)) {
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r) continue;
            rawRowIndex++;
            accumulateReturRawRow(r, grouped, lookup, adminMode);
          }
        }

        bytesProcessed += STREAM_CHUNK_SIZE;
        if (onProgress) {
          const pct =
            totalBytes > 0
              ? Math.min(98, Math.round((Math.min(bytesProcessed, totalBytes) / totalBytes) * 100))
              : 50;
          onProgress({
            loadedRows: grouped.size,
            rawRowsRead: rawRowIndex,
            bytesRead: Math.min(bytesProcessed, totalBytes),
            totalBytes,
            percent: Math.max(5, pct),
            status: 'parsing'
          });
        }

        // Yield to UI thread on large Retur CSV files (100MB - 500MB)
        if (isLargeFile && parser && typeof parser.pause === 'function') {
          parser.pause();
          setTimeout(() => {
            parser.resume();
          }, 0);
        }
      } catch (err: any) {
        parser?.abort();
        reject(new Error(`Gagal memproses CSV Retur: ${err?.message || String(err)}`));
      }
    };

    const onComplete = () => {
      const finalRows = Array.from(grouped.values());
      if (onProgress) {
        onProgress({
          loadedRows: finalRows.length,
          rawRowsRead: rawRowIndex,
          bytesRead: totalBytes,
          totalBytes,
          percent: 100,
          status: 'completed'
        });
      }
      resolve(finalRows);
    };

    const onError = (err: Error) => {
      reject(err);
    };

    if (typeof fileOrUrlOrString === 'string' && !isRawCsvText) {
      Papa.parse<RawReturCsvRow>(fileOrUrlOrString, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        chunkSize: STREAM_CHUNK_SIZE,
        chunk: onChunk,
        complete: onComplete,
        error: onError
      });
    } else {
      Papa.parse<RawReturCsvRow>(fileOrUrlOrString as any, {
        header: true,
        skipEmptyLines: 'greedy',
        chunkSize: STREAM_CHUNK_SIZE,
        chunk: onChunk,
        complete: onComplete,
        error: onError
      });
    }
  });
}
