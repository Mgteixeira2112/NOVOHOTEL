// Hotel OS legacy service worker retirement.
//
// The application is currently deployed as a versioned Vite build on GitHub
// Pages. Caching index.html here can leave clients pointing at JavaScript
// chunks from an older deploy, which can produce a blank screen. This worker
// intentionally removes previous Hotel OS shell caches and unregisters itself.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('hotel-os-shell-'))
        .map(key => caches.delete(key)),
    );

    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});
