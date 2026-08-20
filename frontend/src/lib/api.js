import axios from "axios";

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

export const recipesApi = {
  // Resiliente: se una collezione è protetta (es. 'personal' per utenti anonimi → 401),
  // ritorna [] invece di far fallire l'intero Promise.all e svuotare anche le ricette pubbliche.
  list: (collection) => api.get(`/recipes`, { params: { collection_name: collection } }).then((r) => r.data).catch(() => []),
  create: (data) => api.post(`/recipes`, data).then((r) => r.data),
  update: (id, data) => api.put(`/recipes/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/recipes/${id}`).then((r) => r.data),
};

export const ovenApi = {
  list: () => api.get(`/oven-profiles`).then((r) => r.data),
  create: (data) => api.post(`/oven-profiles`, data).then((r) => r.data),
  update: (id, data) => api.put(`/oven-profiles/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/oven-profiles/${id}`).then((r) => r.data),
};

export const planApi = {
  get: () => api.get(`/production-plan`).then((r) => r.data),
  save: (data) => api.put(`/production-plan`, data).then((r) => r.data),
};

export const weeklyApi = {
  get: () => api.get(`/weekly-plan`).then((r) => r.data),
  save: (data) => api.put(`/weekly-plan`, data).then((r) => r.data),
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
};

export const subscriptionApi = {
  status: () => api.get(`/subscription/status`).then((r) => r.data),
  checkout: (plan) => api.post(`/subscription/checkout`, { plan, origin_url: window.location.origin }).then((r) => r.data),
  trial: (hours) => api.post(`/trial/activate`, { hours }).then((r) => r.data),
};

export const adminApi = {
  entitlements: () => api.get(`/admin/entitlements`).then((r) => r.data),
  grant: (email, days) => api.post(`/admin/grant`, { email, days }).then((r) => r.data),
  revoke: (email) => api.post(`/admin/revoke`, { email }).then((r) => r.data),
};
