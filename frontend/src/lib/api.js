import axios from "axios";
import { cacheSet, cacheGet, isNetworkError } from "@/lib/offlineCache";
import { idbSet, idbGet } from "@/lib/idbCache";
import { enqueue as sqEnqueue, registerHandler as sqRegister } from "@/lib/syncQueue";

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
export const productionPinApi = {
  status: () => cachedGet("production_pin_status", () => api.get(`/production-pin/status`).then((r) => r.data)),
  set: (pin) => api.put(`/production-pin`, { pin }).then((r) => r.data),
  verify: (pin) => api.post(`/production-pin/verify`, { pin }).then((r) => r.data),
};

// Gate ADMIN del sito: PIN segreto verificato lato server (nessun default nel sorgente).
export const adminGateApi = {
  status: () => cachedGet("admin_gate_status", () => api.get(`/admin-gate/status`).then((r) => r.data)),
  set: (pin) => api.put(`/admin-gate`, { pin }).then((r) => r.data),
  verify: (pin) => api.post(`/admin-gate/verify`, { pin }).then((r) => r.data),
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
  translate: (id, lang) => api.post(`/recipes/${id}/translate`, {}, { params: { lang } }).then((r) => r.data),
  generate: (data) => api.post(`/recipes/generate`, data).then((r) => r.data),
  complete: (recipe_name, recipe_id, image_url) => api.post(`/recipe/complete`, { recipe_name, recipe_id, image_url }).then((r) => r.data),
};

export const ovenApi = {
  list: () => cachedGet("oven_profiles", () => api.get(`/oven-profiles`).then((r) => r.data)),
  create: (data) => api.post(`/oven-profiles`, data).then((r) => r.data),
  update: (id, data) => api.put(`/oven-profiles/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/oven-profiles/${id}`).then((r) => r.data),
};

export const planApi = {
  get: async () => {
    try { const r = await api.get(`/production-plan`); idbSet("production_plan", r.data); return r.data; }
    catch (e) { if (isNetworkError(e)) { const c = await idbGet("production_plan"); if (c) return c; } throw e; }
  },
  save: (data) => api.put(`/production-plan`, data).then((r) => r.data),
  order: (body) => api.post(`/lab/plan-order`, body).then((r) => r.data),
};

export const weeklyApi = {
  get: async () => {
    try { const r = await api.get(`/weekly-plan`); idbSet("weekly_plan", r.data); return r.data; }
    catch (e) { if (isNetworkError(e)) { const c = await idbGet("weekly_plan"); if (c) return c; } throw e; }
  },
  save: (data) => api.put(`/weekly-plan`, data).then((r) => r.data),
};

export const warehouseApi = {
  list: async () => {
    try {
      const r = await api.get(`/lab/warehouse`);
      idbSet("warehouse", r.data);
      return r.data;
    } catch (e) {
      if (isNetworkError(e)) { const c = await idbGet("warehouse"); if (c) return c; }
      throw e;
    }
  },
  save: (item) => api.post(`/lab/warehouse`, item).then((r) => r.data),
  remove: (id) => api.delete(`/lab/warehouse/${id}`).then((r) => r.data),
  consume: (items) => api.post(`/lab/warehouse/consume`, { items }).then((r) => r.data),
  stats: () => api.get(`/lab/warehouse/stats`).then((r) => r.data),
  consumption: () => api.get(`/lab/warehouse/consumption`).then((r) => r.data),
};

export const ordiniApi = {
  regenerate: (body) => api.post(`/lab/ordini-extra`, body).then((r) => r.data),
  scanOrder: (image_base64, lang) => api.post(`/lab/scan-order`, { image_base64, lang }).then((r) => r.data),
};

// Piano del Team (Assistente Mamo): il Capo INVIA il piano, il Floor lo legge (senza login).
// OFFLINE-READY: la coda di lavoro resta leggibile da Sitor anche senza rete (IndexedDB).
export const floorPlanApi = {
  get: async () => {
    try { const r = await api.get(`/lab/floor-plan`); idbSet("floor_plan", r.data); return r.data; }
    catch (e) { if (isNetworkError(e)) { const c = await idbGet("floor_plan"); if (c) return c; } throw e; }
  },
  push: (body) => api.put(`/lab/floor-plan`, body).then((r) => r.data),
  clear: () => api.delete(`/lab/floor-plan`).then((r) => r.data),
};

// Motore MikiLab: ordine del Capo → pianificazione a ritroso delle fasi tecniche.
// (planApi.order aggiunto sopra alla dichiarazione esistente di planApi)


export const favApi = {
  list: () => cachedGet("favorites", () => api.get(`/favorites`).then((r) => r.data)),
  toggle: (recipe_id) => api.post(`/favorites/toggle`, { recipe_id }).then((r) => r.data),
  sync: (ids) => api.post(`/favorites/sync`, { ids }).then((r) => r.data),
  counts: () => api.get(`/favorites/counts`).then((r) => r.data),
};


export const capoPlanApi = {
  // OFFLINE-READY: l'ultimo piano di produzione resta consultabile senza rete.
  get: () => api.get(`/capo/last-plan`)
    .then((r) => { if (r.data) cacheSet("capo_last_plan", r.data); return r.data; })
    .catch((e) => { if (isNetworkError(e)) { const c = cacheGet("capo_last_plan"); if (c) return c; } throw e; }),
  save: (data) => {
    cacheSet("capo_last_plan", { ...data, saved_at: new Date().toISOString() });
    return api.put(`/capo/last-plan`, data).then((r) => r.data);
  },
  clear: () => { cacheSet("capo_last_plan", null); return api.delete(`/capo/last-plan`).then((r) => r.data); },
};

