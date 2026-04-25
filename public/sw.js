const DEFAULT_PUSH_PAYLOAD = {
  title: "Los+58 SOS",
  body: "Nueva actividad de emergencia en la comunidad.",
  icon: "/icon-192.png",
  badge: "/badge-72.png",
  url: "/alertas"
};

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readPushPayload(event) {
  if (!event.data) {
    return DEFAULT_PUSH_PAYLOAD;
  }

  try {
    return {
      ...DEFAULT_PUSH_PAYLOAD,
      ...event.data.json()
    };
  } catch (_error) {
    return {
      ...DEFAULT_PUSH_PAYLOAD,
      body: event.data.text() || DEFAULT_PUSH_PAYLOAD.body
    };
  }
}

function getSafeTargetUrl(value) {
  if (typeof value !== "string") {
    return DEFAULT_PUSH_PAYLOAD.url;
  }

  if (value.startsWith("/alertas") || value.startsWith("/mapa")) {
    return value;
  }

  return DEFAULT_PUSH_PAYLOAD.url;
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const targetUrl = getSafeTargetUrl(payload.url);

  event.waitUntil(
    self.registration.showNotification(payload.title || DEFAULT_PUSH_PAYLOAD.title, {
      body: payload.body || DEFAULT_PUSH_PAYLOAD.body,
      icon: payload.icon || DEFAULT_PUSH_PAYLOAD.icon,
      badge: payload.badge || DEFAULT_PUSH_PAYLOAD.badge,
      data: {
        url: targetUrl
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = getSafeTargetUrl(event.notification.data?.url);
  const targetAbsoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) =>
        client.url.startsWith(self.location.origin)
      );

      if (existingClient) {
        existingClient.focus();
        return existingClient.navigate(targetAbsoluteUrl);
      }

      return self.clients.openWindow(targetAbsoluteUrl);
    })
  );
});
