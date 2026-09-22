const CACHE_NAME = "mikilab-v66";
const API_CACHE = "mikilab-api-v62";
const API_CACHE_MAX = 150;
// GET API cui è consentita la copia offline (network-first). MAI /sitor/*, /live*, POST.
const API_OFFLINE_ALLOW = ["/api/recipes", "/api/recipe-extras", "/api/techniques", "/api/equipment-guide", "/api/learning-path", "/api/site-pages"];
// App shell essenziale: precache così l'app si apre anche senza rete (backstube senza Wi-Fi).
const SHELL = ["/", "/index.html", "/logo.webp", "/manifest.json"];

async function trimCache(name, max) {
  try {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    if (keys.length > max) { for (const k of keys.slice(0, keys.length - max)) await cache.delete(k); }
  } catch (e) { /* */ }
}
function isOfflineApi(url) {
  try {
    const p = new URL(url).pathname;
    if (p.includes("/sitor/") || p.startsWith("/api/live") || p.startsWith("/api/done-ping")) return false;
    return API_OFFLINE_ALLOW.some((a) => p === a || p.startsWith(a + "/"));
  } catch (e) { return false; }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(SHELL).catch(() => {});
      } catch (e) { /* */ }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.url.includes("/api/")) {
    // C8: solo alcune GET API hanno copia offline (network-first, max 150). Le altre restano solo-rete.
    if (!isOfflineApi(req.url)) return;
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(API_CACHE);
            cache.put(req, fresh.clone()).catch(() => {});
            trimCache(API_CACHE, API_CACHE_MAX);
          }
          return fresh;
        } catch (e) {
          const cached = await caches.match(req);
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }

  // Network-first con popolamento cache: online serve dati aggiornati, offline serve la copia.
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && (fresh.type === "basic" || fresh.type === "default")) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Navigazione offline senza copia esatta → mostra la shell.
        if (req.mode === "navigate") {
          const shell = await caches.match("/index.html") || await caches.match("/");
          if (shell) return shell;
        }
        throw e;
      }
    })()
  );
});

// Promemoria push (timeline del coach)
self.addEventListener("push", (event) => {
  let data = { title: "MikiLab", body: "Promemoria" };
  try { if (event.data) data = event.data.json(); } catch (e) { /* */ }
  event.waitUntil(
    self.registration.showNotification(data.title || "MikiLab", {
      body: data.body || "",
      icon: "/logo.webp",
      badge: "/logo.webp",
      tag: data.tag || undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