export const comboApi = {
  list: () => cachedGet("combos", () => api.get(`/combos`).then((r) => r.data)),
  sync: (combos) => api.post(`/combos/sync`, { combos }).then((r) => r.data),
  remove: (id) => api.delete(`/combos/${id}`).then((r) => r.data),
};

export const plansArchiveApi = {
  list: (kind) => cachedGet(`plans_archive_${kind || "all"}`, () => api.get(`/plans/archive`, { params: kind ? { kind } : {} }).then((r) => r.data)),
  save: (data) => api.post(`/plans/archive`, data).then((r) => r.data),
  rename: (id, name) => api.patch(`/plans/archive/${id}`, { name }).then((r) => r.data),
  remove: (id) => api.delete(`/plans/archive/${id}`).then((r) => r.data),
};

export const chatApi = {
  history: (sid) => api.get(`/maestro/history/${sid}`).then((r) => r.data),
};

export const friendsApi = {
  directory: () => api.get(`/users/directory`).then((r) => r.data),
  list: () => api.get(`/friends`).then((r) => r.data),
  request: (to_id) => api.post(`/friends/request`, { to_id }).then((r) => r.data),
  respond: (from_id, action) => api.post(`/friends/respond`, { from_id, action }).then((r) => r.data),
  remove: (other_id) => api.post(`/friends/remove`, { other_id }).then((r) => r.data),
  suggestions: () => api.get(`/friends/suggestions`).then((r) => r.data.suggestions || []).catch(() => []),
};

export const challengesApi = {
  catalog: () => api.get(`/challenges/catalog`).then((r) => r.data.catalog || []).catch(() => []),
  state: () => api.get(`/challenges/state`).then((r) => r.data).catch(() => null),
  complete: (challenge_id) => api.post(`/challenges/complete`, { challenge_id }).then((r) => r.data),
  learnComplete: (path_id) => api.post(`/learn/complete`, { path_id }).then((r) => r.data),
};

export const newsItemsApi = {
  list: () => cachedGet("news_items", () => api.get(`/news-items`).then((r) => r.data)),
  create: (data) => api.post(`/news-items`, data).then((r) => r.data),
  update: (id, data) => api.put(`/news-items/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/news-items/${id}`).then((r) => r.data),
};

export const labConfigApi = {
  get: () => cachedGet("lab_config", () => api.get(`/lab-config`).then((r) => r.data)),
  save: (data) => api.put(`/lab-config`, data).then((r) => r.data),
};

export const recipeTempApi = {
  list: () => api.get(`/recipe-temp`).then((r) => r.data),
  save: (data) => api.post(`/recipe-temp`, data).then((r) => r.data),
};

export const newsApi = {
  list: () => cachedGet("news", () => api.get(`/news`).then((r) => r.data)),
};

export const newsletterApi = {
  subscribe: (email, lang, source = "home") =>
    api.post(`/newsletter/subscribe`, { email, lang, source }).then((r) => r.data),
  count: () => api.get(`/newsletter/count`).then((r) => r.data.count).catch(() => 0),
};

export const announcementsApi = {
  list: () => cachedGet("announcements", () => api.get(`/announcements`).then((r) => r.data)),
  create: (data) => api.post(`/announcements`, data).then((r) => r.data),
  update: (id, data) => api.put(`/announcements/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/announcements/${id}`).then((r) => r.data),
};

export const authApi = {
  me: () => api.get(`/auth/me`).then((r) => r.data),
  register: (data) => api.post(`/auth/register`, data).then((r) => r.data),
  login: (data) => api.post(`/auth/login`, data).then((r) => r.data),
  google: (session_id) => api.post(`/auth/google/session`, { session_id }).then((r) => r.data),
  logout: () => api.post(`/auth/logout`).then((r) => r.data),
  forgot: (email, lang) => api.post(`/auth/forgot-password`, { email, origin_url: window.location.origin, lang }).then((r) => r.data),
  reset: (token, password) => api.post(`/auth/reset-password`, { token, password }).then((r) => r.data),
  verifyEmail: (token) => api.post(`/auth/verify-email`, { token }).then((r) => r.data),
  resendVerification: (email, lang) => api.post(`/auth/resend-verification`, { email, origin_url: window.location.origin, lang }).then((r) => r.data),
};

export const adminApi = {  entitlements: () => api.get(`/admin/entitlements`).then((r) => r.data),
  grant: (email, days, tier = "lab") => api.post(`/admin/grant`, { email, days, tier }).then((r) => r.data),
  revoke: (email) => api.post(`/admin/revoke`, { email }).then((r) => r.data),
  shopSettings: () => api.get(`/admin/shop/settings`).then((r) => r.data),
  setShop: (enabled) => api.put(`/admin/shop/settings`, { enabled }).then((r) => r.data),
  shopWaitlist: () => api.get(`/admin/shop/waitlist`).then((r) => r.data),
  setSiteSettings: (data) => api.put(`/admin/site-settings`, data).then((r) => r.data),
  bakeAlongNotify: () => api.post(`/admin/bakealong/notify`).then((r) => r.data),
  sendDailyDigest: () => api.post(`/admin/send-daily-digest`).then((r) => r.data),
  bakeAlongAward: (week) => api.post(`/admin/bakealong/award`, {}, { params: week ? { week } : {} }).then((r) => r.data),
  newsletter: () => api.get(`/admin/newsletter`).then((r) => r.data),
  newsletterSend: (payload) => api.post(`/admin/newsletter/send`, payload).then((r) => r.data),
  newsletterHistory: () => api.get(`/admin/newsletter/history`).then((r) => r.data),
  emailReport: (days = 7) => api.get(`/admin/email-report`, { params: { days } }).then((r) => r.data),
  emailLogs: (days = 30) => api.get(`/admin/email-logs`, { params: { days } }).then((r) => r.data),
  socialReport: () => api.get(`/admin/social-report`).then((r) => r.data),
  socialReset: () => api.post(`/admin/social-report/reset`).then((r) => r.data),
  socialLogs: () => api.get(`/admin/social-logs`).then((r) => r.data),
};

