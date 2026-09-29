import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vj_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Audit & Diagnostic log for all API calls
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const errorData = error.response?.data?.error || error.response?.data?.message || error.message;

    console.warn(`[NEXORA API ${method} ${url} HTTP ${status || 'ERR_CONN'}]:`, errorData);

    if (status === 401) {
      localStorage.removeItem('vj_token');
      localStorage.removeItem('vj_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
