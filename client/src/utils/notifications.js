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

export function notifyRedeemed(item) {
  if (!item) return;
  showNotification('🎉 Reward Redeemed!', {
    body: `${item.title} has been redeemed. You'll be redirected to track your order.`,
    icon: '/icon.png',
    tag: `reward-${item._id}`,
    requireInteraction: false
  });
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

  showNotification(title, {
    body: message,
    icon: '/icon.png',
    tag: tag || `order-status-${Date.now()}`,
    requireInteraction: keepInteractiveForReady && status === 'Ready'
  });
}

export default {
  requestNotificationPermission,
  showNotification,
  notifyRedeemed,
  showStatusNotification
};
