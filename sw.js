const CACHE = "chit-tracker-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/"]))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(e.request, resClone));
      return res;
    }).catch(() => cached))
  );
});
