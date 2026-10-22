import { MasterPcpEntry, MasterDepoEntry } from '../types';

export const DEFAULT_MASTER_DPS: MasterPcpEntry[] = [
  { id: '1', principal: 'PT AIR MANCUR GROUP', prdOk: 'Farmasi', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '2', principal: 'PT BEIERSDORF INDONESIA', prdOk: 'Nivea', divisi: 'BDF', admin: 'Aan & Regita', nd: 'DPI' },
  { id: '3', principal: 'PT COMBIPHAR', prdOk: 'Combi', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '4', principal: 'PT DARYA VARIA LABORATORIA Tbk', prdOk: 'Darya Varia', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '5', principal: 'PT DUA BERLIAN', prdOk: 'Dua Berlian', divisi: 'Dua Berlian', admin: 'Putu Setia & Rahayu', nd: 'DSD' },
  { id: '6', principal: 'PT DUA BERLIAN (FOOD)', prdOk: 'Db-Food', divisi: 'Dua Berlian', admin: 'Putu Setia & Rahayu', nd: 'DSD' },
  { id: '7', principal: 'PT DUA BERLIAN (IP)', prdOk: 'Db-Ip', divisi: 'Dua Berlian', admin: 'Putu Setia & Rahayu', nd: 'DSD' },
  { id: '8', principal: 'PT FLOAT OATSIDE INDONESIA', prdOk: 'Oatside', divisi: 'Oatside', admin: 'Yuni & Asa', nd: 'DSD' },
  { id: '9', principal: 'PT INTERATLAS MURNI', prdOk: 'Carla', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '10', principal: 'PT MEKAR MANDIRI MAKMUR', prdOk: 'MMM', divisi: 'MMM', admin: 'Yuni & Asa', nd: 'DSD' },
  { id: '11', principal: 'PT. AKASHA WIRA INTERNATIONAL TBK', prdOk: 'Nestle', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '12', principal: 'PT. AMERTA INDAH OTSUKA', prdOk: 'Pocari', divisi: 'Pocari', admin: 'Mirtayana & Anggi', nd: 'DSD' },
  { id: '13', principal: 'PT. ANEKA SAKTI BAKTI', prdOk: 'Asaba', divisi: 'Asaba', admin: 'Rahayu', nd: 'DPP' },
  { id: '14', principal: "PT. ARNOTT'S INDONESIA", prdOk: 'Arnotts', divisi: 'Arnotts', admin: 'Diah & Made Ria', nd: 'DSD' },
  { id: '15', principal: 'PT. ASIA SAKTI WAHID', prdOk: 'Biscuits', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '16', principal: 'PT. ASTAGUNA WISESA', prdOk: 'Morin', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '17', principal: 'PT. AVENTIS PHARMA', prdOk: 'Farmasi', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '18', principal: 'PT. BAHETERA CIPTA RAGA PRIMA', prdOk: 'Schick', divisi: 'Schick', admin: 'Asa', nd: 'DSD' },
  { id: '19', principal: 'PT. BIYAN INTERNASIONAL BAHAGIA', prdOk: 'Cypruz', divisi: 'Cypruz', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '20', principal: 'PT. CAMPINA ICE CREAM INDUSTRY', prdOk: 'Campina', divisi: 'Campina', admin: 'Suli & Yuli Campina', nd: 'DPP' },
  { id: '21', principal: 'PT. DOHO NAOLI', prdOk: 'Doho Naoli', divisi: 'Doho Naoli', admin: 'Office', nd: 'DSD' },
  { id: '22', principal: 'PT. ENERGIZER INDONESIA', prdOk: 'Energizer', divisi: 'Energizer', admin: 'Putu Setia', nd: 'DSD' },
  { id: '23', principal: 'PT. EQUILINDO ASRI', prdOk: 'Equil', divisi: 'Equil', admin: 'Diana', nd: 'DSD' },
  { id: '24', principal: 'PT. FABINDO SEJAHTERA', prdOk: 'Fabindo', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '25', principal: 'PT. FKS PANGAN NUSANTARA', prdOk: 'FKS', divisi: 'FKS', admin: 'Sepri Tantri', nd: 'TDU' },
  { id: '26', principal: 'PT. FLORA FOOD INDONESIA', prdOk: 'Blue Band', divisi: 'Blueband', admin: 'Darmianti & Diana', nd: 'DPI' },
  { id: '27', principal: 'PT. FONTERRA BRANDS INDONESIA', prdOk: 'Fonterra', divisi: 'Fonterra', admin: 'Rahayu', nd: 'DSD' },
  { id: '28', principal: 'PT. GLAXO SMITH KLINE', prdOk: 'Merck Cons', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '29', principal: 'PT. GLICO INDONESIA', prdOk: 'Glico', divisi: 'Glico', admin: 'Rahayu', nd: 'DSD' },
  { id: '30', principal: 'PT. GUDANG REJEKI UTAMA', prdOk: 'Gudang Rejeki U', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '31', principal: 'PT. HERBATAMA INDO PERKASA', prdOk: 'Herbatama', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '32', principal: 'PT. HOKA JAYA INTERNASIONAL', prdOk: 'Hoka Jaya', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '33', principal: 'PT. ICHI TAN INDONESIA', prdOk: 'Ichitan', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '34', principal: 'PT. IKAN DORANG', prdOk: 'Dorang', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '35', principal: 'PT. INDOFOOD SUKSES MAKMUR', prdOk: 'Lafonte', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '36', principal: 'PT. JOHNSON AND JOHNSON INDONESIA', prdOk: 'Johnson', divisi: 'JNJ', admin: 'Aan & Regita', nd: 'DSD' },
  { id: '37', principal: 'PT. JOHNSON HOME HYGIENE PRODUCTS', prdOk: 'Baygon', divisi: 'JHHP', admin: 'Novi', nd: 'DSD' },
  { id: '38', principal: 'PT. LIBRA', prdOk: 'Libra', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '39', principal: 'PT. LOREAL INDONESIA', prdOk: 'Loreal', divisi: 'Loreal', admin: 'Gusde & Okky', nd: 'DSD' },
  { id: '40', principal: 'PT. LOTTE INDONESIA', prdOk: 'Lotte', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '41', principal: 'PT. MONDELEZ INDONESIA', prdOk: 'Mondelez', divisi: 'Mondelez', admin: 'Ratna & Teguh', nd: 'DPI' },
  { id: '42', principal: 'PT. MONDELEZ INDONESIA (CADBURY)', prdOk: 'Cadbury', divisi: 'Mondelez', admin: 'Putu Setia', nd: 'DSD' },
  { id: '43', principal: 'PT. MULTI SARI LANGGENG JAYA', prdOk: 'MSL', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '44', principal: 'PT. MUSTIKA RATU BUANA INTERNASIONAL Tbk', prdOk: 'Mrbi', divisi: 'Mrbi', admin: 'Kadek Adi', nd: 'DPP' },
  { id: '45', principal: 'PT. PROCTER & GAMBLE', prdOk: 'P&G', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '46', principal: 'PT. PZ CUSSONS INDONESIA', prdOk: 'Cuson-Ibm', divisi: 'DPL Cussons', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '47', principal: 'PT. SANGRA RATU BOGA', prdOk: 'Fermipan', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '48', principal: 'PT. SELERA SWEETSINDO', prdOk: 'Golden Ginger', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '49', principal: 'PT. SENTOSA KARYA GEMILANG', prdOk: 'Badak', divisi: 'Badak', admin: 'Yuni & Asa', nd: 'DSD' },
  { id: '50', principal: 'PT. SENTOSA KARYA GEMILANG (LASEGAR)', prdOk: 'Lasegar', divisi: 'Lasegar', admin: 'Yuni & Asa', nd: 'DSD' },
  { id: '51', principal: 'PT. SINAR MEADOW INTERNATIONAL INDONESIA', prdOk: 'Sinar Meadow', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '52', principal: 'PT. SOFTEX INDONESIA', prdOk: 'Softex', divisi: 'Softex', admin: 'Maha', nd: 'DSD' },
  { id: '53', principal: 'PT. Surya Inti Aneka Pangan', prdOk: 'SIAP', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '54', principal: 'PT. TARU MARTANI', prdOk: 'Cerutu', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '55', principal: 'PT. TEMAN PEREMPUAN SEHATI', prdOk: 'Filmore', divisi: 'Filmore', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '56', principal: 'PT. TONG GARDEN FOOD INDONESIA', prdOk: 'Tong Garden', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '57', principal: 'PT. ULTRAJAYA MILK INDUSTRY AND TRADING COMPANY', prdOk: 'Ultra', divisi: 'Ultra', admin: 'Sepri Tantri', nd: 'TDU' },
  { id: '58', principal: 'PT. UNILEVER FOOD SOLUTIONS', prdOk: 'Unilever-Fs', divisi: 'UFS', admin: 'Eka Putra', nd: 'DPI' },
  { id: '59', principal: 'PT. UNITED FAMILY FOOD', prdOk: 'Unican', divisi: 'Unifam', admin: 'Made Ria', nd: 'DSD' },
  { id: '60', principal: 'PT. UNIVENUS', prdOk: 'Paseo', divisi: 'Paseo', admin: 'Kadek Adi', nd: 'DPI' },
  { id: '61', principal: 'PT. UNIVENUS (Livi)', prdOk: 'Livi', divisi: 'Livi', admin: 'Rina', nd: 'DPI' },
  { id: '62', principal: 'PT. UNZA VITALIS', prdOk: 'Vitalis', divisi: 'Vitalis', admin: 'Aan & Regita', nd: 'DSD' },
  { id: '63', principal: 'PT. URC INDONESIA', prdOk: 'Urc', divisi: 'URC Piattos', admin: 'Diah & Made Ria', nd: 'DSD' },
  { id: '64', principal: 'PT. YOU Indonesia', prdOk: 'Youvit', divisi: 'Farmasi', admin: 'Gusde & Okky', nd: 'DPI' },
  { id: '65', principal: 'PT. YURI INDONESIA', prdOk: 'Yuri', divisi: 'Yuri', admin: 'Sepri Tantri', nd: 'TDU' },
  { id: '66', principal: 'PT. ZENSEI INDONESIA', prdOk: 'Popoku', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '67', principal: 'PT. NAMA CANTIK ABADI', prdOk: 'Nama', divisi: 'Nama', admin: 'Aan & Regita', nd: 'DPP' },
  { id: '68', principal: 'PT. VSP INDONESIA SEHAT', prdOk: 'VSP', divisi: 'DPL Mix', admin: 'Endang, Neni & Ko', nd: 'PLZ' },
  { id: '69', principal: 'PT. Suntone Wisdom Indonesia', prdOk: 'G2G', divisi: 'Glad2Glow', admin: 'Kadek Adi', nd: 'DPP' },
  { id: '70', principal: 'PT. SINARMAS DISTRIBUSI NUSANTARA', prdOk: 'Sdn', divisi: 'Sdn', admin: 'Sepri Tantri', nd: 'TDU' },
  { id: '71', principal: 'PT. LUCKY MOM INDONESIA', prdOk: 'Makuku', divisi: 'Makuku', admin: 'Maha', nd: 'DSD' },
  { id: '72', principal: 'PT. ARJUNA PERKASA UTAMA', prdOk: 'Arjuna', divisi: 'Glad2Glow', admin: 'Kadek Adi', nd: 'DPP' },
  { id: '73', principal: 'PT BEIERSDORF INDONESIA (HANSAPLAST)', prdOk: 'Hansaplast', divisi: 'BDF', admin: 'Aan & Regita', nd: 'DPI' },
  { id: '74', principal: 'PT. UNITED FAMILY FOOD (KATA OMA)', prdOk: 'Kata Oma', divisi: 'Unifam', admin: 'Made Ria', nd: 'DSD' },
  { id: '75', principal: 'PT. UNITED FAMILY FOOD (KIKO)', prdOk: 'Kiko', divisi: 'Unifam', admin: 'Made Ria', nd: 'DSD' },
  { id: '76', principal: 'PT. LUCKY MOM INDONESIA (GT)', prdOk: 'Makuku Gt', divisi: 'Makuku', admin: 'Maha', nd: 'DSD' },
  { id: '77', principal: 'PT. UNITED FAMILY FOOD (LEMONILO)', prdOk: 'Mie Lemonelo', divisi: 'Unifam', admin: 'Made Ria', nd: 'DSD' },
  { id: '78', principal: 'PT. MONDELEZ INDONESIA (BISKUIT)', prdOk: 'Mondelez Bisku', divisi: 'Mondelez', admin: 'Ratna & Teguh', nd: 'DPI' },
  { id: '79', principal: 'PT. MONDELEZ INDONESIA (KEJU)', prdOk: 'Mondelez Keju', divisi: 'Mondelez', admin: 'Ratna & Teguh', nd: 'DPI' },
  { id: '80', principal: 'PT. AKASHA WIRA INTERNATIONAL TBK (MUJIGAE)', prdOk: 'Mujigae', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '81', principal: 'PT. AKASHA WIRA INTERNATIONAL TBK (VICA)', prdOk: 'Nestle Vica', divisi: 'Local 1', admin: 'Darmianti', nd: 'DSD' },
  { id: '82', principal: 'PT. ARJUNA PERKASA UTAMA (NEXTPRIME)', prdOk: 'NextPrime', divisi: 'Glad2Glow', admin: 'Kadek Adi', nd: 'DPP' },
  { id: '83', principal: 'PT. ANEKA SAKTI BAKTI (KERTAS)', prdOk: 'Oe + Kertas', divisi: 'Asaba', admin: 'Rahayu', nd: 'DPP' },
  { id: '84', principal: 'PT. UNITED FAMILY FOOD (PINO)', prdOk: 'Pino', divisi: 'Unifam', admin: 'Diah & Made Ria', nd: 'DSD' },
  { id: '85', principal: 'PT. SINERGI MULTI DISTRINDO', prdOk: 'Mattel', divisi: 'Mattel', admin: 'Putu Setia & Maha', nd: 'DSD' },
  { id: '86', principal: 'PT. ESHAM DIMA MANDIRI', prdOk: 'Sdn', divisi: 'Sdn', admin: 'Sepri Tantri', nd: 'TDU' },
  { id: '87', principal: 'PT. ARJUNA PERKASA UTAMA (BODIBREZE)', prdOk: 'BodiBreze', divisi: 'Glad2Glow', admin: 'Kadek Adi', nd: 'DPP' }
];

