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
  Tanggal?: string;
  'IDH #PO'?: string;
  'Status Order'?: string;
  'Status Produk'?: string;
  'ID di distributor'?: string;
  'IDH ID'?: string;
  'Nama Pelanggan'?: string;
  'Alamat Pelanggan'?: string;
  'HP Pelanggan'?: string;
  'HP Ter-Verifikasi'?: string;
  Principal?: string;
  'Titik Kirim'?: string;
  [key: string]: string | undefined;
}

export interface ProcessedOrderRow {
  rowId: string;
  tglPoIdh: string; // tanpa jam
  noPoIdh: string;
  prodOk: string;
  principal: string;
  namaPelanggan: string;
  idPelanggan?: string;
  hpPelanggan?: string;
  alamatPelanggan?: string;
  titikKirim: string;
  admint: string;
  adminDps?: string;
  adminDepo?: string;
  statusProduk: string; // 'OPEN' when blank/empty or original status
  isStatusBlank: boolean; // True if OPEN / blank / belum konfirmasi
}

export interface RawReturCsvRow {
  'ID Pengajuan'?: string;
  'Waktu Pengajuan'?: string;
  'ID Pelanggan'?: string;
  'ID di distributor'?: string;
  'ID di principal'?: string;
  'Semua ID'?: string;
  'No. nasional'?: string;
  'IDH ID Pelanggan'?: string;
  'Nama Pelanggan'?: string;
  'Alamat Pelanggan'?: string;
  'Kelurahan Pelanggan'?: string;
  'Kecamatan Pelanggan'?: string;
  'Kota/Kab Pelanggan'?: string;
  'Propinsi Pelanggan'?: string;
  'HP Pelanggan'?: string;
  'HP Ter-Verifikasi'?: string;
  'Email Pelanggan'?: string;
  'Status Retur'?: string;
  'Waktu Status Retur'?: string;
  'Status Permintaan'?: string;
  'Status Pengambilan'?: string;
  'Waktu Status Produk'?: string;
  'ID Produk'?: string;
  'Nama Produk'?: string;
  'Nama Principal'?: string;
  Kuantitas?: string;
  Satuan?: string;
  'Tipe Pengajuan'?: string; // 'return' | 'exchange'
  'Kondisi Produk'?: string;
  'Catatan Pelanggan'?: string;
  'Catatan Admin'?: string;
  [key: string]: string | undefined;
}

export interface ReturItemDetail {
  idProduk: string;
  namaProduk: string;
  kuantitas: number;
  satuan: string;
  tipePengajuan: string; // 'Retur' | 'Tukar'
  kondisiProduk: string;
  statusPermintaan: string;
  statusPengambilan: string;
  catatanPelanggan: string;
  catatanAdmin: string;
}

export interface ProcessedReturRow {
  idPengajuan: string;
  waktuPengajuan: string;
  tglPengajuan: string; // DD-MM-YYYY tanpa jam
  idPelanggan: string;
  namaPelanggan: string;
  alamatPelanggan: string;
  kotaKab: string;
  hpPelanggan: string;
  principal: string;
  prodOk: string;
  titikKirim: string;
  admint: string;
  sumRetur: number; // Σ RETUR (count of return items)
  sumTukar: number; // Σ TUKAR (count of exchange items)
  totalQtyRetur: number;
  totalQtyTukar: number;
  statusKonfirmasi: string; // e.g. 'Belum dikonfirmasi'
  statusRetur?: string; // alias of statusKonfirmasi for safety
  statusDariPelanggan: string;
  catatanPelanggan: string;
  items: ReturItemDetail[];
}

export type AdminResolutionMode = 'auto' | 'dps_first' | 'depo_first';

export interface FilterState {
  statusFilter: 'all' | 'blank_only' | 'confirmed' | 'canceled';
  principal: string;
  titikKirim: string;
  admint: string;
  searchQuery: string;
  dateFilter: string;
  selectedDates?: string[];
}
