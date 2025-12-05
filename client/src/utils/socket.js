import { io } from "socket.io-client";

let socket = null;

export function initSocket(serverUrl) {
  if (typeof window === "undefined") return null;
  if (!socket) {
    // Prefer Vite API base URL if provided (e.g., http://localhost:8000/)
    const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || serverUrl || null;
    let url = apiBase;
    if (!url) {
      // Fallback to current host with default port 8000
      url = `${window.location.protocol}//${window.location.hostname}:8001`;
    }
    // Ensure no trailing slash
    if (url.endsWith("/")) url = url.slice(0, -1);

    socket = io(url, { autoConnect: true });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};