export const DEFAULT_MASTER_DEPO: MasterDepoEntry[] = [
  { titikKirim: 'SINGARAJA', area: 'SGR', admint: 'Sulitri' },
  { titikKirim: 'NEGARA', area: 'NGR', admint: 'Sri' },
  { titikKirim: 'KARANGASEM', area: 'KRS', admint: 'Cintya' },
  { titikKirim: 'KLUNGKUNG', area: 'KLK', admint: 'Dwiarsa & Sinta' }
];

const LOCAL_STORAGE_KEY_DPS = 'idh_master_dps_data_v1';
const LOCAL_STORAGE_KEY_DEPO = 'idh_master_depo_data_v1';

export function getStoredMasterDps(): MasterPcpEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read stored master DPS:', e);
  }
  return DEFAULT_MASTER_DPS;
}

export function saveStoredMasterDps(data: MasterPcpEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DPS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save master DPS to storage:', e);
  }
}

export function getStoredMasterDepo(): MasterDepoEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DEPO);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read stored master Depo:', e);
  }
  return DEFAULT_MASTER_DEPO;
}

export function saveStoredMasterDepo(data: MasterDepoEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DEPO, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save master Depo to storage:', e);
  }
}

export function resetMasterDataToDefault(): { dps: MasterPcpEntry[]; depo: MasterDepoEntry[] } {
  localStorage.removeItem(LOCAL_STORAGE_KEY_DPS);
  localStorage.removeItem(LOCAL_STORAGE_KEY_DEPO);
  return { dps: DEFAULT_MASTER_DPS, depo: DEFAULT_MASTER_DEPO };
}
