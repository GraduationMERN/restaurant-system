import app from "./app.js";
import { env } from "./src/config/env.js";
import http from "http";
import { Server } from "socket.io";
import NotificationService from "./src/modules/notification/notification.service.js";
import { setupStaffChatSocket } from "./src/modules/staffChat/staffChat.socket.js";

const PORT = env.port;

// Create HTTP server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Consider restricting to your frontend URL in production
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Enhanced Socket.io connection handling
io.on("connection", (socket) => {


  socket.on("register", (userId) => {
    socket.join(userId);
    socket.join(`user:${userId}`); // Add prefix for consistency

  });

  // Allow admins to join the admin room
  socket.on("joinAdmin", () => {
    socket.join("admin");

  });

  // Allow any role to join a role-specific room
  socket.on("joinRole", (role) => {
    if (!role) return;
    socket.join(role);
    // console.log(`Socket ${socket.id} joined role room ${role}`);
  });

  // Kitchen-specific room for order updates
  socket.on("joinKitchen", () => {
    socket.join("kitchen");
    // console.log(`Socket ${socket.id} joined kitchen room`);
  });

  // Cashier-specific room for order updates
  socket.on("joinCashier", () => {
    socket.join("cashier");
    console.log(`[SOCKET] Cashier joined room. Socket ID: ${socket.id}`);
     });
  // Allow users to join reward order specific room for real-time updates
  socket.on("join_reward_order", (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.join(`reward_order_${orderId}`);
      // console.log(`Socket ${socket.id} joined reward order room: reward_order_${orderId}`);
    }
 

  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
  });
});
});

// Create global notification service
export const notificationService = new NotificationService(io);

// Make io and notificationService available globally for use in services
global.io = io;
global.notificationService = notificationService;

// Setup Staff Chat socket handlers
setupStaffChatSocket(io);

// Export io instance for use in other modules
export { io };

// Start the HTTP + Socket.IO server
server.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} at http://localhost:${PORT}`);
});