/* eslint-disable no-restricted-globals */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

if (workbox) {
  workbox.skipWaiting();
  workbox.clientsClaim();
  workbox.core.setCacheNameDetails({ prefix: 'noteList', suffix: 'msiv1' });

  // If your build injects a precache manifest, keep this line:
  workbox.precaching.precacheAndRoute(self.__precacheManifest || []);

  workbox.routing.registerRoute(
    /(\/$|\/\?.*$)/,
    workbox.strategies.networkFirst({
      cacheName: 'pages-cache',
      plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 24 * 60 * 60 })],
    })
  );

  workbox.routing.registerRoute(
    /.*woff/,
    workbox.strategies.cacheFirst({
      cacheName: 'fonts-cache',
      plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 24 * 60 * 60 })],
    })
  );
} else {
  // eslint-disable-next-line no-console
  console.log("Workbox didn't load");
}