export const siteSettingsApi = {
  get: () => cachedGet("site_settings", () => api.get(`/site-settings`).then((r) => r.data), {}),
};

export const wisdomApi = {
  approved: () => api.get(`/wisdom/approved`).then((r) => r.data).catch(() => []),
  submit: (text) => api.post(`/wisdom`, { text }).then((r) => r.data),
  like: (id) => api.post(`/wisdom/${id}/like`).then((r) => r.data),
  pending: () => api.get(`/wisdom/pending`).then((r) => r.data).catch(() => []),
  approve: (id) => api.post(`/wisdom/${id}/approve`).then((r) => r.data),
  reject: (id) => api.post(`/wisdom/${id}/reject`).then((r) => r.data),
};

export const streakApi = {
  get: () => api.get(`/streak`).then((r) => r.data).catch(() => null),
  ping: () => api.post(`/activity/ping`).then((r) => r.data).catch(() => null),
};

export const hallOfFameApi = {
  get: () => api.get(`/hall-of-fame`).then((r) => r.data).catch(() => ({ leaders: [] })),
};

export const greetingsApi = {
  check: () => api.post(`/greetings/check`).then((r) => r.data).catch(() => ({ posted: false })),
};

export const communityApi = {
  list: (scope) => api.get(`/community/posts${scope && scope !== "all" ? `?scope=${scope}` : ""}`).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/community/posts`, data).then((r) => r.data),
  like: (id) => api.post(`/community/posts/${id}/like`).then((r) => r.data),
  comment: (id, text) => api.post(`/community/posts/${id}/comments`, { text }).then((r) => r.data),
  remove: (id) => api.delete(`/community/posts/${id}`).then((r) => r.data),
  follows: () => api.get(`/community/follows`).then((r) => r.data.channels || []).catch(() => []),
  toggleFollow: (channel) => api.post(`/community/follows/${channel}`).then((r) => r.data),
  emailMode: () => api.get(`/me/channel-email`).then((r) => r.data.mode).catch(() => "instant"),
  setEmailMode: (mode) => api.put(`/me/channel-email`, { mode }).then((r) => r.data),
  stats: () => api.get(`/community/stats`).then((r) => r.data).catch(() => null),
  socialClick: (channel) => api.post(`/social/click`, { channel }).catch(() => {}),
};

export const bakeAlongApi = {
  current: (lang) => api.get(`/bakealong/current`, { params: { lang } }).then((r) => r.data).catch(() => null),
  submit: (image_url, text) => api.post(`/bakealong/submit`, { image_url, text }).then((r) => r.data),
  entries: (week) => api.get(`/bakealong/entries`, { params: week ? { week } : {} }).then((r) => r.data).catch(() => ({ entries: [] })),
  winners: () => api.get(`/bakealong/winners`).then((r) => r.data.winners || []).catch(() => []),
  like: (id) => api.post(`/community/posts/${id}/like`).then((r) => r.data),
};

export const boardApi = {
  get: () => api.get(`/board`).then((r) => r.data).catch(() => ({ message: "" })),
  set: (message) => api.post(`/board`, { message }).then((r) => r.data),
};

export const reportsApi = {
  list: () => cachedGet("reports", () => api.get(`/reports`).then((r) => r.data.items || []), []),
  save: (data) => api.post(`/reports`, data).then((r) => r.data),
};

export const bakersApi = {
  map: () => cachedGet("bakers_map", () => api.get(`/bakers/map`).then((r) => r.data), []),
  me: () => cachedGet("bakers_me", () => api.get(`/bakers/me`).then((r) => r.data), null),
  save: (data) => api.put(`/bakers/me`, data).then((r) => r.data),
  remove: () => api.delete(`/bakers/me`).then((r) => r.data),
};

export const pantryApi = {
  whatCanIMake: (data) => api.post(`/recipes/what-can-i-make`, data).then((r) => r.data),
};

export const storesApi = {
  list: () => cachedGet("stores", () => api.get(`/stores`).then((r) => r.data), []),
  create: (data) => api.post(`/stores`, data).then((r) => r.data),
  update: (id, data) => api.put(`/stores/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/stores/${id}`).then((r) => r.data),
};

export const ordersApi = {
  list: (storeId) => cachedGet(`purchase_orders_${storeId || "all"}`, () => api.get(`/purchase-orders`, { params: storeId ? { store_id: storeId } : {} }).then((r) => r.data), []),
  create: (data) => api.post(`/purchase-orders`, data).then((r) => r.data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/purchase-orders/${id}`).then((r) => r.data),
};

export const batchesApi = {
  create: (data) => api.post(`/batches`, data).then((r) => r.data),
  remove: (id) => api.delete(`/batches/${id}`).then((r) => r.data),
  publicGet: (id) => api.get(`/public/batch/${id}`).then((r) => r.data),
  start: (dough_type, kg, line) => api.post(`/batches/start`, { dough_type, kg, line }).then((r) => r.data),
  active: () => api.get(`/batches/active`).then((r) => r.data),
  close: (id) => api.post(`/batches/${id}/close`).then((r) => r.data),
};

export const shiftsApi = {
  list: (storeId) => cachedGet(`shifts_${storeId || "all"}`, () => api.get(`/shifts`, { params: storeId ? { store_id: storeId } : {} }).then((r) => r.data), []),
  create: (data) => api.post(`/shifts`, data).then((r) => r.data),
  update: (id, data) => api.put(`/shifts/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/shifts/${id}`).then((r) => r.data),
};

