import { ProcessedOrderRow, ProcessedReturRow } from '../types';

export function normalizePhoneNumberForWa(phone: string | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.substring(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return digits;
}

/**
 * Deduplicate rows by PO Number + Principal + Status so that if a PO has multiple product lines,
 * we format cleanly without product names.
 */
export function getUniquePoRows(rows: ProcessedOrderRow[]): ProcessedOrderRow[] {
  const map = new Map<string, ProcessedOrderRow>();
  for (const r of rows) {
    const key = `${r.noPoIdh}_${r.principal}_${r.statusProduk}_${r.tglPoIdh}`;
    if (!map.has(key)) {
      map.set(key, r);
    }
  }
  return Array.from(map.values());
}

export function formatSingleRowForWhatsApp(
  row: ProcessedOrderRow,
  options: {
    includeHeader?: boolean;
    customNote?: string;
  } = {}
): string {
  const { includeHeader = true, customNote } = options;

  const statusLabel = row.isStatusBlank ? 'OPEN (BELUM KONFIRMASI)' : row.statusProduk.toUpperCase();

  const lines: string[] = [];

  if (includeHeader) {
    lines.push('📦 *DATA ORDERAN PO IDH*');
    lines.push('──────────────────────────────');
  }

  lines.push(`📅 *TGL PO      :* ${row.tglPoIdh}`);
  lines.push(`🔢 *Nomor PO    :* #${row.noPoIdh}`);
  lines.push(`🏪 *Nama Outlet :* ${row.namaPelanggan}`);
  lines.push(`🏷️ *ProdOk      :* ${row.prodOk}`);
  lines.push(`🏢 *Principal   :* ${row.principal}`);
  lines.push(`🚚 *Titik Kirim :* ${row.titikKirim}`);
  lines.push(`👤 *Nama Admint :* ${row.admint}`);
  lines.push(`⚡ *Status Produk:* *${statusLabel}*`);

  if (customNote && customNote.trim()) {
    lines.push('──────────────────────────────');
    lines.push(`📝 *Catatan     :* ${customNote.trim()}`);
  }

  return lines.join('\n');
}

export function formatMultipleRowsForWhatsApp(
  rows: ProcessedOrderRow[],
  options: {
    title?: string;
    deduplicateByPo?: boolean;
    deduplicatePo?: boolean;
    maxPreviewItems?: number;
  } = {}
): string {
  if (rows.length === 0) return '';
  if (rows.length === 1) return formatSingleRowForWhatsApp(rows[0]);

  const shouldDedup = options.deduplicateByPo || options.deduplicatePo;
  const fullList = shouldDedup ? getUniquePoRows(rows) : rows;
  const totalCount = fullList.length;

  const listToFormat =
    options.maxPreviewItems && fullList.length > options.maxPreviewItems
      ? fullList.slice(0, options.maxPreviewItems)
      : fullList;

  const title =
    options.title ||
    `📋 *DAFTAR ORDER IDH (${totalCount.toLocaleString('id-ID')} ORDERAN PO IDH PERLU TINDAKAN)*`;
  const lines: string[] = [];
  lines.push(title);
  lines.push(
    `🕒 Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Total: ${totalCount.toLocaleString('id-ID')} ORDERAN PO IDH`
  );
  lines.push('══════════════════════════════');

  for (let idx = 0; idx < listToFormat.length; idx++) {
    const row = listToFormat[idx];
    const statusText = row.isStatusBlank ? 'OPEN' : row.statusProduk;
    lines.push(`*#${idx + 1}. Nomor PO: ${row.noPoIdh}* | *TGL PO:* ${row.tglPoIdh}`);
    lines.push(`• *Nama Outlet:* ${row.namaPelanggan}`);
    lines.push(`• *ProdOk:* ${row.prodOk} | *Nama Admint:* ${row.admint}`);
    lines.push(`• *Principal:* ${row.principal}`);
    lines.push(`• *Titik Kirim:* ${row.titikKirim}`);
    lines.push(`• *Status Produk:* ${statusText}`);
    if (idx < listToFormat.length - 1) {
      lines.push('──────────────────────────────');
    }
  }

  if (options.maxPreviewItems && totalCount > options.maxPreviewItems) {
    lines.push('══════════════════════════════');
    lines.push(
      `... _(Menampilkan pratinjau ${options.maxPreviewItems} dari ${totalCount.toLocaleString(
        'id-ID'
      )} ORDERAN PO IDH. Klik "Salin Semua Chat WhatsApp" untuk menyalin 100% seluruh ${totalCount.toLocaleString(
        'id-ID'
      )} ORDERAN PO IDH)_`
    );
  }

  lines.push('══════════════════════════════');
  lines.push('_Mohon segera dicek dan ditindaklanjuti. Terima kasih._ 🙏');

  return lines.join('\n');
}

export function formatSingleReturForWhatsApp(
  row: ProcessedReturRow,
  customNote?: string
): string {
  const statusLabel = row.statusKonfirmasi || row.statusRetur || 'Belum dikonfirmasi';
  const lines: string[] = [];
  lines.push('🔄 *PENGAJUAN RETUR & TUKAR BARANG IDH*');
  lines.push('──────────────────────────────');
  lines.push(`🔢 *No. Pengajuan :* No. ${row.idPengajuan}`);
  lines.push(`📅 *Waktu         :* ${row.waktuPengajuan}`);
  lines.push(`🏪 *Pelanggan     :* ${row.namaPelanggan}`);
  lines.push(`🏢 *Principal     :* ${row.principal}`);
  lines.push(`🏷️ *ProdOk        :* ${row.prodOk} | *Admint:* ${row.admint}`);
  lines.push(`🚚 *Titik Kirim   :* ${row.titikKirim}`);
  lines.push(`📦 *Σ Retur       :* ${row.sumRetur} item | *Σ Tukar:* ${row.sumTukar} item`);
  lines.push(`⚡ *Status Konfirm:* ⚡ *${statusLabel}*`);
  if (row.statusDariPelanggan) {
    lines.push(`💬 *Catatan Toko  :* ${row.statusDariPelanggan}`);
  }

  if (Array.isArray(row.items) && row.items.length > 0) {
    lines.push('──────────────────────────────');
    lines.push('*Rincian Barang:*');
    row.items.forEach((it, i) => {
      lines.push(
        `${i + 1}. [${(it.tipePengajuan || 'Retur').toUpperCase()}] ${it.namaProduk} — *${it.kuantitas} ${it.satuan}* (${it.kondisiProduk || '-'})`
      );
    });
  }

  if (customNote && customNote.trim()) {
    lines.push('──────────────────────────────');
    lines.push(`📝 *Catatan Admin :* ${customNote.trim()}`);
  }

  lines.push('──────────────────────────────');
  lines.push('_Mohon segera dikonfirmasi pengajuan Retur/Tukar IDH ini. Terima kasih._ 🙏');
  return lines.join('\n');
}

export function formatMultipleReturForWhatsApp(
  rows: ProcessedReturRow[],
  customTitle?: string,
  maxPreviewItems?: number
): string {
  if (rows.length === 0) return '';
  if (rows.length === 1) return formatSingleReturForWhatsApp(rows[0]);

  const totalCount = rows.length;
  const listToFormat =
    maxPreviewItems && rows.length > maxPreviewItems ? rows.slice(0, maxPreviewItems) : rows;

  const title =
    customTitle ||
    `🔄 *DAFTAR RETUR & TUKAR BARANG PELANGGAN IDH (${totalCount.toLocaleString('id-ID')} PENGAJUAN BELUM DIKONFIRMASI)*`;
  const lines: string[] = [];
  lines.push(title);
  lines.push(
    `🕒 Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Total: ${totalCount.toLocaleString('id-ID')} Pengajuan`
  );
  lines.push('══════════════════════════════');

  listToFormat.forEach((row, idx) => {
    const statusLabel = row.statusKonfirmasi || row.statusRetur || 'Belum dikonfirmasi';
    lines.push(`*#${idx + 1}. No. ${row.idPengajuan}* | ${row.waktuPengajuan}`);
    lines.push(`• *Pelanggan:* ${row.namaPelanggan}`);
    lines.push(`• *Principal:* ${row.principal}`);
    lines.push(`• *ProdOk:* ${row.prodOk} | *Admint:* ${row.admint} | *Titik Kirim:* ${row.titikKirim}`);
    lines.push(`• *Σ Retur:* ${row.sumRetur} | *Σ Tukar:* ${row.sumTukar}`);
    lines.push(`• *Status Konfirmasi:* ⚡ ${statusLabel}`);
    if (row.statusDariPelanggan) {
      lines.push(`• *Status Pelanggan:* ${row.statusDariPelanggan}`);
    }
    if (Array.isArray(row.items) && row.items.length > 0) {
      const itemSummary = row.items
        .slice(0, 10)
        .map((it) => `${it.namaProduk} (${it.kuantitas} ${it.satuan} - ${it.tipePengajuan})`)
        .join('; ');
      lines.push(`• *Produk:* ${itemSummary}`);
    }
    if (idx < listToFormat.length - 1) {
      lines.push('──────────────────────────────');
    }
  });

  if (maxPreviewItems && totalCount > maxPreviewItems) {
    lines.push('══════════════════════════════');
    lines.push(
      `... _(Menampilkan pratinjau ${maxPreviewItems} dari ${totalCount.toLocaleString(
        'id-ID'
      )} pengajuan. Klik "Copy ke Format WA" untuk menyalin seluruh ${totalCount.toLocaleString('id-ID')} pengajuan)_`
    );
  }

  lines.push('══════════════════════════════');
  lines.push('_Mohon segera dikonfirmasi pengajuan Retur & Tukar IDH di atas. Terima kasih._ 🙏');

  return lines.join('\n');
}

/**
 * Memory-safe chunked CSV Blob generator that handles hundreds of thousands of rows
 * without hitting JavaScript max string length limits.
 */
export function buildLargeOrdersCsvBlob(rows: ProcessedOrderRow[]): Blob {
  const headers = [
    'TGL PO',
    'Nomor PO',
    'Nama Outlet',
    'ProdOk',
    'Nama Principal',
    'Titik Kirim',
    'Nama Admint',
    'Status Produk'
  ];

  const escapeCsv = (val: string | undefined) => {
    if (!val) return '""';
    return `"${val.replace(/"/g, '""')}"`;
  };

  const blobParts: BlobPart[] = [headers.join(',') + '\n'];
  const CHUNK = 5000;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const lines: string[] = [];
    for (let j = 0; j < slice.length; j++) {
      const row = slice[j];
      lines.push(
        [
          escapeCsv(row.tglPoIdh),
          escapeCsv(row.noPoIdh),
          escapeCsv(row.namaPelanggan),
          escapeCsv(row.prodOk),
          escapeCsv(row.principal),
          escapeCsv(row.titikKirim),
          escapeCsv(row.admint),
          escapeCsv(row.isStatusBlank ? 'OPEN' : row.statusProduk)
        ].join(',')
      );
    }
    blobParts.push(lines.join('\n') + '\n');
  }

  return new Blob(blobParts, { type: 'text/csv;charset=utf-8;' });
}

export function generateWhatsAppWebUrl(phone: string | undefined, text: string): string {
  const normalizedPhone = normalizePhoneNumberForWa(phone);
  // Prevent HTTP 414 URI Too Long on wa.me when sharing thousands of POs
  const safeText = text.length > 12000 ? text.substring(0, 12000) + '\n...(Pesan lengkap telah disalin ke Clipboard)' : text;
  const encodedText = encodeURIComponent(safeText);
  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // continue to fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback copy failed', err);
    return false;
  }
}
