
const CACHE_NAME = "blto-gudar-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./tulluu.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
        } catch (error) {
          console.log("Faayila kuusuu hin dandeenye:", file);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        // Yeroo interneetiin jiru faayila haaraa server irraa fudhata.
        const freshRequest = new Request(request, {
          cache: "no-store"
        });

        const response = await fetch(freshRequest);

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // Interneetiin yoo cite, faayila cache keessa jiru fayyadama.
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          const offlinePage = await caches.match("./index.html");
          if (offlinePage) return offlinePage;
        }

        return new Response(
          "Interneetiin hin jiru. Irra deebi'ii yaali.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
