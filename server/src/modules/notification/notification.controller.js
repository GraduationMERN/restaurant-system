import Notification from "./notification.model.js";

export const getAllNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments();
  const hasMore = skip + notifications.length < total;

  res.json({
    success: true,
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      hasMore,
    },
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
