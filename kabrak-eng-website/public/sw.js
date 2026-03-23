// Service Worker - KABRAK Exchange Pro PWA
// Persiste l'URL du portal client via Cache API et redirige au lancement iOS

const CACHE_NAME = 'kabrak-url-store-v1';
const URL_CACHE_KEY = 'kabrak-upload-url';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Recevoir l'URL depuis la page et la persister dans Cache Storage
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'STORE_URL') {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(event.data.url, {
      headers: { 'Content-Type': 'text/plain' }
    });
    await cache.put(URL_CACHE_KEY, response);
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercepter la navigation vers '/' et rediriger vers l'URL stockée
  if (url.pathname === '/' && event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const stored = await cache.match(URL_CACHE_KEY);
        if (stored) {
          const portalUrl = await stored.text();
          if (portalUrl && (portalUrl.includes('/client/') || portalUrl.includes('/upload/'))) {
            return Response.redirect(portalUrl, 302);
          }
        }
        return fetch(event.request);
      })
    );
  }
});
