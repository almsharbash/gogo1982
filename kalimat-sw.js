/* كلمات Kalimat — service worker
   غيّر رقم الإصدار أدناه كلما عدّلت أي ملف (الشعار مثلاً) ليتحدّث عند المستخدمين. */
const CACHE = "klm2-v1";
const SHELL = [
  "./",
  "index.html",
  "kalimat.webmanifest",
  "kalimat-logo.svg",
  "kalimat-icon-180.png",
  "kalimat-icon-192.png",
  "kalimat-icon-512.png",
  "kalimat-icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("klm2-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* الملفات من نفس الموقع: تُعرض من الذاكرة فوراً (حتى دون إنترنت) وتُحدَّث بالخلفية. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === "navigate") { const home = await cache.match("index.html"); if (home) return home; }
    return Response.error();
  })());
});
