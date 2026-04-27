var CACHE_NAME = 'hamada-cp-v3';
var urlsToCache = [
  './hamada-cp.html',
  './cp-styles.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for API calls, cache first for assets
  if (e.request.url.includes('supabase.co') || e.request.url.includes('api.telegram.org')) {
    e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
  } else {
    e.respondWith(
      caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          return resp;
        });
      })
    );
  }
});
