import { ProcessedOrderRow, ProcessedReturRow } from '../types';

const DB_NAME = 'CekOrderIDHLookup_LargeCacheDB';
const DB_VERSION = 1;
const STORE_ORDERS = 'orders_store';
const STORE_RETUR = 'retur_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak didukung di browser ini'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        db.createObjectStore(STORE_ORDERS);
      }
      if (!db.objectStoreNames.contains(STORE_RETUR)) {
        db.createObjectStore(STORE_RETUR);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveOrdersToIndexedDB(
  rows: ProcessedOrderRow[],
  fileName: string
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, 'readwrite');
      const store = tx.objectStore(STORE_ORDERS);
      store.clear();
      store.put({ rows, fileName, updatedAt: Date.now() }, 'current_orders');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB saveOrders warning:', err);
  }
}

export async function loadOrdersFromIndexedDB(): Promise<{
  rows: ProcessedOrderRow[];
  fileName: string;
} | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ORDERS, 'readonly');
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.get('current_orders');
      req.onsuccess = () => {
        db.close();
        const res = req.result;
        if (res && Array.isArray(res.rows) && res.rows.length > 0) {
          resolve({ rows: res.rows, fileName: res.fileName || 'Data CSV Tersimpan' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}

export async function clearOrdersInIndexedDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ORDERS, 'readwrite');
      tx.objectStore(STORE_ORDERS).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch (err) {
    // ignore
  }
}

export async function saveReturToIndexedDB(
  rows: ProcessedReturRow[],
  fileName: string
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RETUR, 'readwrite');
      const store = tx.objectStore(STORE_RETUR);
      store.clear();
      store.put({ rows, fileName, updatedAt: Date.now() }, 'current_retur');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch (err) {
    console.warn('IndexedDB saveRetur warning:', err);
  }
}

export async function loadReturFromIndexedDB(): Promise<{
  rows: ProcessedReturRow[];
  fileName: string;
} | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RETUR, 'readonly');
      const store = tx.objectStore(STORE_RETUR);
      const req = store.get('current_retur');
      req.onsuccess = () => {
        db.close();
        const res = req.result;
        if (res && Array.isArray(res.rows) && res.rows.length > 0) {
          resolve({ rows: res.rows, fileName: res.fileName || 'Retur & Tukar IDH' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}
