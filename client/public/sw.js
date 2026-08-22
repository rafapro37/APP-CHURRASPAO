self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/")));
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Pedido pronto";
  const body = data.body || "Seu pedido ja esta pronto.";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/brand/icon-192.png",
      badge: "/brand/icon-192.png",
      vibrate: [900, 250, 900, 250, 1200, 250, 1200],
      tag: data.tag || "churraspao-pedido-pronto",
      renotify: true,
      silent: false,
      timestamp: Date.now(),
      data: { url },
      requireInteraction: true,
      actions: [
        { action: "open", title: "Ver pedido" }
      ]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});
