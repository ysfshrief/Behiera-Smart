"use client";

/**
 * غلاف رفيع حول IndexedDB.
 *
 * كُتب يدويًا بدل مكتبة جاهزة لأن ما نحتاجه ثلاث عمليات فقط،
 * ولأن أي فشل (نافذة خاصة، تخزين محظور) يجب أن يُبتلع بهدوء
 * ولا يكسر الصفحة — التخزين المحلي تحسين، لا شرط للعمل.
 */

const DB_NAME = "beheira-smart";
const DB_VERSION = 1;

export type StoreName = "content" | "outbox" | "meta";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("content")) db.createObjectStore("content");
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, mode);
      const request = fn(tx.objectStore(store));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const idb = {
  get: <T,>(store: StoreName, key: string) => withStore<T>(store, "readonly", (s) => s.get(key)),
  set: (store: StoreName, key: string, value: unknown) =>
    withStore(store, "readwrite", (s) => s.put(value, key)),
  put: (store: StoreName, value: unknown) =>
    withStore(store, "readwrite", (s) => s.put(value)),
  del: (store: StoreName, key: string) =>
    withStore(store, "readwrite", (s) => s.delete(key)),
  all: <T,>(store: StoreName) => withStore<T[]>(store, "readonly", (s) => s.getAll()),
  clear: (store: StoreName) => withStore(store, "readwrite", (s) => s.clear()),
};

/** تخزين محتوى معروض حديثًا حتى يظل متاحًا دون اتصال. */
export interface CachedContent<T = unknown> {
  data: T;
  cachedAt: number;
}

export async function cacheContent(key: string, data: unknown): Promise<void> {
  await idb.set("content", key, { data, cachedAt: Date.now() } satisfies CachedContent);
}

export async function readCachedContent<T>(key: string): Promise<CachedContent<T> | null> {
  return (await idb.get<CachedContent<T>>("content", key)) ?? null;
}
