// Najpierw sieć (z pominięciem cache HTTP przeglądarki), cache tylko gdy offline
// albo gdy serwer nie odpowie w NETWORK_TIMEOUT. Dzięki temu zmiany widać od razu.
const CACHE = "storm-v6";
const NETWORK_TIMEOUT = 3000;
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
  // cache: "reload" omija cache HTTP (GitHub Pages trzyma pliki do 10 min)
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))));
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
      const fromCache = () => cache.match(e.request, { ignoreSearch: true });
      const network = fetch(e.request, { cache: "no-cache" }).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      });
      const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT));
      try {
        const res = await Promise.race([network, timeout]);
        if (res) return res;
        return (await fromCache()) || network; // wolna sieć: cache, a jeśli pusty, czekamy dalej
      } catch {
        return (await fromCache()) || Response.error();
      }
    })
  );
});
