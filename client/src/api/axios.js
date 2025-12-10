import axios from "axios";

// Read the base URL from .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: BASE_URL, 
  withCredentials: true,
  // timeout: 10000,
});

// Optional: keep the interceptor
api.interceptors.response.use((response) => response);

export default api;
