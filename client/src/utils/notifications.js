// Small utilities for browser notifications (works while app is open)
export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function showNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification(title, options);
    }
  } catch (e) {
    // swallow - best effort only
    // console.error('Notification error', e);
  }
}

// Send notification to service worker for PWA notifications
export function sendNotificationToSW(notificationData) {
  if ('serviceWorker' in navigator && 'controller' in navigator.serviceWorker) {
    navigator.serviceWorker.controller?.postMessage({
      type: 'SHOW_NOTIFICATION',
      data: notificationData
    });
  }
}

export function notifyRedeemed(item) {
  if (!item) return;
  const notificationData = {
    title: '🎉 Reward Redeemed!',
    body: `${item.title} has been redeemed. You'll be redirected to track your order.`,
    icon: '/icon.png',
    tag: `reward-${item._id}`,
    requireInteraction: false
  };

  showNotification(notificationData.title, notificationData);
  sendNotificationToSW(notificationData);
}

export function showStatusNotification(status, { tag = '', keepInteractiveForReady = true } = {}) {
  if (!status) return;
  let title = '';
  let message = '';

  switch (status) {
    case 'Preparing':
      title = '⏱️ Status Update: Preparing';
      message = "Your order is being prepared. We'll notify you when it's confirmed.";
      break;
    case 'Confirmed':
      title = '✅ Status Update: Confirmed';
      message = 'Your order has been confirmed! Pickup will be available soon.';
      break;
    case 'Ready':
      title = '🎉 Status Update: Ready!';
      message = 'Your reward is ready! Please come pick it up at the restaurant.';
      break;
    case 'Completed':
      title = '👏 Order Completed';
      message = 'Thank you for your order! We hope you enjoyed your reward.';
      break;
    default:
      title = '📲 Order Update';
      message = `Your order status has been updated to: ${status}`;
  }

  const notificationData = {
    body: message,
    icon: '/icon.png',
    tag: tag || `order-status-${Date.now()}`,
    requireInteraction: keepInteractiveForReady && status === 'Ready'
  };

  showNotification(title, notificationData);

  // Also send to service worker for PWA notifications
  sendNotificationToSW({
    title,
    ...notificationData
  });
}

export default {
  requestNotificationPermission,
  showNotification,
  sendNotificationToSW,
  notifyRedeemed,
  showStatusNotification
};
