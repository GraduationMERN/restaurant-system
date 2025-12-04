import webpush from 'web-push';
import Subscription from './subscription.model.js';
import { env } from '../../config/env.js';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@restaurant.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId, notification) {
    try {
      const subscriptions = await Subscription.find({
        userId,
        active: true
      });

      if (!subscriptions.length) {
        console.log(`No active subscriptions found for user ${userId}`);
        return;
      }

      const notificationPayload = JSON.stringify(notification);

      // Send to all subscriptions
      const promises = subscriptions.map(sub => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };

        return webpush
          .sendNotification(subscription, notificationPayload)
          .catch(error => {
            console.error('Push notification error:', error);
            // Mark subscription as inactive if endpoint is invalid
            if (error.statusCode === 410) {
              return Subscription.updateOne(
                { endpoint: sub.endpoint },
                { active: false }
              );
            }
          });
      });

      await Promise.allSettled(promises);
      console.log(`Push notification sent to ${subscriptions.length} devices for user ${userId}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send notification when order is created
   */
  async notifyOrderCreated(userId, orderData) {
    const notification = {
      title: 'Order Confirmed! 🎉',
      body: `Your order #${orderData.orderNumber || orderData._id.toString().slice(-6)} has been received`,
      tag: `order-${orderData._id}`,
      data: {
        url: `/orders/${orderData._id}`,
        orderId: orderData._id.toString(),
        orderStatus: 'pending'
      }
    };

    await this.sendToUser(userId, notification);
  }

  /**
   * Send notification when order status changes
   */
  async notifyOrderStatusChange(userId, orderData, oldStatus, newStatus) {
    const statusMessages = {
      pending: 'Your order is being prepared ⏳',
      ready: 'Your order is ready for pickup! 🎯',
      completed: 'Your order has been completed ✅',
      cancelled: 'Your order has been cancelled ❌',
      processing: 'Your order is being processed 👨‍🍳'
    };

    const notification = {
      title: 'Order Status Update',
      body: statusMessages[newStatus] || `Order status: ${newStatus}`,
      tag: `order-${orderData._id}`,
      data: {
        url: `/orders/${orderData._id}`,
        orderId: orderData._id.toString(),
        orderStatus: newStatus
      }
    };

    await this.sendToUser(userId, notification);
  }

  /**
   * Send notification for rewards earned
   */
  async notifyRewardEarned(userId, points, totalPoints) {
    const notification = {
      title: 'Reward Points Earned! ⭐',
      body: `You earned ${points} points! Total: ${totalPoints} points`,
      tag: `reward-${Date.now()}`,
      data: {
        url: '/rewards',
        points
      }
    };

    await this.sendToUser(userId, notification);
  }

  /**
   * Send notification for review reminder
   */
  async notifyReviewReminder(userId, orderData) {
    const notification = {
      title: 'How was your order? 📝',
      body: 'Share your feedback and help us improve',
      tag: `review-${orderData._id}`,
      data: {
        url: `/reviews/new?orderId=${orderData._id}`,
        orderId: orderData._id.toString()
      }
    };

    await this.sendToUser(userId, notification);
  }
}

export default new PushNotificationService();
