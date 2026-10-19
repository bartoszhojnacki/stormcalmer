// Offline: serwuj z cache od razu, w tle pobierz świeżą wersję (stale-while-revalidate).
// Nowa wersja appki pokazuje się przy kolejnym uruchomieniu.
const CACHE = "storm-v2";
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "assets/style.css",
  "assets/content.js",
  "assets/app.js",
  "assets/alpine.min.js",
  "assets/fonts/CormorantGaramond-400-latin-ext.woff2",
  "assets/fonts/CormorantGaramond-400-latin.woff2",
  "assets/fonts/CormorantGaramond-400i-latin-ext.woff2",
  "assets/fonts/CormorantGaramond-400i-latin.woff2",
  "assets/fonts/CormorantGaramond-500-latin-ext.woff2",
  "assets/fonts/CormorantGaramond-500-latin.woff2",
  "assets/fonts/Jost-300-latin-ext.woff2",
  "assets/fonts/Jost-300-latin.woff2",
  "assets/fonts/Jost-400-latin-ext.woff2",
  "assets/fonts/Jost-400-latin.woff2",
  "assets/fonts/Jost-500-latin-ext.woff2",
  "assets/fonts/Jost-500-latin.woff2",
  "assets/fonts/fonts.css",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
