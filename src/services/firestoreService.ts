import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { MasterPcpEntry, MasterDepoEntry, ProcessedOrderRow } from '../types';
import { DEFAULT_MASTER_DPS, DEFAULT_MASTER_DEPO } from '../data/masterPcpData';

export interface FollowUpRecord {
  id: string; // noPoIdh or compound
  noPoIdh: string;
  tglPoIdh: string;
  prodOk: string;
  principal: string;
  idPelanggan: string;
  namaPelanggan: string;
  hpPelanggan: string;
  alamatPelanggan: string;
  titikKirim: string;
  admint: string;
  statusProduk: string;
  followUpStatus: 'pending' | 'wa_sent' | 'confirmed' | 'canceled';
  catatan: string;
  namaBarang?: string;
  qty?: string;
  updatedAt?: string;
  createdAt?: string;
}

// 1. Fetch Master PCP from Firestore
export async function fetchMasterDpsFromFirestore(): Promise<MasterPcpEntry[]> {
  try {
    const colRef = collection(db, 'master_pcp');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<MasterPcpEntry, 'id'>)
    }));
  } catch (err) {
    console.warn('Firestore fetch master_pcp error:', err);
    return [];
  }
}

// 2. Fetch Master Depo from Firestore
export async function fetchMasterDepoFromFirestore(): Promise<MasterDepoEntry[]> {
  try {
    const colRef = collection(db, 'master_depo');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => docSnap.data() as MasterDepoEntry);
  } catch (err) {
    console.warn('Firestore fetch master_depo error:', err);
    return [];
  }
}

// 3. Save single Master PCP to Firestore
export async function saveMasterPcpToFirestore(entry: MasterPcpEntry): Promise<void> {
  const docRef = doc(db, 'master_pcp', entry.id);
  await setDoc(docRef, {
    principal: entry.principal,
    prdOk: entry.prdOk,
    divisi: entry.divisi || '',
    admin: entry.admin || '',
    nd: entry.nd || '',
    updatedAt: new Date().toISOString()
  });
}

// 4. Batch seed default master data to Firestore
export async function seedDefaultMasterToFirestore(): Promise<{ dpsCount: number; depoCount: number }> {
  for (const item of DEFAULT_MASTER_DPS) {
    const docRef = doc(db, 'master_pcp', item.id);
    await setDoc(docRef, {
      principal: item.principal,
      prdOk: item.prdOk,
      divisi: item.divisi || '',
      admin: item.admin || '',
      nd: item.nd || '',
      updatedAt: new Date().toISOString()
    });
  }

  for (const depo of DEFAULT_MASTER_DEPO) {
    const docRef = doc(db, 'master_depo', depo.titikKirim);
    await setDoc(docRef, {
      titikKirim: depo.titikKirim,
      area: depo.area,
      admint: depo.admint,
      updatedAt: new Date().toISOString()
    });
  }

  return { dpsCount: DEFAULT_MASTER_DPS.length, depoCount: DEFAULT_MASTER_DEPO.length };
}

// 5. Follow Up Records CRUD
export function subscribeFollowUpOrders(
  callback: (records: FollowUpRecord[]) => void
): () => void {
  const colRef = collection(db, 'follow_up_orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FollowUpRecord, 'id'>)
      }));
      callback(records);
    },
    (err) => {
      console.warn('Error subscribing to follow_up_orders:', err);
    }
  );
}

export async function saveFollowUpOrder(
  row: ProcessedOrderRow,
  followUpStatus: 'pending' | 'wa_sent' | 'confirmed' | 'canceled' = 'wa_sent',
  catatan: string = ''
): Promise<void> {
  const docRef = doc(db, 'follow_up_orders', row.rowId);
  const now = new Date().toISOString();
  await setDoc(
    docRef,
    {
      noPoIdh: row.noPoIdh,
      tglPoIdh: row.tglPoIdh,
      prodOk: row.prodOk,
      principal: row.principal,
      idPelanggan: row.idPelanggan,
      namaPelanggan: row.namaPelanggan,
      hpPelanggan: row.hpPelanggan,
      alamatPelanggan: row.alamatPelanggan,
      titikKirim: row.titikKirim,
      admint: row.admint,
      statusProduk: row.statusProduk || 'BLANK',
      followUpStatus,
      catatan,
      namaBarang: row.namaBarang || '',
      qty: row.qty || '',
      updatedAt: now
    },
    { merge: true }
  );
}

export async function updateFollowUpStatus(
  id: string,
  followUpStatus: 'pending' | 'wa_sent' | 'confirmed' | 'canceled',
  catatan?: string
): Promise<void> {
  const docRef = doc(db, 'follow_up_orders', id);
  const updateData: any = {
    followUpStatus,
    updatedAt: new Date().toISOString()
  };
  if (catatan !== undefined) {
    updateData.catatan = catatan;
  }
  await setDoc(docRef, updateData, { merge: true });
}

export async function deleteFollowUpOrder(id: string): Promise<void> {
  const docRef = doc(db, 'follow_up_orders', id);
  await deleteDoc(docRef);
}
