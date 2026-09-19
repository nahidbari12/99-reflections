const CACHE_NAME = "99-reflections-v9";
const CORE = ["/", "/manifest.webmanifest", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then((response) => response || caches.match("/"))));
    return;
  }
  const isCode = event.request.destination === "script" || event.request.destination === "style";
  if (isCode) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); } return response; })));
});
