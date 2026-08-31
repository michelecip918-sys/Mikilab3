// Cache offline leggera (localStorage) per i dati Pro consultabili senza rete:
// ricette private/MikiLab e ultimo piano di produzione. Best-effort, mai bloccante.
const PREFIX = "mikilab_offline_";

export function cacheSet(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), data })); } catch { /* quota/private mode */ }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj && "data" in obj ? obj.data : null;
  } catch { return null; }
}

export function cacheTime(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).t || null;
  } catch { return null; }
}

// Errore di rete (offline / server irraggiungibile) vs risposta HTTP legittima (es. 401).
export function isNetworkError(e) {
  return !!e && !e.response;
}
