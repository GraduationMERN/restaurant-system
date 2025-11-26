import Notification from "./notification.model.js";

export const getAllNotifications = async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    notifications,
  });
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  res.json({
    success: true,
    notification,
  });
};
