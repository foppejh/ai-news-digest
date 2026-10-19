// Service worker: precache the app shell, runtime-cache digests for offline reading.
// Bump CACHE when shell files change to force an update.
const CACHE = 'ai-digest-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './vendor/marked.min.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Digest data (markdown + index.json): network-first, fall back to cache (stale-while-revalidate).
  if (url.pathname.includes('/digests/')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Shell + assets: cache-first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
