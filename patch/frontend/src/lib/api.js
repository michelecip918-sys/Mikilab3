import axios from "axios";
import { cacheSet, cacheGet, isNetworkError } from "@/lib/offlineCache";
import { idbSet, idbGet } from "@/lib/idbCache";
import { registerHandler as sqRegister } from "@/lib/syncQueue";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Cancello server hard: se il token firmato manca/scade, torna alla schermata PIN iniziale.
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

// PIN Produzione UNICO (globale): impostato dal Capo, verificato dal Floor di Sitor.
// Gate ADMIN del sito: PIN segreto verificato lato server (nessun default nel sorgente).
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
  generate: (data) => api.post(`/recipes/generate`, data).then((r) => r.data),
  complete: (recipe_name, recipe_id, image_url) => api.post(`/recipe/complete`, { recipe_name, recipe_id, image_url }).then((r) => r.data),
  course: (id, lang = "it") => cachedGet(`recipe_course_${id}_${lang}`, () => api.get(`/recipes/${id}/course`, { params: { lang } }).then((r) => r.data)),
  importCatalog: () => api.post(`/recipes/import-catalog`).then((r) => r.data),
};

export const planApi = {
  get: async () => {
    try { const r = await api.get(`/production-plan`); idbSet("production_plan", r.data); return r.data; }
    catch (e) { if (isNetworkError(e)) { const c = await idbGet("production_plan"); if (c) return c; } throw e; }
  },
  save: (data) => api.put(`/production-plan`, data).then((r) => r.data),
  order: (body) => api.post(`/lab/plan-order`, body).then((r) => r.data),
};

// Badge risparmio crediti (Direzione): modello economico + cache.
// Piano del Team (Assistente Mamo): il Capo INVIA il piano, il Floor lo legge (senza login).
// OFFLINE-READY: la coda di lavoro resta leggibile da Sitor anche senza rete (IndexedDB).
// Motore MikiLab: ordine del Capo → pianificazione a ritroso delle fasi tecniche.
// (planApi.order aggiunto sopra alla dichiarazione esistente di planApi)


export const favApi = {
  list: () => cachedGet("favorites", () => api.get(`/favorites`).then((r) => r.data)),
  toggle: (recipe_id) => api.post(`/favorites/toggle`, { recipe_id }).then((r) => r.data),
  sync: (ids) => api.post(`/favorites/sync`, { ids }).then((r) => r.data),
  counts: () => api.get(`/favorites/counts`).then((r) => r.data),
};


export const authApi = {
  me: () => api.get(`/auth/me`).then((r) => r.data),
  register: (data) => api.post(`/auth/register`, data).then((r) => r.data),
  login: (data) => api.post(`/auth/login`, data).then((r) => r.data),
  google: (session_id) => api.post(`/auth/google/session`, { session_id }).then((r) => r.data),
  logout: () => api.post(`/auth/logout`).then((r) => r.data),
  forgot: (email, lang) => api.post(`/auth/forgot-password`, { email, origin_url: window.location.origin, lang }).then((r) => r.data),
  reset: (token, password) => api.post(`/auth/reset-password`, { token, password }).then((r) => r.data),
  changePassword: (current_password, new_password, lang) => api.post(`/auth/change-password`, { current_password, new_password, lang }).then((r) => r.data),
  verifyEmail: (token) => api.post(`/auth/verify-email`, { token }).then((r) => r.data),
  resendVerification: (email, lang) => api.post(`/auth/resend-verification`, { email, origin_url: window.location.origin, lang }).then((r) => r.data),
};

export const siteSettingsApi = {
  get: () => cachedGet("site_settings", () => api.get(`/site-settings`).then((r) => r.data), {}),
};

export const floursApi = {
  list: () => cachedGet("flours", () => api.get(`/flours`).then((r) => r.data.items || []), []),
  create: (data) => api.post(`/flours`, data).then((r) => r.data),
  remove: (id) => api.delete(`/flours/${id}`).then((r) => r.data),
};

// Sitor · Sesto Senso — motore proattivo del laboratorio.
// Sequence Guard — Sitor blocca i lotti fuori sequenza prima che partano.
// Staffing / ricalcolo volumi in base alle assenze del giorno.
// Sensori live (temperatura forno, pH lievito) condivisi col Capo.
// Production OS — comando universale, sync bilancia smart.
// Turni & Power Level — piano settimanale con aura gamificata (Dragon Ball).
// Briefing intelligente del mattino per il Capo.
// Enterprise Grid — rete multi-sede (1–100 panifici) orchestrata da Sitor.
// COORDINAMENTO AUTOMATICO DEL TEAM — copertura reparti in tempo reale.
// SITOR APPRENDISTA — due info pratiche per ricetta (pezzi per teglia + come formare).
// M2: sito pubblico senza account → dopo il primo 404 non richiamare più l'endpoint.
// Traduzione vocale in tempo reale (canali headset Bluetooth, Letz_Passive).
// Aura Dragon Ball dell'operatore in base al punteggio di efficienza del turno.
// Radar spaziale dell'impianto (solo Master) + delega caposquadra per linea prodotto.
// Governance Master-centrica via Sitor: comando vocale/testuale → esecuzione strutturale.
// Sitor proattivo: avvisi automatici (scorte basse, ArbZG, linee senza caposquadra).
// Sitor Deus — Il Cervello del Forno: legame di amicizia, orchestrazione dell'impossibile, oracolo esterno.
// Produzione (Operaio) — rapporto di fine turno + lista per il Capo.
// Pasticceria — consegne & eventi (torte, matrimoni, eventi su commessa).
// Pizzeria — pannello dedicato "Servizio & Panetti".
// Volti squadra — registrati dal Capo, condivisi su tutti i tablet.
// Allega/Fotografa universale — Sitor estrae info da PDF o foto.
// Reparti indipendenti + assegnazione Capo -> Sitor
// PIN personali operatore (timbrature tracciabili) — gestiti dal Capo.
// Sitor Maestro di Produzione — guida per-operaio adattata al livello + richieste di modifica al piano.
// Sitor su misura (Atelier del Capo): Sitor crea widget su richiesta e li ricorda per-Capo.
// Registro accessi (tentativi PIN Master/Produzione/Operatore) — solo Capo.
// Scadenza cancello Master configurabile dal Capo.
// Food cost dinamico + prezzi materie prime (solo Capo).
// Controllo ambientale predittivo (lievitazione/idratazione).
// Anti-Fooling · Voice-Print Liveness (frase-sfida dal vivo).
// Sitor Security Guardian (IP & integrità attiva).
// Compliance legale tedesca (ArbZG · DGUV · GDPR/DSGVO).
// Celle & Freezer unificati (per reparto).
// Handler di replay per la coda offline (bunker mode).
sqRegister("shift_checkin", (data) => api.post(`/lab/shift/checkin`, data));
sqRegister("delegation_step", ({ task_id, order, operator }) => api.post(`/delegation/tasks/${task_id}/step`, { order, operator }));
sqRegister("worker_action", ({ operator, action, task_id, step_order }) => api.post(`/worker/task-action`, { operator, action, task_id, step_order }));

// Dual-Mode STRATEGIC — audit ricetta del Master Baker + matrice sovrana.
// Multi-azienda: elenco/creazione/switch/rinomina delle aziende del Capo.
// Inviti operaio via link (Capo genera; operaio riscatta con nome + PIN).