export const notificationsApi = {  list: () => api.get(`/notifications`).then((r) => r.data).catch(() => ({ items: [], unread: 0 })),
  markRead: () => api.post(`/notifications/read`).then((r) => r.data),
};

export const profileApi = {
  get: (userId) => api.get(`/community/profile/${userId}`).then((r) => r.data),
  update: (payload) => api.post(`/community/profile`, payload).then((r) => r.data),
};

export const dmApi = {
  send: (to_id, text, image_url) => api.post(`/community/messages`, { to_id, text, image_url }).then((r) => r.data),
  thread: (other_id) => api.get(`/community/messages/${other_id}`).then((r) => r.data).catch(() => ({ messages: [], other: null })),
  conversations: () => api.get(`/community/conversations`).then((r) => r.data.conversations || []).catch(() => []),
  react: (msg_id, emoji) => api.post(`/community/messages/${msg_id}/react`, { emoji }).then((r) => r.data).catch(() => null),
};

export const academyApi = {
  quiz: (level, lang, asked, theme) => api.post(`/academy/quiz`, { level, lang, asked, theme }).then((r) => r.data),
  weeklyTheme: (lang) => api.get(`/academy/weekly-theme`, { params: { lang } }).then((r) => r.data).catch(() => null),
  grantBadge: (badge) => api.post(`/academy/badge`, { badge }).then((r) => r.data),
  quizScore: (points = 1) => api.post(`/academy/quiz-score`, { points }).then((r) => r.data).catch(() => ({})),
  leaderboard: () => api.get(`/academy/leaderboard`).then((r) => r.data).catch(() => ({ rows: [] })),
  sosHistory: () => api.get(`/academy/sos-history`).then((r) => r.data.items || []).catch(() => []),
  sosDelete: (id) => api.delete(`/academy/sos-history/${id}`).then((r) => r.data),
  sosRecipe: (diagnosis, lang) => api.post(`/academy/sos-recipe`, { diagnosis, lang }).then((r) => r.data).catch(() => ({ recipe_id: null })),
};

export const pushApi = {
  vapid: () => api.get(`/push/vapid`).then((r) => r.data.public_key).catch(() => null),
  subscribe: (subscription) => api.post(`/push/subscribe`, { subscription }).then((r) => r.data),
  saveReminders: (steps) => api.post(`/reminders`, { steps }).then((r) => r.data).catch(() => ({})),
};

export const doughSessionsApi = {
  list: (recipeId) => cachedGet(`dough_sessions_${recipeId || "all"}`, () => api.get(`/dough-sessions`, { params: recipeId ? { recipe_id: recipeId } : {} }).then((r) => r.data), []),
  create: (data) => api.post(`/dough-sessions`, data).then((r) => r.data),
  remove: (id) => api.delete(`/dough-sessions/${id}`).then((r) => r.data),
  dayAfter: (data) => api.post(`/dough-sessions/day-after`, data).then((r) => r.data),
  aiAdvice: (data) => api.post(`/dough-sessions/ai-advice`, data).then((r) => r.data),
};

export const haccpApi = {
  list: () => cachedGet("haccp_logs", () => api.get(`/haccp-logs`).then((r) => r.data), []),
  create: (data) => api.post(`/haccp-logs`, data).then((r) => r.data),
  remove: (id) => api.delete(`/haccp-logs/${id}`).then((r) => r.data),
};

export const floursApi = {
  list: () => cachedGet("flours", () => api.get(`/flours`).then((r) => r.data.items || []), []),
  create: (data) => api.post(`/flours`, data).then((r) => r.data),
  remove: (id) => api.delete(`/flours/${id}`).then((r) => r.data),
};

export const inventoryApi = {
  get: () => cachedGet("inventory", () => api.get(`/inventory`).then((r) => r.data), { items: [] }),
  save: (items) => api.put(`/inventory`, { items }).then((r) => r.data),
  scanDrop: (image_base64, target = "warehouse") => api.post(`/inventory/scan-drop`, { image_base64, target }).then((r) => r.data),
  bindBatch: (recipe_id, batches) => api.post(`/inventory/bind-batch`, { recipe_id, batches }).then((r) => r.data),
  batchLinks: () => api.get(`/inventory/batch-links`).then((r) => r.data),
};

export const dayCloseApi = {
  close: (data) => api.post(`/day-close`, data).then((r) => r.data),
  last: () => cachedGet("day_close_last", () => api.get(`/day-close/last`).then((r) => r.data), {}),
  list: () => cachedGet("day_close_list", () => api.get(`/day-close/list`).then((r) => r.data), { closures: [] }),
  pdf: (id, lang = "it") => api.get(`/day-close/${id}/pdf`, { params: { lang }, responseType: "blob" }).then((r) => r.data),
};


export const operatorApi = {
  absence: (data) => api.post(`/operator/absence`, data).then((r) => r.data),
  createInvite: () => api.post(`/operator/invites`).then((r) => r.data),
  createDelegation: () => api.post(`/operator/delegation`).then((r) => r.data),
  listInvites: () => api.get(`/operator/invites`).then((r) => r.data),
  redeem: (code) => api.post(`/operator/redeem`, { code }).then((r) => r.data),
  getProfile: () => api.get(`/operator/profile`).then((r) => r.data),
  saveProfile: (data) => api.post(`/operator/profile`, data).then((r) => r.data),
};


