import axios from "axios";

// Use Vite environment variable VITE_API_BASE_URL (must be defined in an .env file at project root)
// Vite exposes variables to client code via import.meta.env and they must start with VITE_
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Use environment variable or fallback to backend URL
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use((response) => response);

export default api;
