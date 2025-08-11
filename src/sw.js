/* eslint-disable no-restricted-globals */
import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {NetworkFirst, StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {clientsClaim} from 'workbox-core';

// Injected at build
precacheAndRoute(self.__WB_MANIFEST);

// Take control ASAP
self.skipWaiting();
clientsClaim();

// HTML pages (SPA shell): network-first
registerRoute(
  ({request}) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({maxAgeSeconds: 24 * 60 * 60, purgeOnQuotaError: true})],
  })
);

// JS & CSS: stale-while-revalidate
registerRoute(
  ({request}) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [new ExpirationPlugin({maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60, purgeOnQuotaError: true})],
  })
);

// Fonts: cache-first
registerRoute(
  ({request}) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true})],
  })
);

// Images: cache-first
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true})],
  })
);

// Optional: allow page to trigger activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
