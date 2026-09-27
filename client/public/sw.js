const CACHE_NAME = 'videojet-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // For API calls: Network-first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network failed on an API GET, try cache or return offline indicator
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Mode hors-ligne actif. Vos données seront synchronisées au retour de la connexion.'
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // For static assets & navigation: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached response or fallback to root index.html for navigation
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
