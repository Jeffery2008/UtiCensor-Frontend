import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Device API
export const deviceAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  create: (deviceData) => api.post('/devices', deviceData),
  update: (id, deviceData) => api.put(`/devices/${id}`, deviceData),
  delete: (id) => api.delete(`/devices/${id}`),
  getTypes: () => api.get('/devices/types'),
  addInterface: (deviceId, interfaceData) => api.post(`/devices/${deviceId}/interfaces`, interfaceData),
};

// Filter API
export const filterAPI = {
  getAll: (params) => api.get('/filters', { params }),
  getById: (id) => api.get(`/filters/${id}`),
  create: (filterData) => api.post('/filters', filterData),
  update: (id, filterData) => api.put(`/filters/${id}`, filterData),
  delete: (id) => api.delete(`/filters/${id}`),
  getFields: () => api.get('/filters/fields'),
  getOperators: () => api.get('/filters/operators'),
  test: (id) => api.get(`/filters/${id}/test`),
};

// Network Flow API
export const flowAPI = {
  getAll: (params) => api.get('/flows', { params }),
  getById: (id) => api.get(`/flows/${id}`),
  getByFilter: (params) => api.get('/flows/filter', { params }),
  getStats: (params) => api.get('/flows/stats', { params }),
  getHourlyStats: (params) => api.get('/flows/stats/hourly', { params }),
  getApplications: () => api.get('/flows/applications'),
  getProtocols: () => api.get('/flows/protocols'),
  export: (params) => api.get('/flows/export', { params, responseType: 'blob' }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

