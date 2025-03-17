// This service worker can be customized for eSpazza PWA

const CACHE_NAME = 'espazza-cache-v1';

// Resources to cache
const RESOURCES_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // Add other important assets here
  // '/fonts/your-font.woff2',
  // '/images/logo.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching app shell');
      await cache.addAll(RESOURCES_TO_CACHE);
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      const deletePromises = cacheKeys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key));

      await Promise.all(deletePromises);
      await self.clients.claim();
      console.log('[Service Worker] Activated and claimed clients');
    })()
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip browser extensions
  if (event.request.url.includes('/extension/')) {
    return;
  }

  // Skip Chrome-specific URLs
  if (event.request.url.includes('chrome-extension://')) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Try to get the response from the cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // If not in cache, fetch from network
      try {
        const networkResponse = await fetch(event.request);

        // Cache the response for future use if it's a successful response
        if (networkResponse.ok) {
          console.log(
            '[Service Worker] Caching new resource:',
            event.request.url
          );
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.log(
          '[Service Worker] Fetch failed; returning offline page instead.',
          error
        );

        // If the user is offline and requesting an HTML page, show an offline page
        if (event.request.headers.get('Accept').includes('text/html')) {
          // You could return a custom offline page here
          // return caches.match('/offline.html');
        }

        // Otherwise, just propagate the error
        throw error;
      }
    })()
  );
});

// Handle push notifications (if you plan to use them)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'New update from eSpazza',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'eSpazza', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
