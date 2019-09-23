if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => registerSW());
}

function registerSW() {
  navigator.serviceWorker.register('/sw.js').then(
    registration => {
      console.info('ServiceWorker registration successful: ');
    },
    err => {
      console.error('ServiceWorker registration failed:', err);
    }
  );
}
