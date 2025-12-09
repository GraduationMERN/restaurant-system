// Service Worker for PWA notifications
const CACHE_NAME = 'restaurant-v1';

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Restaurant Order Update',
    body: 'Your order has been updated',
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'order-notification',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data || {},
      actions: [
        {
          action: 'open',
          title: 'View Order'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get notification data
  const data = event.notification.data;
  const urlToOpen = data.url || '/orders';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if any window is already open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no matching window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fetch event for offline support
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // For HTML requests, try network first, then cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline and no cache, return simple offline page
          return new Response('You are offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
    return;
  }

  // For API requests, try network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // API calls fail when offline - don't cache them
          return new Response('Network request failed', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

  // For static assets (js, css, images), use cache first then network
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // **FIX:** Return a simple fallback Response instead of null
        return new Response('Asset unavailable', {
          status: 404,
          statusText: 'Not Found'
        });
        // OR, to let the request fail completely, you can re-throw the error:
        // throw new Error('Asset fetch failed');
      })
  );
});
