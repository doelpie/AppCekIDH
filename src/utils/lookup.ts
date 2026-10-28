import {
  MasterPcpEntry,
  MasterDepoEntry,
  ProcessedOrderRow,
  RawCsvRow,
  AdminResolutionMode,
  RawReturCsvRow,
  ProcessedReturRow
} from '../types';

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
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx > 0) {
    return trimmed.substring(0, spaceIdx);
  }
  const tIdx = trimmed.indexOf('T');
  if (tIdx > 0) {
    return trimmed.substring(0, tIdx);
  }
  return trimmed;
}

export function isStatusBlankOrEmpty(status: string | undefined): boolean {
  if (!status) return true;
  const s = status.trim().toLowerCase();
  if (s === '' || s === '-' || s === 'null' || s === 'undefined' || s === 'open' || s === 'blank') {
    return true;
  }
  const standardStatuses = ['confirmed', 'canceled', 'cancelled', 'valid'];
  return !standardStatuses.includes(s);
}

export function buildLookupIndex(dpsList: MasterPcpEntry[], depoList: MasterDepoEntry[]) {
  const dpsMap = new Map<string, MasterPcpEntry>();
  for (const entry of dpsList) {
    const key = normalizePrincipalKey(entry.principal);
    dpsMap.set(key, entry);
  }

  // Memoization cache so millions of CSV rows resolve Principal in O(1) time
  const dpsMemo = new Map<string, MasterPcpEntry | undefined>();

  const depoMap = new Map<string, MasterDepoEntry>();
  for (const entry of depoList) {
    const key = entry.titikKirim.toUpperCase().trim();
    depoMap.set(key, entry);
  }

  return {
    findDps: (principal: string): MasterPcpEntry | undefined => {
      if (!principal) return undefined;
      if (dpsMemo.has(principal)) return dpsMemo.get(principal);

      const key = normalizePrincipalKey(principal);
      if (!key) {
        dpsMemo.set(principal, undefined);
        return undefined;
      }
      if (dpsMap.has(key)) {
        const exact = dpsMap.get(key);
        dpsMemo.set(principal, exact);
        return exact;
      }

      for (const [entryKey, entry] of dpsMap.entries()) {
        if (entryKey && (entryKey.includes(key) || key.includes(entryKey))) {
          dpsMemo.set(principal, entry);
          return entry;
        }
      }
      dpsMemo.set(principal, undefined);
      return undefined;
    },
    findDepo: (titikKirim: string): MasterDepoEntry | undefined => {
      const key = (titikKirim || '').toUpperCase().trim();
      return depoMap.get(key);
    }
  };
}

export function resolveTitikKirimFromKota(kotaKab: string): string {
  const k = (kotaKab || '').toUpperCase();
  if (k.includes('BULELENG') || k.includes('SINGARAJA')) return 'SINGARAJA';
  if (k.includes('JEMBRANA') || k.includes('NEGARA')) return 'NEGARA';
  if (k.includes('KARANG ASEM') || k.includes('KARANGASEM') || k.includes('AMLAPURA')) return 'KARANGASEM';
  if (k.includes('KLUNGKUNG') || k.includes('BANGLI')) return 'KLUNGKUNG';
  return 'DENPASAR';
}

export function processOrderRow(
  raw: RawCsvRow,
  index: number,
  lookup: ReturnType<typeof buildLookupIndex>,
  adminMode: AdminResolutionMode = 'auto'
): ProcessedOrderRow {
  const principalRaw = (raw['Principal'] || raw['Nama Principal'] || '').trim();
  const titikKirimRaw = (raw['Titik Kirim'] || '').trim().toUpperCase();
  const statusProdukRaw = (raw['Status Produk'] || '').trim();
  const dateRaw = (raw['Tanggal'] || raw['TGL PO'] || '').trim();
  const poRaw = (raw['IDH #PO'] || raw['Nomor PO'] || '').trim();
  const namaPelanggan = (raw['Nama Pelanggan'] || raw['Nama Outlet'] || '').trim();

  const dpsMatch = lookup.findDps(principalRaw);
  const prodOk = raw['ProdOk']?.trim() || dpsMatch?.prdOk || '-';
  const adminDps = dpsMatch?.admin || '-';

  const depoMatch = lookup.findDepo(titikKirimRaw);
  const adminDepo = depoMatch?.admint || '-';

  let admint = raw['Nama Admint']?.trim() || '';
  if (!admint) {
    if (adminMode === 'depo_first') {
      admint = adminDepo !== '-' ? adminDepo : adminDps;
    } else if (adminMode === 'dps_first') {
      admint = adminDps !== '-' ? adminDps : adminDepo;
    } else {
      admint = depoMatch && depoMatch.admint ? depoMatch.admint : adminDps;
    }
  }

  const blank = isStatusBlankOrEmpty(statusProdukRaw);

  // Strictly keep ONLY the 8 required fields in memory to minimize RAM footprint on 100MB-800MB files
  return {
    rowId: `${poRaw}_${index}`,
    tglPoIdh: extractDateOnly(dateRaw),
    noPoIdh: poRaw || '-',
    prodOk,
    principal: principalRaw || '-',
    namaPelanggan: namaPelanggan || '-',
    titikKirim: titikKirimRaw || 'DENPASAR',
    admint: admint || '-',
    statusProduk: blank ? 'OPEN' : statusProdukRaw,
    isStatusBlank: blank
  };
}