// Sitor · Sesto Senso — motore proattivo del laboratorio.
export const pulseApi = {
  get: () => cachedGet("lab_pulse", () => api.get(`/lab/pulse`).then((r) => r.data),
    { mood: "sereno", heartbeat: 52, score: 100, load: 0, alerts: [], checkin: { active: false }, rest_mode: { active: false }, plan_active: false }),
  checkinGet: () => api.get(`/lab/shift/checkin`).then((r) => r.data).catch(() => ({})),
  checkin: (data) => api.post(`/lab/shift/checkin`, data).then((r) => r.data).catch((e) => {
    if (isNetworkError(e)) { sqEnqueue("shift_checkin", data); return { active: true, queued: true, ...data }; }
    throw e;
  }),
  restGet: () => cachedGet("lab_rest_mode", () => api.get(`/lab/rest-mode`).then((r) => r.data), { active: false, allow_critical: true }),
  restSet: (data) => api.put(`/lab/rest-mode`, data).then((r) => r.data),
  wakeGet: () => cachedGet("lab_wake", () => api.get(`/lab/wake`).then((r) => r.data), { enabled: true, wake_at: "04:10", first_start: "04:30", prep_minutes: 20 }),
  wakeSet: (data) => api.put(`/lab/wake`, data).then((r) => r.data),
  history: (minutes = 240) => cachedGet(`lab_pulse_history_${minutes}`, () => api.get(`/lab/pulse/history`, { params: { minutes } }).then((r) => r.data), { points: [] }),
};

// Sequence Guard — Sitor blocca i lotti fuori sequenza prima che partano.
export const shiftStateApi = {
  get: () => api.get(`/lab/shift-state`).then((r) => r.data).catch(() => ({ batches: [] })),
};
export const sequenceApi = {
  start: (batch_id, force = false) => api.post(`/lab/sequence/start`, { batch_id, force }).then((r) => r.data),
  complete: (batch_id) => api.post(`/lab/sequence/complete`, { batch_id }).then((r) => r.data),
};

// Staffing / ricalcolo volumi in base alle assenze del giorno.
export const staffingApi = {
  get: () => cachedGet("lab_staffing", () => api.get(`/lab/staffing`).then((r) => r.data), { total: 5, absent_today: 0, present: 5, factor: 1, reduce_pct: 0 }),
  set: (total) => api.put(`/lab/staffing`, { total }).then((r) => r.data),
  history: (days = 7) => cachedGet(`lab_staffing_history_${days}`, () => api.get(`/lab/staffing/history`, { params: { days } }).then((r) => r.data), { days: [], total: 5 }),
  applyVolumes: () => api.post(`/lab/staffing/apply-volumes`).then((r) => r.data),
};

// Sensori live (temperatura forno, pH lievito) condivisi col Capo.
export const sensorsApi = {
  getLive: () => api.get(`/lab/sensors/live`).then((r) => r.data).catch(() => ({})),
  publish: (data) => api.post(`/lab/sensors/live`, data).then((r) => r.data).catch(() => ({})),
};

// Production OS — comando universale, sync bilancia smart.
export const productionOsApi = {
  command: (command_text) => api.post(`/ai/universal-command`, { command_text }).then((r) => r.data),
  loadRecipeToScale: (deviceId, recipeId) => api.get(`/scale/${deviceId}/load-recipe/${recipeId}`).then((r) => r.data),
};

// Turni & Power Level — piano settimanale con aura gamificata (Dragon Ball).
export const shiftBoardApi = {
  list: () => cachedGet("shift_plan", () => api.get(`/production/shift-plan`).then((r) => r.data), { weekly_plan: [] }),
  assign: (data) => api.post(`/production/shift-assignment`, data).then((r) => r.data),
  setScore: (id, efficiency_score) => api.patch(`/production/shift-assignment/${id}`, null, { params: { efficiency_score } }).then((r) => r.data),
  remove: (id) => api.delete(`/production/shift-assignment/${id}`).then((r) => r.data),
  leaderboard: () => cachedGet("shift_leaderboard", () => api.get(`/production/leaderboard`).then((r) => r.data), { leaderboard: [] }),
};

// Briefing intelligente del mattino per il Capo.
export const briefingApi = {
  get: () => cachedGet("morning_briefing", () => api.get(`/ai/morning-briefing`).then((r) => r.data), null),
};

// Enterprise Grid — rete multi-sede (1–100 panifici) orchestrata da Sitor.
export const enterpriseApi = {
  overview: () => cachedGet("ent_overview", () => api.get(`/enterprise/overview`).then((r) => r.data), { total_active_sites: 0, global_efficiency_avg: 0, critical_alerts_count: 0, total_workers: 0 }),
  sites: () => cachedGet("ent_sites", () => api.get(`/enterprise/sites`).then((r) => r.data), { sites: [] }),
  addSite: (name) => api.post(`/enterprise/sites`, { name }).then((r) => r.data),
  delSite: (id) => api.delete(`/enterprise/sites/${id}`).then((r) => r.data),
  siteShift: (data) => api.post(`/enterprise/site-shift`, data).then((r) => r.data),
  leaderboard: () => cachedGet("ent_leaderboard", () => api.get(`/enterprise/global-leaderboard`).then((r) => r.data), { global_leaderboard: [] }),
  briefing: () => cachedGet("ent_briefing", () => api.get(`/enterprise/global-morning-briefing`).then((r) => r.data), null),
  fleetAdvice: () => cachedGet("ent_fleet", () => api.get(`/enterprise/strategic-fleet-advice`).then((r) => r.data), { fleet_recommendations: [] }),
  getLayout: (id) => api.get(`/enterprise/sites/${id}/layout`).then((r) => r.data),
  optimizeLayout: (id, data) => api.post(`/enterprise/sites/${id}/layout/optimize`, data).then((r) => r.data),
  masterCommand: (command_text, active_site_id) => api.post(`/pocket/master-command`, { command_text, active_site_id }).then((r) => r.data),
  weeklyChallenge: () => cachedGet("ent_weekly", () => api.get(`/enterprise/weekly-challenge`).then((r) => r.data), null),
  scanFloor: (site_id) => api.post(`/pocket/vision/scan-floor`, { site_id }).then((r) => r.data),
  visionScan: (site_id, image_base64) => api.post(`/enterprise/sites/${site_id}/layout/vision-scan`, { image_base64 }).then((r) => r.data),
  lineStatus: (dough_temp = 24, hydration = 65) => cachedGet(`ent_line_${dough_temp}_${hydration}`, () => api.get(`/production/line-status`, { params: { dough_temp, hydration } }).then((r) => r.data), { sectors: [] }),
  omni: () => cachedGet("ent_omni", () => api.get(`/enterprise/omni-intelligence`).then((r) => r.data), null),
};

