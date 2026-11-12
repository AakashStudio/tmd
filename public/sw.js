// TMD - Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "TMD — The Match Date";
    const options = {
      body: data.body || "You have a new update!",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
      tag: data.tag || "tmd-notification",
      renotify: true,
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Fallback for plain text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("TMD — The Match Date", {
        body: text,
        icon: "/icons/icon-192.png",
        data: { url: "/" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