export function accumulateReturRawRow(
  raw: RawReturCsvRow,
  grouped: Map<string, ProcessedReturRow>,
  lookup: ReturnType<typeof buildLookupIndex>,
  adminMode: AdminResolutionMode = 'auto'
): void {
  const idPengajuan = (raw['ID Pengajuan'] || '').trim();
  if (!idPengajuan) return;

  const statusRetur = (raw['Status Retur'] || '').trim();
  // Filter ONLY "Belum dikonfirmasi" in real-time during stream so 500MB files use minimal RAM
  if (statusRetur.toLowerCase() !== 'belum dikonfirmasi') {
    return;
  }

  const waktuPengajuan = (raw['Waktu Pengajuan'] || '').trim();
  const idPelanggan = (raw['ID Pelanggan'] || raw['ID di distributor'] || raw['IDH ID Pelanggan'] || '').trim();
  const namaPelanggan = (raw['Nama Pelanggan'] || '').trim();
  const alamatPelanggan = (raw['Alamat Pelanggan'] || '').trim();
  const kotaKab = (raw['Kota/Kab Pelanggan'] || '').trim();
  const hpPelanggan = (raw['HP Pelanggan'] || raw['HP Ter-Verifikasi'] || '').trim();
  const principal = (raw['Nama Principal'] || '').trim();
  const tipePengajuan = (raw['Tipe Pengajuan'] || '').trim().toLowerCase();
  const qtyNum = parseFloat(raw['Kuantitas'] || '0') || 0;

  let entry = grouped.get(idPengajuan);
  if (!entry) {
    const dpsMatch = lookup.findDps(principal);
    const prodOk = dpsMatch?.prdOk || '-';
    const adminDps = dpsMatch?.admin || '-';

    const titikKirim = resolveTitikKirimFromKota(kotaKab);
    const depoMatch = lookup.findDepo(titikKirim);
    const adminDepo = depoMatch?.admint || '-';

    let admint = adminDps;
    if (adminMode === 'depo_first') {
      admint = adminDepo !== '-' ? adminDepo : adminDps;
    } else if (adminMode === 'dps_first') {
      admint = adminDps !== '-' ? adminDps : adminDepo;
    } else {
      admint = depoMatch && depoMatch.admint ? depoMatch.admint : adminDps;
    }

    const statusLabel = statusRetur || 'Belum dikonfirmasi';
    entry = {
      idPengajuan,
      waktuPengajuan,
      tglPengajuan: extractDateOnly(waktuPengajuan),
      idPelanggan: idPelanggan || '-',
      namaPelanggan: namaPelanggan || '-',
      alamatPelanggan: alamatPelanggan || '-',
      kotaKab: kotaKab || '-',
      hpPelanggan: hpPelanggan || '-',
      principal: principal || '-',
      prodOk,
      titikKirim,
      admint: admint || '-',
      sumRetur: 0,
      sumTukar: 0,
      totalQtyRetur: 0,
      totalQtyTukar: 0,
      statusKonfirmasi: statusLabel,
      statusRetur: statusLabel,
      statusDariPelanggan: (raw['Catatan Pelanggan'] || '').trim(),
      catatanPelanggan: (raw['Catatan Pelanggan'] || '').trim(),
      items: []
    };
    grouped.set(idPengajuan, entry);
  }

  const isExchange = tipePengajuan === 'exchange' || tipePengajuan === 'tukar';
  if (isExchange) {
    entry.sumTukar += 1;
    entry.totalQtyTukar += qtyNum;
  } else {
    entry.sumRetur += 1;
    entry.totalQtyRetur += qtyNum;
  }

  if (!entry.statusDariPelanggan && raw['Catatan Pelanggan']?.trim()) {
    entry.statusDariPelanggan = raw['Catatan Pelanggan'].trim();
    entry.catatanPelanggan = raw['Catatan Pelanggan'].trim();
  }

  // Cap stored item details per single pengajuan at 100 to prevent memory bloat on massive files
  if (entry.items.length < 100) {
    entry.items.push({
      idProduk: (raw['ID Produk'] || '').trim(),
      namaProduk: (raw['Nama Produk'] || '').trim(),
      kuantitas: qtyNum,
      satuan: (raw['Satuan'] || 'pcs').trim(),
      tipePengajuan: isExchange ? 'Tukar' : 'Retur',
      kondisiProduk: (raw['Kondisi Produk'] || '').trim(),
      statusPermintaan: (raw['Status Permintaan'] || '').trim(),
      statusPengambilan: (raw['Status Pengambilan'] || '').trim(),
      catatanPelanggan: (raw['Catatan Pelanggan'] || '').trim(),
      catatanAdmin: (raw['Catatan Admin'] || '').trim()
    });
  }
}

export function groupAndProcessReturRows(
  rawRows: RawReturCsvRow[],
  dpsMaster: MasterPcpEntry[],
  depoMaster: MasterDepoEntry[],
  adminMode: AdminResolutionMode = 'auto'
): ProcessedReturRow[] {
  const lookup = buildLookupIndex(dpsMaster, depoMaster);
  const grouped = new Map<string, ProcessedReturRow>();

  for (const raw of rawRows) {
    if (!raw) continue;
    accumulateReturRawRow(raw, grouped, lookup, adminMode);
  }

  return Array.from(grouped.values());
}
