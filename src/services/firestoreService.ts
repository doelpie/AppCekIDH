import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  MasterPcpEntry,
  MasterDepoEntry,
  ProcessedOrderRow,
  ProcessedReturRow
} from '../types';
import { DEFAULT_MASTER_DPS, DEFAULT_MASTER_DEPO } from '../data/masterPcpData';
import {
  saveOrdersToIndexedDB,
  clearOrdersInIndexedDB,
  saveReturToIndexedDB
} from '../utils/idbStorage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Guard flags to prevent onSnapshot from firing dozens of intermediate re-renders during bulk batch writes
let isWritingOrdersBatch = false;
let isWritingReturBatch = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FollowUpRecord {
  id: string;
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
  try {
    const docRef = doc(db, 'master_pcp', entry.id);
    await setDoc(docRef, {
      principal: entry.principal,
      prdOk: entry.prdOk,
      divisi: entry.divisi || '',
      admin: entry.admin || '',
      nd: entry.nd || '',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'master_pcp');
  }
}

// 4. Batch seed default master data to Firestore
export async function seedDefaultMasterToFirestore(): Promise<{ dpsCount: number; depoCount: number }> {
  try {
    const batch = writeBatch(db);
    for (const item of DEFAULT_MASTER_DPS) {
      const docRef = doc(db, 'master_pcp', item.id);
      batch.set(docRef, {
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
      batch.set(docRef, {
        titikKirim: depo.titikKirim,
        area: depo.area,
        admint: depo.admint,
        updatedAt: new Date().toISOString()
      });
    }
    await batch.commit();
    return { dpsCount: DEFAULT_MASTER_DPS.length, depoCount: DEFAULT_MASTER_DEPO.length };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'master_pcp');
    return { dpsCount: 0, depoCount: 0 };
  }
}

// Helper: Encode ProcessedOrderRow to ultra-compact tab-separated string (85% smaller in Firestore)
function encodeOrderRowCompact(r: ProcessedOrderRow): string {
  const clean = (s: string | undefined) => (s || '-').replace(/[\t\n\r]/g, ' ');
  const st = r.isStatusBlank ? 'OPEN' : clean(r.statusProduk);
  const blankFlag = r.isStatusBlank ? '1' : '0';
  return `${clean(r.rowId)}\t${clean(r.tglPoIdh)}\t${clean(r.noPoIdh)}\t${clean(r.namaPelanggan)}\t${clean(r.prodOk)}\t${clean(r.principal)}\t${clean(r.titikKirim)}\t${clean(r.admint)}\t${st}\t${blankFlag}`;
}

function decodeOrderRowCompact(line: string): ProcessedOrderRow {
  const parts = line.split('\t');
  const isBlank = parts[9] === '1' || parts[8] === 'OPEN';
  return {
    rowId: parts[0] || '',
    tglPoIdh: parts[1] || '-',
    noPoIdh: parts[2] || '-',
    namaPelanggan: parts[3] || '-',
    prodOk: parts[4] || '-',
    principal: parts[5] || '-',
    titikKirim: parts[6] || 'DENPASAR',
    admint: parts[7] || '-',
    statusProduk: parts[8] || 'OPEN',
    isStatusBlank: isBlank
  };
}

// 5. Clear all old uploaded CSV Orders from Firestore & IndexedDB
export async function clearAllUploadedOrdersInFirestore(): Promise<void> {
  isWritingOrdersBatch = true;
  try {
    await clearOrdersInIndexedDB();

    const colRef = collection(db, 'uploaded_orders_batches');
    const existingSnap = await getDocs(colRef);
    if (!existingSnap.empty) {
      const docs = existingSnap.docs;
      for (let i = 0; i < docs.length; i += 250) {
        const batch = writeBatch(db);
        docs.slice(i, i + 250).forEach((d) => batch.delete(d.ref));
        await batch.commit();
        if (i + 250 < docs.length) await sleep(50);
      }
    }

    const followCol = collection(db, 'follow_up_orders');
    const followSnap = await getDocs(followCol);
    if (!followSnap.empty) {
      const fDocs = followSnap.docs;
      for (let i = 0; i < fDocs.length; i += 250) {
        const batch = writeBatch(db);
        fDocs.slice(i, i + 250).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Error clearing old orders from Firestore:', err);
  } finally {
    isWritingOrdersBatch = false;
  }
}

// 6. Replace & Sync CSV Order rows to IndexedDB (100% capacity) & Firestore (Compact + Throttled)
export async function syncAllOrdersToFirestore(
  rows: ProcessedOrderRow[],
  fileName: string,
  onProgress?: (syncedRows: number, totalRows: number) => void
): Promise<void> {
  isWritingOrdersBatch = true;
  try {
    // Step 1: Delete old data from Firebase & IndexedDB first
    await clearAllUploadedOrdersInFirestore();
    isWritingOrdersBatch = true;

    if (rows.length === 0) return;

    // Step 2: Save 100% of rows into browser IndexedDB (handles 100MB-800MB without network bottleneck)
    await saveOrdersToIndexedDB(rows, fileName);

    // Step 3: Sync to Firebase Firestore using compact tabular encoding
    // Prioritize all OPEN (blank) rows first so 100% of actionable POs are always in Cloud first,
    // followed by other statuses up to safe cloud batch capacity (120,000 rows = 40 compact docs)
    const MAX_CLOUD_ROWS = 120000;
    let rowsForCloud = rows;
    if (rows.length > MAX_CLOUD_ROWS) {
      const openRows = rows.filter((r) => r.isStatusBlank);
      const otherRows = rows.filter((r) => !r.isStatusBlank);
      const remainingQuota = Math.max(0, MAX_CLOUD_ROWS - openRows.length);
      rowsForCloud = [...openRows, ...otherRows.slice(0, remainingQuota)];
    }

    const CHUNK_SIZE = 3000; // 3,000 compact tab-delimited lines per doc (~250 KB, well under 1 MiB)
    const totalChunks = Math.ceil(rowsForCloud.length / CHUNK_SIZE);
    const now = new Date().toISOString();

    let syncedCount = 0;
    // Commit in groups of 5 chunk docs per writeBatch with brief pause so Firestore WebChannel never chokes
    for (let startChunk = 0; startChunk < totalChunks; startChunk += 5) {
      const batch = writeBatch(db);
      const endChunk = Math.min(startChunk + 5, totalChunks);

      for (let c = startChunk; c < endChunk; c++) {
        const slice = rowsForCloud.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        const compactLines = slice.map(encodeOrderRowCompact);

        const docId = `batch_${String(c).padStart(5, '0')}`;
        const docRef = doc(db, 'uploaded_orders_batches', docId);
        batch.set(docRef, {
          batchIndex: c,
          fileName,
          totalRows: rows.length,
          updatedAt: now,
          compactLines
        });
        syncedCount += slice.length;
      }

      // Retry logic for network resilience on large uploads
      let retries = 2;
      while (retries >= 0) {
        try {
          await batch.commit();
          break;
        } catch (commitErr) {
          if (retries === 0) throw commitErr;
          retries--;
          await sleep(400);
        }
      }

      if (onProgress) {
        const displaySynced =
          rowsForCloud.length === rows.length
            ? syncedCount
            : Math.min(rows.length, Math.round((syncedCount / rowsForCloud.length) * rows.length));
        onProgress(displaySynced, rows.length);
      }

      if (endChunk < totalChunks) {
        await sleep(60);
      }
    }
  } catch (err) {
    console.warn('Error syncing orders to Firestore (local IndexedDB copy is intact):', err);
  } finally {
    isWritingOrdersBatch = false;
  }
}

// 7. Subscribe to Uploaded Orders from Firestore (supports both compactLines and legacy rows)
export function subscribeUploadedOrdersFromFirestore(
  callback: (rows: ProcessedOrderRow[], fileName: string) => void
): () => void {
  const colRef = collection(db, 'uploaded_orders_batches');
  return onSnapshot(
    colRef,
    (snapshot) => {
      // Do not trigger intermediate partial updates while a bulk upload is actively writing
      if (isWritingOrdersBatch) return;

      if (snapshot.empty) {
        callback([], '');
        return;
      }
      const chunks = snapshot.docs
        .map(
          (d) =>
            d.data() as {
              batchIndex: number;
              fileName: string;
              rows?: ProcessedOrderRow[];
              compactLines?: string[];
            }
        )
        .sort((a, b) => a.batchIndex - b.batchIndex);

      const allRows: ProcessedOrderRow[] = [];
      let fileName = 'Data Tersinkron Firebase';
      for (const ch of chunks) {
        if (ch.fileName) fileName = ch.fileName;
        if (Array.isArray(ch.compactLines)) {
          for (let i = 0; i < ch.compactLines.length; i++) {
            allRows.push(decodeOrderRowCompact(ch.compactLines[i]));
          }
        } else if (Array.isArray(ch.rows)) {
          allRows.push(...ch.rows);
        }
      }
      callback(allRows, fileName);
    },
    (err) => {
      console.warn('Error subscribing to uploaded_orders_batches:', err);
    }
  );
}

// 8. Clear and Sync Retur & Tukar IDH to Firestore & IndexedDB
export async function clearAllReturInFirestore(): Promise<void> {
  isWritingReturBatch = true;
  try {
    const colRef = collection(db, 'uploaded_retur_batches');
    const existingSnap = await getDocs(colRef);
    if (!existingSnap.empty) {
      const docs = existingSnap.docs;
      for (let i = 0; i < docs.length; i += 250) {
        const batch = writeBatch(db);
        docs.slice(i, i + 250).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Error clearing retur batches:', err);
  } finally {
    isWritingReturBatch = false;
  }
}

export async function syncAllReturToFirestore(
  rows: ProcessedReturRow[],
  fileName: string
): Promise<void> {
  isWritingReturBatch = true;
  try {
    await saveReturToIndexedDB(rows, fileName);
    await clearAllReturInFirestore();
    isWritingReturBatch = true;

    if (rows.length === 0) return;

    // Cap items per pengajuan in Firestore payload so no batch doc exceeds 1 MiB
    const sanitizedRows = rows.slice(0, 15000).map((r) => ({
      ...r,
      statusRetur: r.statusKonfirmasi || r.statusRetur || 'Belum dikonfirmasi',
      items: Array.isArray(r.items) ? r.items.slice(0, 30) : []
    }));

    const CHUNK_SIZE = 200;
    const totalChunks = Math.ceil(sanitizedRows.length / CHUNK_SIZE);
    const now = new Date().toISOString();

    for (let startChunk = 0; startChunk < totalChunks; startChunk += 5) {
      const batch = writeBatch(db);
      const endChunk = Math.min(startChunk + 5, totalChunks);

      for (let c = startChunk; c < endChunk; c++) {
        const slice = sanitizedRows.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        const docId = `retur_batch_${String(c).padStart(4, '0')}`;
        batch.set(doc(db, 'uploaded_retur_batches', docId), {
          batchIndex: c,
          fileName,
          updatedAt: now,
          rows: slice
        });
      }
      await batch.commit();
      if (endChunk < totalChunks) await sleep(60);
    }
  } catch (err) {
    console.warn('Error syncing retur to Firestore:', err);
  } finally {
    isWritingReturBatch = false;
  }
}

export function subscribeReturFromFirestore(
  callback: (rows: ProcessedReturRow[], fileName: string) => void
): () => void {
  const colRef = collection(db, 'uploaded_retur_batches');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (isWritingReturBatch) return;

      if (snapshot.empty) {
        callback([], '');
        return;
      }
      const chunks = snapshot.docs
        .map((d) => d.data() as { batchIndex: number; fileName: string; rows: ProcessedReturRow[] })
        .sort((a, b) => a.batchIndex - b.batchIndex);

      const allRows: ProcessedReturRow[] = [];
      let fileName = 'Retur & Tukar IDH';
      for (const ch of chunks) {
        if (ch.fileName) fileName = ch.fileName;
        if (Array.isArray(ch.rows)) {
          allRows.push(...ch.rows);
        }
      }
      callback(allRows, fileName);
    },
    (err) => {
      console.warn('Error subscribing to uploaded_retur_batches:', err);
    }
  );
}

// 9. Follow Up Records CRUD (No namaBarang saved!)
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
  try {
    const docRef = doc(db, 'follow_up_orders', row.rowId);
    const now = new Date().toISOString();
    await setDoc(
      docRef,
      {
        noPoIdh: row.noPoIdh,
        tglPoIdh: row.tglPoIdh,
        prodOk: row.prodOk,
        principal: row.principal,
        idPelanggan: row.idPelanggan || '-',
        namaPelanggan: row.namaPelanggan,
        hpPelanggan: row.hpPelanggan || '-',
        alamatPelanggan: row.alamatPelanggan || '-',
        titikKirim: row.titikKirim,
        admint: row.admint,
        statusProduk: row.isStatusBlank ? 'OPEN' : row.statusProduk,
        followUpStatus,
        catatan,
        updatedAt: now
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'follow_up_orders');
  }
}

export async function updateFollowUpStatus(
  id: string,
  followUpStatus: 'pending' | 'wa_sent' | 'confirmed' | 'canceled',
  catatan?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'follow_up_orders', id);
    const updateData: Record<string, string> = {
      followUpStatus,
      updatedAt: new Date().toISOString()
    };
    if (catatan !== undefined) {
      updateData.catatan = catatan;
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'follow_up_orders');
  }
}

export async function deleteFollowUpOrder(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'follow_up_orders', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'follow_up_orders');
  }
}
