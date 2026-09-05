import axios from "axios";
import { cacheSet, cacheGet, isNetworkError } from "@/lib/offlineCache";
import { idbSet, idbGet } from "@/lib/idbCache";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

export const uploadApi = {
  // Uploads a Blob/File to the dedicated image archive, returns absolute URL.
  image: async (blob, filename = "foto.jpg") => {
    const fd = new FormData();
    fd.append("file", blob, filename);
    const r = await api.post(`/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return `${BACKEND_URL}${r.data.url}`;
  },
};

// PIN Produzione UNICO (globale): impostato dal Capo, verificato dal Floor di Mohamed.
export const productionPinApi = {
  status: () => api.get(`/production-pin/status`).then((r) => r.data),
  set: (pin) => api.put(`/production-pin`, { pin }).then((r) => r.data),
  verify: (pin) => api.post(`/production-pin/verify`, { pin }).then((r) => r.data),
};

export const recipesApi = {
  // Resiliente + OFFLINE-READY: online salva l'archivio su IndexedDB (grande, affidabile)
  // e una copia leggera su localStorage; offline restituisce la cache IndexedDB così le
  // ricette restano 100% consultabili senza rete.
  list: async (collection) => {
    try {
      const r = await api.get(`/recipes`, { params: { collection_name: collection } });
      cacheSet(`recipes_${collection}`, r.data);      // best-effort (piccolo/veloce)
      idbSet(`recipes_${collection}`, r.data);         // archivio completo (IndexedDB)
      return r.data;
    } catch (e) {
      if (isNetworkError(e)) {
        const fromIdb = await idbGet(`recipes_${collection}`);
        if (fromIdb) return fromIdb;
        const c = cacheGet(`recipes_${collection}`);
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
  list: () => api.get(`/oven-profiles`).then((r) => r.data),
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
// OFFLINE-READY: la coda di lavoro resta leggibile da Mohamed anche senza rete (IndexedDB).
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
  list: () => api.get(`/favorites`).then((r) => r.data),
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
  list: () => api.get(`/combos`).then((r) => r.data),
  sync: (combos) => api.post(`/combos/sync`, { combos }).then((r) => r.data),
  remove: (id) => api.delete(`/combos/${id}`).then((r) => r.data),
};

export const plansArchiveApi = {
  list: (kind) => api.get(`/plans/archive`, { params: kind ? { kind } : {} }).then((r) => r.data),
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
  list: () => api.get(`/news-items`).then((r) => r.data),
  create: (data) => api.post(`/news-items`, data).then((r) => r.data),
  update: (id, data) => api.put(`/news-items/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/news-items/${id}`).then((r) => r.data),
};

export const labConfigApi = {
  get: () => api.get(`/lab-config`).then((r) => r.data),
  save: (data) => api.put(`/lab-config`, data).then((r) => r.data),
};

export const recipeTempApi = {
  list: () => api.get(`/recipe-temp`).then((r) => r.data),
  save: (data) => api.post(`/recipe-temp`, data).then((r) => r.data),
};

export const newsApi = {
  list: () => api.get(`/news`).then((r) => r.data),
};

export const newsletterApi = {
  subscribe: (email, lang, source = "home") =>
    api.post(`/newsletter/subscribe`, { email, lang, source }).then((r) => r.data),
  count: () => api.get(`/newsletter/count`).then((r) => r.data.count).catch(() => 0),
};

export const announcementsApi = {
  list: () => api.get(`/announcements`).then((r) => r.data),
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
  get: () => api.get(`/site-settings`).then((r) => r.data).catch(() => ({})),
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
  list: () => api.get(`/reports`).then((r) => r.data.items || []).catch(() => []),
  save: (data) => api.post(`/reports`, data).then((r) => r.data),
};

export const bakersApi = {
  map: () => api.get(`/bakers/map`).then((r) => r.data).catch(() => []),
  me: () => api.get(`/bakers/me`).then((r) => r.data).catch(() => null),
  save: (data) => api.put(`/bakers/me`, data).then((r) => r.data),
  remove: () => api.delete(`/bakers/me`).then((r) => r.data),
};

export const pantryApi = {
  whatCanIMake: (data) => api.post(`/recipes/what-can-i-make`, data).then((r) => r.data),
};

export const storesApi = {
  list: () => api.get(`/stores`).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/stores`, data).then((r) => r.data),
  update: (id, data) => api.put(`/stores/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/stores/${id}`).then((r) => r.data),
};

export const ordersApi = {
  list: (storeId) => api.get(`/purchase-orders`, { params: storeId ? { store_id: storeId } : {} }).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/purchase-orders`, data).then((r) => r.data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/purchase-orders/${id}`).then((r) => r.data),
};

export const batchesApi = {
  create: (data) => api.post(`/batches`, data).then((r) => r.data),
  remove: (id) => api.delete(`/batches/${id}`).then((r) => r.data),
  publicGet: (id) => api.get(`/public/batch/${id}`).then((r) => r.data),
};

export const shiftsApi = {
  list: (storeId) => api.get(`/shifts`, { params: storeId ? { store_id: storeId } : {} }).then((r) => r.data).catch(() => []),
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
  list: (recipeId) => api.get(`/dough-sessions`, { params: recipeId ? { recipe_id: recipeId } : {} }).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/dough-sessions`, data).then((r) => r.data),
  remove: (id) => api.delete(`/dough-sessions/${id}`).then((r) => r.data),
  dayAfter: (data) => api.post(`/dough-sessions/day-after`, data).then((r) => r.data),
  aiAdvice: (data) => api.post(`/dough-sessions/ai-advice`, data).then((r) => r.data),
};

export const haccpApi = {
  list: () => api.get(`/haccp-logs`).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/haccp-logs`, data).then((r) => r.data),
  remove: (id) => api.delete(`/haccp-logs/${id}`).then((r) => r.data),
};

export const floursApi = {
  list: () => api.get(`/flours`).then((r) => r.data.items || []).catch(() => []),
  create: (data) => api.post(`/flours`, data).then((r) => r.data),
  remove: (id) => api.delete(`/flours/${id}`).then((r) => r.data),
};

export const inventoryApi = {
  get: () => api.get(`/inventory`).then((r) => r.data).catch(() => ({ items: [] })),
  save: (items) => api.put(`/inventory`, { items }).then((r) => r.data),
};

export const dayCloseApi = {
  close: (data) => api.post(`/day-close`, data).then((r) => r.data),
  last: () => api.get(`/day-close/last`).then((r) => r.data).catch(() => ({})),
  list: () => api.get(`/day-close/list`).then((r) => r.data).catch(() => ({ closures: [] })),
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
