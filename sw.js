// ── NBO Connect Service Worker ─────────────────────────────────────────────
const CACHE_NAME = 'nbo-connect-v1';
const ASSETS = [
  './NBO-Group-App.html',
  './manifest.json',
];

// Installation : mise en cache des ressources
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', e => {
  // Ne pas intercepter les appels GitHub API
  if (e.request.url.includes('api.github.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Mettre en cache les nouvelles ressources
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors-ligne : retourner l'app principale
        return caches.match('./NBO-Group-App.html');
      });
    })
  );
});
