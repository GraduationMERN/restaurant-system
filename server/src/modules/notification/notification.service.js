import  { NotificationRepository }  from "./notification.repository.js";

class NotificationService {
    constructor(io) {
      this.io = io;
    }
  
    sendToUser(userId, title, message, type = "system", orderId = null) {
      if (!this.io) return;
  
      this.io.to(userId.toString()).emit("notification", {
        title,
        message,
        type,
        orderId,
        createdAt: new Date()
      });
  
      return NotificationRepository.create({
        userId,
        title,
        message,
        type,
        orderId
      });
    }
  
    sendAnnouncement(title, message) {
      if (!this.io) return;
  
      this.io.emit("announcement", { title, message, createdAt: new Date() });
  
      return NotificationRepository.create({
        title,
        message,
        type: "announcement"
      });
    }
    async sendToAdmin(notification) {
      if (!this.io) return null;

      // Persist admin notification for listing and mark-as-read features
      try {
        const created = await NotificationRepository.create({
          ...notification,
          // admin-wide notifications have no userId
          userId: null,
        });

        // Emit created notification (with _id and createdAt) to admin room
        this.io.to("admin").emit("notification", created);
        return created;
      } catch (e) {
        console.error("Failed to persist admin notification", e);
        return null;
      }
    }
  
    getUserNotifications(userId) {
      return NotificationRepository.getUserNotifications(userId);
    }
  
    markAsRead(id) {
      return NotificationRepository.markAsRead(id);
    }
  
    markAllRead(userId) {
      return NotificationRepository.markAllRead(userId);
    }
  }
  
  export default NotificationService;