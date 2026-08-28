const CACHE_NAME = "mikilab-v8";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.url.includes("/api/")) return; // API: sempre dati freschi
  event.respondWith(fetch(req).catch(() => caches.match(req)));
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
