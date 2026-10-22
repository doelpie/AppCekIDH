import { ProcessedOrderRow } from '../types';

export function normalizePhoneNumberForWa(phone: string): string {
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

export function formatSingleRowForWhatsApp(
  row: ProcessedOrderRow,
  options: {
    includeHeader?: boolean;
    includeItemDetails?: boolean;
    customNote?: string;
  } = {}
): string {
  const { includeHeader = true, includeItemDetails = true, customNote } = options;

  const statusLabel = row.isStatusBlank
    ? '⏳ *[BLANK / KOSONG - PERLU KONFIRMASI]*'
    : `*${row.statusProduk.toUpperCase()}*`;

  const lines: string[] = [];

  if (includeHeader) {
    lines.push('📦 *DATA ORDER TRANSAKSI IDH*');
    lines.push('──────────────────────────────');
  }

  lines.push(`📅 *TGL PO IDH :* ${row.tglPoIdh}`);
  lines.push(`🔢 *No. PO IDH :* #${row.noPoIdh}`);
  lines.push(`🏷️ *Prod Ok    :* ${row.prodOk}`);
  lines.push(`🏢 *Principal  :* ${row.principal}`);
  lines.push(`🆔 *ID Pelanggan:* ${row.idPelanggan}`);
  lines.push(`🏪 *Pelanggan  :* ${row.namaPelanggan}`);
  lines.push(`📱 *HP Kontak  :* ${row.hpPelanggan}`);
  lines.push(`📍 *Alamat     :* ${row.alamatPelanggan}`);
  lines.push(`🚚 *Titik Kirim:* ${row.titikKirim}`);
  lines.push(`👤 *ADMINT     :* ${row.admint}`);
  lines.push(`⚡ *Status Produk:* ${statusLabel}`);

  if (includeItemDetails && (row.namaBarang || row.qty)) {
    lines.push('──────────────────────────────');
    lines.push(`🛒 *Barang     :* ${row.namaBarang || '-'}`);
    if (row.qty) lines.push(`📊 *Qty        :* ${row.qty} pcs`);
    if (row.totalHarga) lines.push(`💰 *Total      :* Rp ${Number(row.totalHarga).toLocaleString('id-ID')}`);
  }

  if (customNote && customNote.trim()) {
    lines.push('──────────────────────────────');
    lines.push(`📝 *Catatan    :* ${customNote.trim()}`);
  }

  return lines.join('\n');
}

export function formatMultipleRowsForWhatsApp(
  rows: ProcessedOrderRow[],
  options: {
    title?: string;
    includeItemDetails?: boolean;
  } = {}
): string {
  if (rows.length === 0) return '';
  if (rows.length === 1) return formatSingleRowForWhatsApp(rows[0], options);

  const title = options.title || `📋 *DAFTAR ORDER IDH (${rows.length} ITEM PERLU TINDAKAN)*`;
  const lines: string[] = [];
  lines.push(title);
  lines.push(`🕒 Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Total: ${rows.length} Baris`);
  lines.push('══════════════════════════════');

  rows.forEach((row, idx) => {
    lines.push(`*#${idx + 1}. PO: ${row.noPoIdh}* | *Tgl:* ${row.tglPoIdh}`);
    lines.push(`• *Principal:* ${row.principal}`);
    lines.push(`• *Prod Ok:* ${row.prodOk} | *ADMINT:* ${row.admint}`);
    lines.push(`• *Pelanggan:* ${row.namaPelanggan} (${row.idPelanggan})`);
    lines.push(`• *HP:* ${row.hpPelanggan}`);
    lines.push(`• *Alamat:* ${row.alamatPelanggan}`);
    lines.push(`• *Titik Kirim:* ${row.titikKirim}`);
    lines.push(`• *Status Produk:* ${row.isStatusBlank ? '⚠️ BLANK (Belum Konfirmasi)' : row.statusProduk}`);
    if (row.namaBarang) {
      lines.push(`• *Barang:* ${row.namaBarang} (Qty: ${row.qty || 1})`);
    }
    if (idx < rows.length - 1) {
      lines.push('──────────────────────────────');
    }
  });

  lines.push('══════════════════════════════');
  lines.push('_Mohon segera dicek dan ditindaklanjuti. Terima kasih._ 🙏');

  return lines.join('\n');
}

export function generateWhatsAppWebUrl(phone: string, text: string): string {
  const normalizedPhone = normalizePhoneNumberForWa(phone);
  const encodedText = encodeURIComponent(text);
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

