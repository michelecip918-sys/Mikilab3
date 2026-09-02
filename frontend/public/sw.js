const CACHE_NAME = "mikilab-v11";
// App shell essenziale: precache così l'app si apre anche senza rete (backstube senza Wi-Fi).
const SHELL = ["/", "/index.html", "/logo.png", "/manifest.json", "/wheat-bg.webp"];

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
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.url.includes("/api/")) return; // API: sempre freschi (la cache dati è in localStorage lato app)

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
      icon: "/logo.png",
      badge: "/logo.png",
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