export const climateApi = {
  timeMachine: (body) => api.post(`/climate/time-machine`, body).then((r) => r.data),
};

export const accessApi = {
  createInvite: (max_uses = 1, days = 30, note = "") => api.post(`/access/invites`, { max_uses, days, note }).then((r) => r.data),
  listInvites: () => api.get(`/access/invites`).then((r) => r.data),
  revokeInvite: (token) => api.post(`/access/invites/${encodeURIComponent(token)}/revoke`).then((r) => r.data),
};

export const delegationApi = {
  parse: (transcript, lang) => api.post(`/delegation/parse`, { transcript, lang }).then((r) => r.data),
  confirm: (proposal) => api.post(`/delegation/confirm`, { proposal }).then((r) => r.data),
  tasks: () => api.get(`/delegation/tasks`).then((r) => r.data),
  tasksByRole: (role) => api.get(`/delegation/tasks`, { params: { role } }).then((r) => r.data),
  stepDone: (task_id, order, operator = "") => api.post(`/delegation/tasks/${task_id}/step`, { order, operator }).then((r) => r.data).catch((e) => {
    if (isNetworkError(e)) { sqEnqueue("delegation_step", { task_id, order, operator }); return { queued: true, all_done: false }; }
    throw e;
  }),
  close: (task_id) => api.post(`/delegation/tasks/${task_id}/close`).then((r) => r.data),
  handoff: (lang) => api.get(`/shift/handoff`, { params: { lang } }).then((r) => r.data),
  handoffHistory: () => api.get(`/shift/handoff/history`).then((r) => r.data.items || []).catch(() => []),
  cleanlinessCheck: (task_id, image_base64) => api.post(`/delegation/tasks/${task_id}/cleanliness-check`, { image_base64 }).then((r) => r.data),
};

// Traduzione vocale in tempo reale (canali headset Bluetooth, Letz_Passive).
export const voiceApi = {
  translate: (text, target) => api.post(`/voice/translate`, { text, target }).then((r) => r.data),
};

// Aura Dragon Ball dell'operatore in base al punteggio di efficienza del turno.
export const auraApi = {
  worker: (name) => api.get(`/production/worker-aura/${encodeURIComponent(name)}`).then((r) => r.data).catch(() => null),
};

// Radar spaziale dell'impianto (solo Master) + delega caposquadra per linea prodotto.
export const plantApi = {
  radar: () => api.get(`/plant/radar`).then((r) => r.data),
  layout: () => api.get(`/plant/layout`).then((r) => r.data),
  lineLeaders: () => api.get(`/plant/line-leaders`).then((r) => r.data),
  setLeader: (line, leader) => api.post(`/plant/line-leaders`, { line, leader }).then((r) => r.data),
  leaderTasks: (leader) => api.get(`/plant/leader-tasks`, { params: { leader } }).then((r) => r.data),
};

// Governance Master-centrica via Sitor: comando vocale/testuale → esecuzione strutturale.
export const masterApi = {
  govern: (command_text, lang) => api.post(`/master/govern`, { command_text, lang }).then((r) => r.data),  sections: () => api.get(`/master/sections`).then((r) => r.data),
};

