import pushNotificationService from '../modules/instagram/notification/pushNotification.service.js';
import { io } from '../../server.js';

/**
 * Send push + socket notifications for order status updates.
 * Best-effort; errors are logged but do not block flow.
 */
export async function sendOrderStatusNotifications(order, status) {
  if (!order) return;
  try {
    // Broadcast via Socket.IO to room for this order
    try {
      if (io && order._id) {
        io.to(`order_${order._id}`).emit('order_status_changed', {
          orderId: order._id,
          status,
          order
        });
      }
    } catch (e) {
      console.error('Socket emit failed for order status:', e);
    }

    // Send push notification to the user (if they have subscriptions)
    try {
      if (pushNotificationService && order.userId) {
        await pushNotificationService.notifyOrderStatusChange(order.userId, order, null, status);
      }
    } catch (e) {
      console.error('Push notification failed for order status:', e);
    }
  } catch (err) {
    console.error('sendOrderStatusNotifications error:', err);
  }
}

export default {
  sendOrderStatusNotifications
};
