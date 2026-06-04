const CACHE = 'flight-analyzer-v3';
const ASSETS = ['./flight_analyzer.html', './flight_analyzer_manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first for HTML/JSON so updates show immediately; cache fallback for offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAppShell = /\.html?$|\.json$|\.js$/.test(url.pathname);
  if (isAppShell) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch(_){} });
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./flight_analyzer.html')))
    );
  } else {
    // Other assets (fonts, plotly CDN): cache-first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch(_){} });
        return resp;
      }))
    );
  }
});