// Sitor proattivo: avvisi automatici (scorte basse, ArbZG, linee senza caposquadra).
export const mikeApi = {
  proactive: (lang) => api.get(`/mike/proactive`, { params: { lang } }).then((r) => r.data),
  autoplan: (payload) => api.post(`/mike/autoplan`, payload).then((r) => r.data),
  autoplanOptions: (payload) => api.post(`/mike/autoplan/options`, payload).then((r) => r.data),
  dispatch: (batches) => api.post(`/mike/autoplan/dispatch`, { batches }).then((r) => r.data),
  briefing: (lang) => api.get(`/mike/briefing`, { params: { lang } }).then((r) => r.data),
  floorBriefing: (role, lang) => api.get(`/mike/briefing/floor`, { params: { role, lang } }).then((r) => r.data),
  telemetry: (lang) => api.get(`/mike/telemetry`, { params: { lang } }).then((r) => r.data),
  sosRaise: (payload) => api.post(`/mike/sos`, payload).then((r) => r.data),
  sosList: (lang) => api.get(`/mike/sos`, { params: { lang } }).then((r) => r.data),
  sosAck: (id) => api.post(`/mike/sos/${id}/ack`).then((r) => r.data),
  sosHistory: (lang) => api.get(`/mike/sos/history`, { params: { lang } }).then((r) => r.data),
  sosChallenge: (lang) => api.get(`/mike/sos/challenge`, { params: { lang } }).then((r) => r.data),
  packaging: (breadTemp, lang) => api.get(`/mike/packaging`, { params: { bread_temp_c: breadTemp, lang } }).then((r) => r.data),
  suggestions: (lang) => api.get(`/mike/suggestions`, { params: { lang } }).then((r) => r.data),
  shiftReport: (lang) => api.get(`/mike/shift-report`, { params: { lang } }).then((r) => r.data),
  mikiscoreHistory: () => api.get(`/mike/mikiscore/history`).then((r) => r.data),
  autopilotGet: () => api.get(`/mike/autopilot`).then((r) => r.data),
  autopilotSet: (enabled) => api.put(`/mike/autopilot`, { enabled }).then((r) => r.data),
  maintenanceGuide: (payload) => api.post(`/mike/maintenance-guide`, payload).then((r) => r.data),
  ovenQc: (payload) => api.post(`/mike/oven-qc`, payload).then((r) => r.data),
  b2bList: () => api.get(`/mike/b2b/orders`).then((r) => r.data),
  b2bAdd: (payload) => api.post(`/mike/b2b/orders`, payload).then((r) => r.data),
  b2bDel: (id) => api.delete(`/mike/b2b/orders/${id}`).then((r) => r.data),
  b2bToPlan: () => api.post(`/mike/b2b/to-plan`).then((r) => r.data),
  b2bForecast: () => api.get(`/mike/b2b/forecast`).then((r) => r.data),
  thermalFlow: (payload) => api.post(`/mike/thermal-flow`, payload).then((r) => r.data),
  silos: () => api.get(`/mike/silos`).then((r) => r.data),
  siloMicroorder: () => api.post(`/mike/silos/microorder`).then((r) => r.data),
  siloSupplierGet: () => api.get(`/mike/silo-supplier`).then((r) => r.data),
  siloSupplierSet: (email) => api.put(`/mike/silo-supplier`, { email }).then((r) => r.data),
  heartbeat: (lang) => api.get(`/mike/heartbeat`, { params: { lang } }).then((r) => r.data),
  timeline: (lang) => api.get(`/mike/timeline`, { params: { lang } }).then((r) => r.data),
  proofing: (freeOvens) => api.get(`/mike/proofing`, { params: freeOvens != null ? { free_ovens: freeOvens } : {} }).then((r) => r.data),
  proofingSync: (freeOvens) => api.post(`/mike/proofing/sync-plan`, {}, { params: freeOvens != null ? { free_ovens: freeOvens } : {} }).then((r) => r.data),
  agv: () => api.get(`/mike/agv`).then((r) => r.data),
  carbonConfig: () => api.get(`/mike/carbon/config`).then((r) => r.data),
  carbonSetConfig: (config) => api.put(`/mike/carbon/config`, { config }).then((r) => r.data),
  carbonCompute: (payload) => api.post(`/mike/carbon/compute`, payload).then((r) => r.data),
};

// Sitor Deus — Il Cervello del Forno: legame di amicizia, orchestrazione dell'impossibile, oracolo esterno.
export const deusApi = {
  bond: (lang) => api.get(`/mike/deus/bond`, { params: { lang } }).then((r) => r.data),
  masterPlan: (payload) => api.post(`/mike/deus/master-plan`, payload).then((r) => r.data),
  ask: (payload) => api.post(`/mike/deus/ask`, payload).then((r) => r.data),
  broadcast: (payload) => api.post(`/mike/deus/broadcast`, payload).then((r) => r.data),
  capoPlan: () => api.get(`/floor/capo-plan`).then((r) => r.data),
  machines: () => api.get(`/mike/machines`).then((r) => r.data),
  machineArrival: (payload) => api.post(`/mike/machines/arrival`, payload).then((r) => r.data),
  machineCommission: (id) => api.post(`/mike/machines/${id}/commission`).then((r) => r.data),
  machineDelete: (id) => api.delete(`/mike/machines/${id}`).then((r) => r.data),
  capture: (payload) => api.post(`/mike/deus/capture`, payload).then((r) => r.data),
  productionQueue: () => api.get(`/mike/deus/production-queue`).then((r) => r.data),
  queueDone: (id) => api.post(`/mike/deus/queue/${id}/done`).then((r) => r.data),
  queueClear: () => api.post(`/mike/deus/queue/clear`).then((r) => r.data),
  shiftReport: (lang) => api.get(`/mike/shift-report`, { params: { lang } }).then((r) => r.data),
};

// Produzione (Operaio) — rapporto di fine turno + lista per il Capo.
export const floorApi = {
  submitShiftReport: (payload) => api.post(`/floor/shift-report`, payload).then((r) => r.data),
  shiftReports: () => api.get(`/floor/shift-reports`).then((r) => r.data),
};

// Pasticceria — consegne & eventi (torte, matrimoni, eventi su commessa).
export const pastryApi = {
  list: () => api.get(`/pastry/deliveries`).then((r) => r.data),
  create: (payload) => api.post(`/pastry/deliveries`, payload).then((r) => r.data),
  toggle: (id) => api.post(`/pastry/deliveries/${id}/toggle`).then((r) => r.data),
  remove: (id) => api.delete(`/pastry/deliveries/${id}`).then((r) => r.data),
};

// Volti squadra — registrati dal Capo, condivisi su tutti i tablet.
export const facesApi = {
  list: () => api.get(`/faces`).then((r) => r.data),
  save: (payload) => api.post(`/faces`, payload).then((r) => r.data),
  remove: (name) => api.delete(`/faces/${encodeURIComponent(name)}`).then((r) => r.data),
};

// Allega/Fotografa universale — Sitor estrae info da PDF o foto.
export const capoApi = {
  extract: (payload) => api.post(`/capo/extract`, payload).then((r) => r.data),
};

