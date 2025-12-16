import { io } from "socket.io-client";

let socket = null;

export function initSocket(serverUrl) {
  if (typeof window === "undefined") return null;
  if (!socket) {
    const url = serverUrl || import.meta.env.VITE_API_BASE_URL;
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
