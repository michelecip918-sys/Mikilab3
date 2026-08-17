import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

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
