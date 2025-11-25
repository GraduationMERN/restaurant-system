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
        this.io.to("admin").emit("notification", notification);
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