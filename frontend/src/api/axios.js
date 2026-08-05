import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  linkDiscord: (data) => api.post('/auth/link-discord', data),
  unlinkDiscord: () => api.delete('/auth/unlink-discord'),
  getNotifications: (params) => api.get('/auth/notifications', { params }),
  markNotificationRead: (id) => api.patch(`/auth/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/auth/notifications/read-all'),
};

export const userAPI = {
  getServers: (params) => api.get('/users/servers', { params }),
  getServer: (id) => api.get(`/users/servers/${id}`),
  getOrders: (params) => api.get('/users/orders', { params }),
  getOrder: (id) => api.get(`/users/orders/${id}`),
  getInvoices: (params) => api.get('/users/invoices', { params }),
  getCoinTransactions: (params) => api.get('/users/coins/transactions', { params }),
  getPayments: (params) => api.get('/users/payments', { params }),
  getDashboard: () => api.get('/users/dashboard'),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
};

export const orderAPI = {
  create: (data) => api.post('/orders/create', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const serverAPI = {
  getAll: (params) => api.get('/servers', { params }),
  getById: (id) => api.get(`/servers/${id}`),
  start: (id) => api.post(`/servers/${id}/start`),
  stop: (id) => api.post(`/servers/${id}/stop`),
  restart: (id) => api.post(`/servers/${id}/restart`),
  renew: (id, data) => api.post(`/servers/${id}/renew`, data),
  getConsole: (id) => api.get(`/pterodactyl/servers/${id}/console`),
};

export const coinAPI = {
  getBalance: () => api.get('/coins/balance'),
  getTransactions: (params) => api.get('/coins/transactions', { params }),
};

export const paymentAPI = {
  createIntent: (data) => api.post('/payments/create-intent', data),
  getAll: (params) => api.get('/payments', { params }),
};

export const settingsAPI = {
  getAll: (params) => api.get('/settings', { params }),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  updateBulk: (data) => api.patch('/settings/bulk', data),
};

export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  upload: (file) => api.post('/media/upload', file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/media/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  giveCoins: (id, data) => api.post(`/admin/users/${id}/coins`, data),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getServers: (params) => api.get('/admin/servers', { params }),
  suspendServer: (id) => api.post(`/admin/servers/${id}/suspend`),
  unsuspendServer: (id) => api.post(`/admin/servers/${id}/unsuspend`),
  deleteServer: (id) => api.delete(`/admin/servers/${id}`),
  getPterodactylPanels: () => api.get('/admin/pterodactyl'),
  addPterodactylPanel: (data) => api.post('/admin/pterodactyl', data),
  deletePterodactylPanel: (id) => api.delete(`/admin/pterodactyl/${id}`),
};

export default api;