import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch a custom event to let the app know session expired
      window.dispatchEvent(new Event('session-expired'));
    }
    return Promise.reject(error);
  }
);

export const fetchProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const fetchForecast = async () => {
  const response = await api.get('/forecast');
  return response.data;
};

export const fetchEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const analyzePurchase = async (payload: any) => {
  const response = await api.post('/analyze', payload);
  return response.data;
};

export const createPurchase = async (payload: any) => {
  const response = await api.post('/purchases', payload);
  return response.data;
};

export default api;
