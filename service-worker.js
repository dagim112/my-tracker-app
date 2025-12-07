const CACHE_NAME = 'life-optimizer-v1';
const FILES_TO_CACHE = [
  '/', // index.html
  '/index.html',
  '/manifest.json'
  // icons will be cached automatically when requested
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((resp) => {
      return resp || fetch(evt.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // put a clone in cache (fails for cross-origin)
          try { cache.put(evt.request, response.clone()); } catch(e){}
          return response;
        });
      });
    }).catch(() => caches.match('/'))
  );
});
