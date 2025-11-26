import app from "./app.js";
import { env } from "./src/config/env.js"; 
import http from "http";
import { Server } from "socket.io";
import NotificationService from "./src/modules/notification/notification.service.js";

const PORT = env.port;

// Create HTTP server
const server = http.createServer(app);

// Init Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// Each user joins a room with their userId
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });
});

// Create global notification service
export const notificationService = new NotificationService(io);

// Start the HTTP + Socket.IO server
server.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} at http://localhost:${PORT}`);
});
