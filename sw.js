// OptiPixel Studio — Production Service Worker (PWA) v2.6
const CACHE_NAME = 'optipixel-cache-v2.6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/photo-collage.html',
  '/photo-filters.html',
  '/photo-resizer.html',
  '/passport-photo.html',
  '/background-remover.html',
  '/image-compressor.html',
  '/pdf-editor.html',
  '/pdf-compressor.html',
  '/image-to-pdf.html',
  '/pdf-to-image.html',
  '/ocr-text-scan.html',
  '/video-to-gif.html',
  '/voice-recorder.html',
  '/qr-code-generator.html',
  '/barcode-generator.html',
  '/password-generator.html',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/css/suite-nav.css',
  '/js/shared-suite.js',
  '/js/suite-nav.js',
  '/assets/logo.png',
  '/assets/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
