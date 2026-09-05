// Cache offline robusta su IndexedDB per l'ARCHIVIO RICETTE (grande, multilingua).
// A differenza di localStorage (~5MB, sincrono) IndexedDB regge decine di MB.
// API best-effort: non lancia mai, degrada in silenzio se IDB non è disponibile.
const DB_NAME = "mikilab-offline";
const STORE = "kv";
let _dbp = null;

function openDB() {
  if (_dbp) return _dbp;
  _dbp = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === "undefined") { reject(new Error("no-idb")); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
  return _dbp;
}

export async function idbSet(key, data) {
  try {
    const d = await openDB();
    await new Promise((res, rej) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ t: Date.now(), data }, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
    return true;
  } catch { return false; }
}

export async function idbGet(key) {
  try {
    const d = await openDB();
    return await new Promise((res) => {
      const tx = d.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => res(rq.result ? rq.result.data : null);
      rq.onerror = () => res(null);
    });
  } catch { return null; }
}

export async function idbTime(key) {
  try {
    const d = await openDB();
    return await new Promise((res) => {
      const tx = d.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => res(rq.result ? rq.result.t : null);
      rq.onerror = () => res(null);
    });
  } catch { return null; }
}
