import axios from "axios";

// Read the base URL from .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // This is the most important line for cookies
});
export default api;
