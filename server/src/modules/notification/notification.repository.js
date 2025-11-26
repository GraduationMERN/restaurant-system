import Notification from "./notification.model.js";

export const NotificationRepository = {
  async create(data) {
    return await Notification.create(data);
  },

  async getUserNotifications(userId) {
    return await Notification.find({ userId }).sort("-createdAt");
  },

  async markAsRead(id) {
    return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  },

  async markAllRead(userId) {
    return await Notification.updateMany({ userId }, { isRead: true });
  }
};
