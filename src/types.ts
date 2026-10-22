export interface MasterPcpEntry {
  id: string;
  principal: string;
  prdOk: string;
  divisi?: string;
  admin: string;
  nd?: string;
}

export interface MasterDepoEntry {
  titikKirim: string;
  area: string;
  admint: string;
}

export interface RawCsvRow {
  Tanggal: string;
  'IDH #PO': string;
  'Status Order': string;
  'Status Produk': string;
  'ID di distributor': string;
  'IDH ID': string;
  'Nama Pelanggan': string;
  'Alamat Pelanggan': string;
  'Kelurahan Pelanggan'?: string;
  'Kecamatan Pelanggan'?: string;
  'Kota/Kab Pelanggan'?: string;
  'Propinsi Pelanggan'?: string;
  'HP Pelanggan': string;
  'HP Ter-Verifikasi'?: string;
  'Email Pelanggan'?: string;
  'Nama Penerima'?: string;
  'Alamat Penerima'?: string;
  'HP Penerima'?: string;
  'Kode Salesman'?: string;
  'Nama Salesman'?: string;
  Principal: string;
  Kategori?: string;
  'Kode Barang'?: string;
  'Nama Barang'?: string;
  Qty?: string;
  '@'?: string;
  'Qty x @'?: string;
  Harga?: string;
  'Sub Total'?: string;
  Total?: string;
  'Titik Kirim': string;
  'Catatan Order'?: string;
  [key: string]: string | undefined;
}

export interface ProcessedOrderRow {
  rowId: string;
  tglPoIdh: string; // tanpa jam
  tglPoOriginal: string;
  noPoIdh: string;
  prodOk: string;
  principal: string;
  idPelanggan: string; // ID di distributor or IDH ID
  idhId: string;
  namaPelanggan: string;
  hpPelanggan: string;
  alamatPelanggan: string;
  titikKirim: string;
  admint: string; // Resolved admin (Depo or DPS)
  adminDps: string; // DPS admin from Principal
  adminDepo: string; // Depo admin from Titik Kirim
  statusProduk: string; // Original status
  isStatusBlank: boolean; // True if blank/kosong/empty
  statusOrder: string;
  namaBarang?: string;
  kodeBarang?: string;
  qty?: string;
  totalHarga?: string;
  salesman?: string;
  catatan?: string;
}

export type AdminResolutionMode = 'auto' | 'dps_first' | 'depo_first';

export interface FilterState {
  statusFilter: 'all' | 'blank_only' | 'confirmed' | 'canceled';
  principal: string;
  titikKirim: string;
  admint: string;
  searchQuery: string;
  dateFilter: string;
}
