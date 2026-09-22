import axios from "axios";
import { cacheSet, cacheGet, isNetworkError } from "@/lib/offlineCache";
import { idbSet, idbGet } from "@/lib/idbCache";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Se la sessione admin scade, torna alla pagina normale del sito.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const d = err && err.response && err.response.data && err.response.data.detail;
    if (err && err.response && err.response.status === 401 && d === "gate_required") {
      // Solo se l'utente ERA già entrato (cookie scaduto): torna al gate. Sui nuovi
      // visitatori (flag assente) NON ricaricare, altrimenti loop infinito al primo caricamento.
      const was = (() => { try { return localStorage.getItem("mikilab_admin_unlocked") === "1"; } catch (e) { return false; } })();
      try { localStorage.removeItem("mikilab_admin_unlocked"); } catch (e) { /* */ }
      if (was && !window.__gate_reloading) { window.__gate_reloading = true; setTimeout(() => window.location.reload(), 50); }
    }
    return Promise.reject(err);
  }
);

// Cache read-through su IndexedDB: online salva l'ultima copia e ritorna il dato fresco;
// offline (errore di rete) ritorna l'ultima copia salvata così i moduli restano consultabili.
// `fallback` viene usato solo se online fallisce per motivi NON di rete e non c'è cache.
async function cachedGet(key, requestFn, fallback) {
  try {
    const data = await requestFn();
    idbSet(key, data);
    return data;
  } catch (e) {
    if (isNetworkError(e)) {
      const c = await idbGet(key);
      if (c !== null && c !== undefined) return c;
    }
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

export const uploadApi = {
  // Uploads a Blob/File to the dedicated image archive, returns absolute URL.
  image: async (blob, filename = "foto.jpg") => {
    const fd = new FormData();
    fd.append("file", blob, filename);
    const r = await api.post(`/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return `${BACKEND_URL}${r.data.url}`;
  },
};

export const recipesApi = {
  // Resiliente + OFFLINE-READY: online salva l'archivio su IndexedDB (grande, affidabile)
  // e una copia leggera su localStorage; offline restituisce la cache IndexedDB così le
  // ricette restano 100% consultabili senza rete.
  list: async (collection, includeMine = false) => {
    const params = { collection_name: collection };
    if (includeMine) params.include_mine = true;
    const cacheKey = includeMine ? `recipes_${collection}_mine` : `recipes_${collection}`;
    try {
      const r = await api.get(`/recipes`, { params });
      cacheSet(cacheKey, r.data);      // best-effort (piccolo/veloce)
      idbSet(cacheKey, r.data);         // archivio completo (IndexedDB)
      return r.data;
    } catch (e) {
      if (isNetworkError(e)) {
        const fromIdb = await idbGet(cacheKey);
        if (fromIdb) return fromIdb;
        const c = cacheGet(cacheKey);
        if (c) return c;
      }
      return [];
    }
  },
  create: (data) => api.post(`/recipes`, data).then((r) => r.data),
  update: (id, data) => api.put(`/recipes/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/recipes/${id}`).then((r) => r.data),
  promote: (id) => api.post(`/recipes/${id}/promote`).then((r) => r.data),
  translate: (id, lang) => api.post(`/recipes/${id}/translate`, {}, { params: { lang } }).then((r) => r.data),
  importCatalog: () => api.post(`/recipes/import-catalog`).then((r) => r.data),
};

export const favApi = {
  list: () => cachedGet("favorites", () => api.get(`/favorites`).then((r) => r.data)),
  toggle: (recipe_id) => api.post(`/favorites/toggle`, { recipe_id }).then((r) => r.data),
  sync: (ids) => api.post(`/favorites/sync`, { ids }).then((r) => r.data),
  counts: () => api.get(`/favorites/counts`).then((r) => r.data),
};


export const authApi = {
  me: () => api.get(`/auth/me`).then((r) => r.data),
  login: (data) => api.post(`/auth/login`, data).then((r) => r.data),
  logout: () => api.post(`/auth/logout`).then((r) => r.data),
  forgot: (email, lang) => api.post(`/auth/forgot-password`, { email, origin_url: window.location.origin, lang }).then((r) => r.data),
  reset: (token, password) => api.post(`/auth/reset-password`, { token, password }).then((r) => r.data),
  changePassword: (current_password, new_password, lang) => api.post(`/auth/change-password`, { current_password, new_password, lang }).then((r) => r.data),
};

export const siteSettingsApi = {
  get: () => cachedGet("site_settings", () => api.get(`/site-settings`).then((r) => r.data), {}),
};

export const floursApi = {
  list: () => cachedGet("flours", () => api.get(`/flours`).then((r) => r.data.items || []), []),
  create: (data) => api.post(`/flours`, data).then((r) => r.data),
  remove: (id) => api.delete(`/flours/${id}`).then((r) => r.data),
};
