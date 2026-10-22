import { MasterPcpEntry, MasterDepoEntry, ProcessedOrderRow, RawCsvRow, AdminResolutionMode } from '../types';

export function normalizePrincipalKey(str: string): string {
  if (!str) return '';
  return str
    .toUpperCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDateOnly(dateStr: string): string {
  if (!dateStr) return '-';
  const trimmed = dateStr.trim();
  // Handles format like "20-10-2026 23:09:21 WITA"
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx > 0) {
    return trimmed.substring(0, spaceIdx);
  }
  // Handles ISO format like "2026-10-20T..."
  const tIdx = trimmed.indexOf('T');
  if (tIdx > 0) {
    return trimmed.substring(0, tIdx);
  }
  return trimmed;
}

export function isStatusBlankOrEmpty(status: string | undefined): boolean {
  if (!status) return true;
  const s = status.trim().toLowerCase();
  if (s === '' || s === '-' || s === 'null' || s === 'undefined') return true;
  // If user says "belum terisi Confirmed atau Canceled, atau valid"
  // It is considered non-blank only if it is confirmed, canceled, or valid
  const standardStatuses = ['confirmed', 'canceled', 'cancelled', 'valid'];
  return !standardStatuses.includes(s);
}

export function buildLookupIndex(dpsList: MasterPcpEntry[], depoList: MasterDepoEntry[]) {
  const dpsMap = new Map<string, MasterPcpEntry>();
  for (const entry of dpsList) {
    const key = normalizePrincipalKey(entry.principal);
    dpsMap.set(key, entry);
  }

  const depoMap = new Map<string, MasterDepoEntry>();
  for (const entry of depoList) {
    const key = entry.titikKirim.toUpperCase().trim();
    depoMap.set(key, entry);
  }

  return {
    findDps: (principal: string): MasterPcpEntry | undefined => {
      const key = normalizePrincipalKey(principal);
      if (dpsMap.has(key)) return dpsMap.get(key);

      // Substring fallback
      for (const [entryKey, entry] of dpsMap.entries()) {
        if (entryKey.includes(key) || key.includes(entryKey)) {
          return entry;
        }
      }
      return undefined;
    },
    findDepo: (titikKirim: string): MasterDepoEntry | undefined => {
      const key = (titikKirim || '').toUpperCase().trim();
      return depoMap.get(key);
    }
  };
}

export function processOrderRow(
  raw: RawCsvRow,
  index: number,
  lookup: ReturnType<typeof buildLookupIndex>,
  adminMode: AdminResolutionMode = 'auto'
): ProcessedOrderRow {
  const principalRaw = (raw['Principal'] || '').trim();
  const titikKirimRaw = (raw['Titik Kirim'] || '').trim().toUpperCase();
  const statusProdukRaw = (raw['Status Produk'] || '').trim();
  const dateRaw = (raw['Tanggal'] || '').trim();
  const poRaw = (raw['IDH #PO'] || '').trim();
  const idDistributor = (raw['ID di distributor'] || '').trim();
  const idhId = (raw['IDH ID'] || '').trim();
  const namaPelanggan = (raw['Nama Pelanggan'] || '').trim();
  const hpPelanggan = (raw['HP Pelanggan'] || raw['HP Ter-Verifikasi'] || '').trim();
  const alamatPelanggan = (raw['Alamat Pelanggan'] || '').trim();
  const statusOrder = (raw['Status Order'] || '').trim();

  // Lookup DPS master
  const dpsMatch = lookup.findDps(principalRaw);
  const prodOk = dpsMatch?.prdOk || '-';
  const adminDps = dpsMatch?.admin || '-';

  // Lookup Depo master
  const depoMatch = lookup.findDepo(titikKirimRaw);
  const adminDepo = depoMatch?.admint || '-';

  // Determine Admint based on mode
  let admint = adminDps;
  if (adminMode === 'depo_first') {
    admint = adminDepo !== '-' ? adminDepo : adminDps;
  } else if (adminMode === 'dps_first') {
    admint = adminDps !== '-' ? adminDps : adminDepo;
  } else {
    // auto: If it's a known DEPO (SINGARAJA, NEGARA, KARANGASEM, KLUNGKUNG), use Depo Admint.
    // If DENPASAR or anything else, use DPS Admin.
    if (depoMatch && depoMatch.admint) {
      admint = depoMatch.admint;
    } else {
      admint = adminDps;
    }
  }

  // ID Pelanggan: Prefer ID di distributor, fallback to IDH ID
  const idPelanggan = idDistributor || idhId || '-';

  return {
    rowId: `${poRaw}_${index}`,
    tglPoIdh: extractDateOnly(dateRaw),
    tglPoOriginal: dateRaw,
    noPoIdh: poRaw,
    prodOk,
    principal: principalRaw || '-',
    idPelanggan,
    idhId,
    namaPelanggan: namaPelanggan || '-',
    hpPelanggan: hpPelanggan || '-',
    alamatPelanggan: alamatPelanggan || '-',
    titikKirim: titikKirimRaw || 'DENPASAR',
    admint: admint || '-',
    adminDps,
    adminDepo,
    statusProduk: statusProdukRaw,
    isStatusBlank: isStatusBlankOrEmpty(statusProdukRaw),
    statusOrder,
    namaBarang: raw['Nama Barang']?.trim(),
    kodeBarang: raw['Kode Barang']?.trim(),
    qty: raw['Qty']?.trim(),
    totalHarga: raw['Total']?.trim() || raw['Sub Total']?.trim(),
    salesman: raw['Nama Salesman']?.trim() || raw['Kode Salesman']?.trim(),
    catatan: raw['Catatan Order']?.trim()
  };
}
