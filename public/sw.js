const CACHE_NAME = 'proxima8-v21';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './level_manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// Force immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First with Network fallback, and aggressive caching for levels
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // If it's a level file, cache it for later offline use
        if (event.request.url.includes('/levels/')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Listen for "warm-up" message to pre-cache all levels from manifest
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'warmUp') {
    const urls = event.data.ids.map(id => `./levels/${id}.json`);
    caches.open(CACHE_NAME).then((cache) => {
      // Use a custom loop to avoid failing the whole batch if one 404s
      urls.forEach(url => {
        cache.match(url).then(match => {
          if (!match) cache.add(url).catch(err => console.warn("Failed to warm-up level:", url));
        });
      });
    });
  }
});
