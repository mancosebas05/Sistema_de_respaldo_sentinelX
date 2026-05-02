import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: adjuntar token ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinelx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: manejo de errores globales ────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Error de conexión con el servidor';
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('sentinelx_token');
      localStorage.removeItem('sentinelx_user');
      window.location.href = '/login';
    }

    const err = new Error(message);
    err.status = status;
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
};

// ─── Dashboard ────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ─── Policies ─────────────────────────────────────────────
export const policiesAPI = {
  getAll: (params) => api.get('/policies', { params }),
  getById: (id) => api.get(`/policies/${id}`),
  create: (data) => api.post('/policies', data),
  update: (id, data) => api.put(`/policies/${id}`, data),
  toggle: (id) => api.patch(`/policies/${id}/toggle`),
  delete: (id) => api.delete(`/policies/${id}`),
};

// ─── Backups ──────────────────────────────────────────────
export const backupsAPI = {
  getAll: (params) => api.get('/backups', { params }),
  getById: (id) => api.get(`/backups/${id}`),
  execute: (policyId) => api.post('/backups/execute', { policyId }),
  verify: (id) => api.post(`/backups/${id}/verify`),
  delete: (id) => api.delete(`/backups/${id}`),
};

// ─── Assets ───────────────────────────────────────────────
export const assetsAPI = {
  getAll: () => api.get('/assets'),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
};

// ─── Restore ──────────────────────────────────────────────
export const restoreAPI = {
  getHistory: (params) => api.get('/restore', { params }),
  initiate: (data) => api.post('/restore', data),
};

// ─── Users ────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  unlock: (id) => api.patch(`/users/${id}/unlock`),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Logs ─────────────────────────────────────────────────
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
};

// ─── Notifications ────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── Reports ──────────────────────────────────────────────
export const reportsAPI = {
  export: (params) => api.get('/reports/export', {
    params,
    responseType: 'blob',
  }),
};

export default api;