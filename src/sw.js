/* eslint-disable no-restricted-globals */

// === Workbox v3 (classic) ===
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

// If Workbox didn't load, bail early (prevents runtime errors)
if (!self.workbox) {
  // eslint-disable-next-line no-console
  console.log("Workbox didn't load");
} else {
  const { workbox } = self;

  // Take control immediately on update
  workbox.skipWaiting();
  workbox.clientsClaim();

  // Optional: set custom cache names
  workbox.core.setCacheNameDetails({
    prefix: 'noteList',
    suffix: 'msiv1',
    precache: 'precache',
    runtime: 'runtime',
  });

  // ---- Precache (safe even when nothing injected) ----
  // If your build doesn't inject __precacheManifest, ensure it's an array
  self.__precacheManifest = self.__precacheManifest || [];
  workbox.precaching.precacheAndRoute(self.__precacheManifest);

  // ---- Runtime routes ----

  // 1) App shell / HTML pages (network-first)
  workbox.routing.registerRoute(
    // Requests that look like navigation to your SPA root or with query
    /(\/$|\/\?.*$)/,
    workbox.strategies.networkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 24 * 60 * 60, // 1 day
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 2) JS & CSS (stale-while-revalidate)
  workbox.routing.registerRoute(
    /.*\.(?:js|css)$/,
    workbox.strategies.staleWhileRevalidate({
      cacheName: 'assets-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 3) Fonts (cache-first)
  workbox.routing.registerRoute(
    /.*\.(?:woff2?|ttf|otf|eot)$/,
    workbox.strategies.cacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 4) Images (cache-first)
  workbox.routing.registerRoute(
    /.*\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/,
    workbox.strategies.cacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // 5) Example: API calls (uncomment if needed)
  // workbox.routing.registerRoute(
  //   /\/api\/.*$/,
  //   workbox.strategies.networkFirst({
  //     cacheName: 'api-cache',
  //     networkTimeoutSeconds: 5,
  //     plugins: [
  //       new workbox.expiration.Plugin({
  //         maxEntries: 100,
  //         maxAgeSeconds: 24 * 60 * 60,
  //         purgeOnQuotaError: true,
  //       }),
  //     ],
  //   })
  // );

  // Optional: listen for skipWaiting messages
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}
