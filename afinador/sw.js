/* Accordatore (afinador do cifrAmem): funciona sem internet depois da primeira visita */
var CACHE = 'afinador-v15';
var FILES = ['./', 'index.html', 'pitch.js?v=7', 'capture-worklet.js?v=7', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'icone-accordatore.png', '../fonts/inter-latin-wght-normal.woff2', '../fonts/source-serif-4-latin-wght-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('afinador-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Rede primeiro (para receber atualizações); sem internet, usa a cópia guardada.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;   // contador e outros sites: direto pela rede
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    if (res && res.ok && new URL(e.request.url).origin === location.origin) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
