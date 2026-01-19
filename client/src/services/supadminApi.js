import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/supadmin' });

const attach = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const supadminApi = {
  attach,
  getDashboardStats: () => api.get('/dashboard'),
  getRestaurants: (params) => api.get('/restaurants', { params }),
  getRestaurant: (id) => api.get(`/restaurants/${id}`),
  createRestaurant: (data) => api.post('/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/restaurants/${id}`, data),
  suspendRestaurant: (id) => api.post(`/restaurants/${id}/suspend`),
  activateRestaurant: (id) => api.post(`/restaurants/${id}/activate`),
  getSubscriptions: () => api.get('/subscriptions'),
  getUsers: () => api.get('/users'),
  getAnalytics: () => api.get('/analytics'),
};

export default supadminApi;
