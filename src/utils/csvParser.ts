import Papa from 'papaparse';
import { RawCsvRow, ProcessedOrderRow, MasterPcpEntry, MasterDepoEntry, AdminResolutionMode } from '../types';
import { buildLookupIndex, processOrderRow } from './lookup';

export interface ParseProgress {
  loadedRows: number;
  percent: number;
  status: 'idle' | 'parsing' | 'completed' | 'error';
  errorMessage?: string;
}

export function parseCsvFile(
  fileOrUrl: File | string,
  dpsMaster: MasterPcpEntry[],
  depoMaster: MasterDepoEntry[],
  adminMode: AdminResolutionMode = 'auto',
  onProgress?: (progress: ParseProgress) => void,
  maxRows?: number
): Promise<ProcessedOrderRow[]> {
  return new Promise((resolve, reject) => {
    const lookup = buildLookupIndex(dpsMaster, depoMaster);
    const results: ProcessedOrderRow[] = [];
    let rowIndex = 0;

    const onStep = (resultsChunk: Papa.ParseStepResult<RawCsvRow>, parser: Papa.Parser) => {
      const raw = resultsChunk.data;
      if (!raw) return;
      if (!raw['IDH #PO'] && !raw['Tanggal'] && !raw['Principal']) return;

      rowIndex++;
      results.push(processOrderRow(raw, rowIndex, lookup, adminMode));

      if (results.length % 200 === 0 && onProgress) {
        onProgress({
          loadedRows: results.length,
          percent: Math.min(99, Math.round((results.length / (maxRows || 120000)) * 100)),
          status: 'parsing'
        });
      }

      if (maxRows && results.length >= maxRows) {
        parser.abort();
      }
    };

    const onComplete = () => {
      if (onProgress) {
        onProgress({
          loadedRows: results.length,
          percent: 100,
          status: 'completed'
        });
      }
      resolve(results);
    };

    const onError = (err: Error) => {
      if (onProgress) {
        onProgress({
          loadedRows: results.length,
          percent: 0,
          status: 'error',
          errorMessage: err.message
        });
      }
      reject(err);
    };

    if (typeof fileOrUrl === 'string') {
      // URL download and parse
      Papa.parse<RawCsvRow>(fileOrUrl, {
        download: true,
        header: true,
        skipEmptyLines: 'greedy',
        step: onStep,
        complete: onComplete,
        error: onError
      });
    } else {
      // File object parse
      Papa.parse<RawCsvRow>(fileOrUrl, {
        header: true,
        skipEmptyLines: 'greedy',
        step: onStep,
        complete: onComplete,
        error: onError
      });
    }
  });
}
