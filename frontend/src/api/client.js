import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('darkauth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('darkauth_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('darkauth_token', data.accessToken);
          localStorage.setItem('darkauth_refresh', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('darkauth_token');
          localStorage.removeItem('darkauth_refresh');
          localStorage.removeItem('darkauth_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ===== AUTH =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', { refreshToken: token }),
  me: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
};

// ===== APPS =====
export const appsAPI = {
  list: () => api.get('/apps'),
  get: (id) => api.get(`/apps/${id}`),
  create: (data) => api.post('/apps', data),
  update: (id, data) => api.put(`/apps/${id}`, data),
  delete: (id) => api.delete(`/apps/${id}`),
  stats: (id) => api.get(`/apps/${id}/stats`),
  regenerateSecret: (id) => api.post(`/apps/${id}/regenerate-secret`),
};

// ===== LICENSES =====
export const licensesAPI = {
  list: (params) => api.get('/licenses', { params }),
  create: (data) => api.post('/licenses', data),
  bulkCreate: (data) => api.post('/licenses/bulk', data),
  verify: (data) => api.post('/licenses/verify', data),
  ban: (id) => api.put(`/licenses/${id}/ban`),
  unban: (id) => api.put(`/licenses/${id}/unban`),
  delete: (id) => api.delete(`/licenses/${id}`),
};

// ===== CLIENT =====
export const clientAPI = {
  activate: (data) => api.post('/client/activate', data),
  verifyActivation: (data) => api.post('/client/verify-activation', data),
  latestVersion: (appId) => api.get(`/client/latest-version/${appId}`),
  checkUpdate: (params) => api.get('/client/check-update', { params }),
  listVersions: (appDbId) => api.get(`/client/versions/${appDbId}`),
  createVersion: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val);
    });
    return api.post('/client/versions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteVersion: (id) => api.delete(`/client/versions/${id}`),
};

// ===== DASHBOARD =====
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

// ===== LOGS =====
export const logsAPI = {
  list: (params) => api.get('/logs', { params }),
};

// ===== CLOUD VARIABLES =====
export const variablesAPI = {
  list: (appId) => api.get('/variables', { params: { appId } }),
  create: (data) => api.post('/variables', data),
  delete: (id) => api.delete(`/variables/${id}`),
};

// ===== BLACKLIST =====
export const blacklistAPI = {
  list: () => api.get('/blacklist'),
  add: (data) => api.post('/blacklist', data),
  remove: (id) => api.delete(`/blacklist/${id}`),
};

// ===== WEBHOOKS =====
export const webhooksAPI = {
  list: (appId) => api.get('/webhooks', { params: { appId } }),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  test: (id) => api.post(`/webhooks/test/${id}`),
};

// ===== APP USERS =====
export const appUsersAPI = {
  list: (appId) => api.get('/app-users', { params: { appId } }),
  ban: (id, isBanned, banReason) => api.put(`/app-users/${id}/ban`, { isBanned, banReason }),
  delete: (id) => api.delete(`/app-users/${id}`),
};

// ===== V2 / CLIENT PORTAL API =====
export const v2API = {
  init: (data) => api.post('/v2/init', data),
  license: (data) => api.post('/v2/license', data),
  getVar: (data) => api.post('/v2/var/get', data),
  check: (data) => api.post('/v2/check', data),
};

export default api;

