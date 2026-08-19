import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

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
  list: (collection) => api.get(`/recipes`, { params: { collection_name: collection } }).then((r) => r.data),
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

export const announcementsApi = {
  list: () => api.get(`/announcements`).then((r) => r.data),
  create: (data) => api.post(`/announcements`, data).then((r) => r.data),
  update: (id, data) => api.put(`/announcements/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/announcements/${id}`).then((r) => r.data),
};
