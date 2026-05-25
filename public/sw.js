const CACHE = 'mayla-v3';
const PRECACHE = ['/', '/login', '/discover'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/socket.io')) return;
  if (url.pathname.startsWith('/_next/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/')),
      ),
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Mayla', body: 'You have a new notification' };
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Mayla', {
      body: data.body ?? '',
      icon: '/pwa-icons?size=192',
      badge: '/pwa-icons?size=192',
    }),
  );
});
