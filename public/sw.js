const CACHE_NAME = 'mueve-cancun-v2';
const OFFLINE_URL = '/';

// Assets to pre-cache on install
const PRE_CACHE = [
  '/',
  '/mapa',
  '/rutas',
  '/alertas',
  '/boletos',
  '/rewards',
  '/notificaciones',
  '/agente',
  '/dashboard',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE).catch(() => {
        // Silently fail if some routes can't be cached
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API requests
  if (event.request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname && !url.href.includes('tile.openstreetmap.org')) return;

  // OpenStreetMap tiles — cache first
  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(
      caches.open('map-tiles-v1').then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const resp = await fetch(event.request).catch(() => null);
        if (resp && resp.ok) cache.put(event.request, resp.clone());
        return resp || new Response('', { status: 503 });
      })
    );
    return;
  }

  // App shell — network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp && resp.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, resp.clone()));
        }
        return resp;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.message || 'Nueva alerta de transporte',
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦜</text></svg>",
    badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚌</text></svg>",
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'Ver alerta' },
      { action: 'close', title: 'Cerrar' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MueveCancún', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action !== 'close') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});
