import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
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

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

// 设备API
export const deviceAPI = {
  getAll: (params = {}) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  getStats: (params = {}) => api.get('/devices/stats', { params }),
};

// 网络流量API
export const flowAPI = {
  getAll: (params = {}) => api.get('/flows', { params }),
  getById: (id) => api.get(`/flows/${id}`),
  getStats: (params = {}) => api.get('/flows/stats', { params }),
  getHourlyStats: (params = {}) => api.get('/flows/stats/hourly', { params }),
  getTopApplications: (params = {}) => api.get('/flows/applications', { params }),
  getTopProtocols: (params = {}) => api.get('/flows/protocols', { params }),
  getTopHosts: (params = {}) => api.get('/flows/hosts', { params }),
  getRecentFlows: (params = {}) => api.get('/flows', { params }),
};

// 过滤器API
export const filterAPI = {
  getAll: (params = {}) => api.get('/filters', { params }),
  getById: (id) => api.get(`/filters/${id}`),
  create: (data) => api.post('/filters', data),
  update: (id, data) => api.put(`/filters/${id}`, data),
  delete: (id) => api.delete(`/filters/${id}`),
};

// 路由器区域API
export const routerZoneAPI = {
  getAll: (params = {}) => api.get('/router-zones', { params }),
  getById: (id) => api.get(`/router-zones/${id}`),
  create: (data) => api.post('/router-zones', data),
  update: (id, data) => api.put(`/router-zones/${id}`, data),
  delete: (id) => api.delete(`/router-zones/${id}`),
  getStats: (params = {}) => api.get('/router-zones/stats', { params }),
  findByIdentifier: (identifier) => api.get(`/router-zones/identifier/${identifier}`),
};

// 路由器映射API
export const routerMappingAPI = {
  getAll: (params = {}) => api.get('/router-mapping', { params }),
  getStats: (params = {}) => api.get('/router-mapping/stats', { params }),
  getConfig: () => api.get('/router-mapping/config'),
  add: (data) => api.post('/router-mapping/add', data),
  remove: (mapping) => api.delete('/router-mapping/remove', { data: mapping }),
  update: (data) => api.put('/router-mapping', data),
  test: (params = {}) => api.get('/router-mapping/test', { params }),
};

// 调试API
export const debugAPI = {
  getHeaders: () => api.get('/debug-headers'),
  getJWT: () => api.get('/debug-jwt'),
};

export default api;

