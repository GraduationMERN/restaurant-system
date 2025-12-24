import axios from "axios";

// Read the base URL from .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Optional: keep the interceptor
api.interceptors.request.use((config) => {
  // Ensure cookies are sent with every request
  config.withCredentials = true;
  return config;
});
export default api;
