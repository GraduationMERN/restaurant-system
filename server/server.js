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

  // Allow admins to join the admin room
  socket.on("joinAdmin", () => {
    socket.join("admin");
    console.log(`Socket ${socket.id} joined admin room`);
  });
  // Allow any role to join a role-specific room (e.g., 'cashier', 'kitchen')
  socket.on("joinRole", (role) => {
    if (!role) return;
    socket.join(role);
    console.log(`Socket ${socket.id} joined role room ${role}`);
    });

  // Allow users to join reward order specific room for real-time updates
  socket.on("join_reward_order", (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.join(`reward_order_${orderId}`);
      console.log(`Socket ${socket.id} joined reward order room: reward_order_${orderId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });


// Create global notification service
export const notificationService = new NotificationService(io);

// Export io instance for use in other modules
export { io };

// Start the HTTP + Socket.IO server
server.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} at http://localhost:${PORT}`);
});
