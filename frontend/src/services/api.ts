import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

export const fetchProfile = async (userId: string) => {
  const response = await api.get(`/profile/${userId}`);
  return response.data;
};

export const fetchForecast = async (userId: string) => {
  const response = await api.get(`/forecast/${userId}`);
  return response.data;
};

export const fetchEvents = async (userId: string) => {
  const response = await api.get(`/events/${userId}`);
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
