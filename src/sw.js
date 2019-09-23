importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);

  workbox.skipWaiting();
  workbox.clientsClaim();
  workbox.core.setCacheNameDetails({
    prefix: 'noteList',
    suffix: 'msiv1'
  });

  workbox.precaching.precacheAndRoute(self.__precacheManifest);

  workbox.routing.registerRoute(
    /(\/$|\/\?.*$)/,
    workbox.strategies.networkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 1 * 24 * 60 * 60 // 1 Days
        })
      ]
    })
  );

  //API Calls
  // workbox.routing.registerRoute(/.*\/my_api\/v1.*/, workbox.strategies.staleWhileRevalidate({
  //   cacheName: 'apis-cache',
  //   plugins: [
  //     new workbox.expiration.Plugin({
  //       maxAgeSeconds: 1 * 24 * 60 * 60 // 1 Days
  //     })
  //   ]
  // }));

  workbox.routing.registerRoute(
    /.*woff/,
    workbox.strategies.cacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 1 * 24 * 60 * 60 // 1 Days
        })
      ]
    })
  );
} else {
  console.log(` Workbox didn't load`);
}