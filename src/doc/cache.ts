// This database contains only automatically acquired comparison data. It is
// separate from localStorage/config used by the original branch comparison.
export const CACHE_DATABASE = 'alt-components-runtime-v1';
const FORMAT = 4;
export interface RuntimeCache {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
  persistent: boolean;
}

export function memoryCache(): RuntimeCache {
  const records = new Map<string, unknown>();
  return {
    persistent: false,
    async get<T>(key: string) { return records.has(key) ? structuredClone(records.get(key)) as T : undefined; },
    async put(key, value) { records.set(key, structuredClone(value)); },
    async clear() { records.clear(); },
  };
}

export function browserCache(): RuntimeCache {
  const fallback = memoryCache();
  if (typeof indexedDB === 'undefined') return fallback;
  let connection: Promise<IDBDatabase> | undefined;
  const cache: RuntimeCache = {
    persistent: true,
    async get<T>(key: string) {
      try {
        const record = await transact<{ format: number; value: T }>('readonly', store => store.get(key));
        return record?.format === FORMAT ? record.value : undefined;
      } catch { cache.persistent = false; return fallback.get<T>(key); }
    },
    async put(key, value) {
      await fallback.put(key, value);
      try { await transact('readwrite', store => store.put({ format: FORMAT, value }, key)); }
      catch { cache.persistent = false; }
    },
    async clear() {
      await fallback.clear();
      // A failed clear must be visible: never pretend the next load is cold.
      await transact('readwrite', store => store.clear());
    },
  };
  function open() {
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(CACHE_DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('records');
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
      request.onerror = () => { connection = undefined; reject(request.error); };
      request.onblocked = () => { connection = undefined; reject(new Error('Кеш занят другой вкладкой')); };
    });
    return connection;
  }
  async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('records', mode);
      const request = action(transaction.objectStore('records'));
      transaction.oncomplete = () => resolve(request.result as T);
      transaction.onabort = () => reject(transaction.error || request.error);
      transaction.onerror = () => reject(transaction.error || request.error);
    });
  }
  return cache;
}
