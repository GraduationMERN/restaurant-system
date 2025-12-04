// Register service worker for PWA notifications
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Request notification permission from user
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Send a push notification (client-side)
export function sendNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Use service worker for background notifications
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/images/logo/logo-icon.svg',
          badge: '/images/logo/logo-icon.svg',
          ...options
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/images/logo/logo-icon.svg',
        ...options
      });
    }
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BG5l3K7z8v-x2y9w_q4r5s-t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n'
      )
    });

    // Send subscription to backend
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
      credentials: 'include'
    });

    console.log('Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