// Reparti indipendenti + assegnazione Capo -> Sitor
export const deptApi = {
  catalog: () => api.get(`/depts`).then((r) => r.data),
  assignment: () => api.get(`/depts/assignment`).then((r) => r.data),
  assign: (payload) => api.post(`/depts/assign`, payload).then((r) => r.data),
  assignMulti: (payload) => api.post(`/depts/assign-multi`, payload).then((r) => r.data),
  unassign: (id) => api.delete(`/depts/assign/${id}`).then((r) => r.data),
  setObjective: (payload) => api.post(`/depts/objective`, payload).then((r) => r.data),
  progress: (payload) => api.post(`/depts/progress`, payload).then((r) => r.data),
  board: () => api.get(`/depts/board`).then((r) => r.data),
  history: (days = 14) => api.get(`/depts/history`, { params: { days } }).then((r) => r.data),
  presence: () => api.get(`/depts/presence`).then((r) => r.data),
  shiftReport: () => api.get(`/depts/shift-report`).then((r) => r.data),
  templatesList: () => api.get(`/depts/templates`).then((r) => r.data),
  templateCreate: (payload) => api.post(`/depts/templates`, payload).then((r) => r.data),
  templateDelete: (tid) => api.delete(`/depts/templates/${tid}`).then((r) => r.data),
  templateApply: (tid) => api.post(`/depts/templates/${tid}/apply`).then((r) => r.data),
};

// PIN personali operatore (timbrature tracciabili) — gestiti dal Capo.
export const operatorPinsApi = {
  list: () => api.get(`/operator-pins`).then((r) => r.data),
  set: (name, pin, level) => api.put(`/operator-pins`, { name, pin, level }).then((r) => r.data),
  remove: (name) => api.delete(`/operator-pins/${encodeURIComponent(name)}`).then((r) => r.data),
  setLevel: (name, level) => api.patch(`/operator-pins/${encodeURIComponent(name)}/level`, { level }).then((r) => r.data),
  verify: (pin) => api.post(`/operator-pins/verify`, { pin }).then((r) => r.data),
};

// Sitor Maestro di Produzione — guida per-operaio adattata al livello + richieste di modifica al piano.
export const sitorFloorApi = {
  guide: (payload) => api.post(`/floor/sitor/guide`, payload).then((r) => r.data),
  changeRequest: (payload) => api.post(`/floor/sitor/change-request`, payload).then((r) => r.data),
  changeList: () => api.get(`/floor/sitor/change-requests`).then((r) => r.data),
  changeCount: () => api.get(`/floor/sitor/change-requests/count`).then((r) => r.data),
  changeDecide: (rid, decision, note) => api.post(`/floor/sitor/change-requests/${rid}/decide`, { decision, note }).then((r) => r.data),
};

// Registro accessi (tentativi PIN Master/Produzione/Operatore) — solo Capo.
export const accessLogApi = {
  list: (limit = 120) => api.get(`/access-log`, { params: { limit } }).then((r) => r.data),
};

// Scadenza cancello Master configurabile dal Capo.
export const gateConfigApi = {
  get: () => api.get(`/admin-gate/config`).then((r) => r.data),
  set: (ttl_days) => api.put(`/admin-gate/config`, { ttl_days }).then((r) => r.data),
};

// Food cost dinamico + prezzi materie prime (solo Capo).
export const foodCostApi = {
  prices: () => api.get(`/lab/ingredient-prices`).then((r) => r.data),
  setPrices: (prices) => api.put(`/lab/ingredient-prices`, { prices }).then((r) => r.data),
  compute: (payload) => api.post(`/lab/food-cost`, payload).then((r) => r.data),
};

// Controllo ambientale predittivo (lievitazione/idratazione).
export const envApi = {
  compute: (payload) => api.post(`/lab/environment`, payload).then((r) => r.data),
  weatherNow: () => api.get(`/lab/weather-now`).then((r) => r.data),
};

// Anti-Fooling · Voice-Print Liveness (frase-sfida dal vivo).
export const antifoolApi = {
  challenge: (lang) => api.get(`/antifool/challenge`, { params: { lang } }).then((r) => r.data),
  verify: (challenge_id, transcript) => api.post(`/antifool/verify`, { challenge_id, transcript }).then((r) => r.data),
  crossCheck: (payload) => api.post(`/antifool/cross-check`, payload).then((r) => r.data),
};

// Sitor Security Guardian (IP & integrità attiva).
export const securityApi = {
  report: (event, detail, path) => api.post(`/security/guardian`, { event, detail, path }).then((r) => r.data).catch(() => null),
  ownership: (lang) => api.get(`/security/ownership`, { params: { lang } }).then((r) => r.data),
  status: () => api.get(`/security/status`).then((r) => r.data),
};

// Compliance legale tedesca (ArbZG · DGUV · GDPR/DSGVO).
export const complianceApi = {
  clock: (worker, action, pin) => api.post(`/compliance/timeclock`, { worker, action, pin }).then((r) => r.data).catch(() => null),
  timelog: (worker, day) => api.get(`/compliance/timelog`, { params: { worker, day } }).then((r) => r.data),
  safety: () => api.get(`/compliance/safety`).then((r) => r.data),
  ack: (worker, doc_id) => api.post(`/compliance/safety/ack`, { worker, doc_id }).then((r) => r.data),
  privacy: (lang) => api.get(`/compliance/privacy`, { params: { lang } }).then((r) => r.data),
};

export const prooferApi = {
  sync: () => api.get(`/proofer/sync`).then((r) => r.data),
};

export const phoenixApi = {
  suggest: (dough_type, excess_kg, state, lang) => api.post(`/batch-phoenix`, { dough_type, excess_kg, state, lang }).then((r) => r.data),
};

// Handler di replay per la coda offline (bunker mode).
sqRegister("shift_checkin", (data) => api.post(`/lab/shift/checkin`, data));
sqRegister("delegation_step", ({ task_id, order, operator }) => api.post(`/delegation/tasks/${task_id}/step`, { order, operator }));

// Dual-Mode STRATEGIC — audit ricetta del Master Baker + matrice sovrana.
export const recipeAuditApi = {
  audit: (payload) => api.post(`/lab/recipe-audit`, payload).then((r) => r.data),
};
