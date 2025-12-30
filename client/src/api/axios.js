import axios from "axios";

// Read the base URL from .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Add Authorization header with access token from localStorage
api.interceptors.request.use((config) => {
  // Ensure cookies are sent with every request
  config.withCredentials = true;
  
  // Add access token from localStorage if available, but don't override existing Authorization header
  if (typeof window !== "undefined") {
    // Only add Authorization if not already set (e.g., by explicit headers in the request)
    if (!config.headers.Authorization) {
      const accessToken = window.localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  }
  return config;
});
export default api;
