// OptiPixel Studio — Robust Production Service Worker v3.0
// FIX: cache.addAll() was crashing the entire SW install if ANY asset failed.
// NEW: Each asset is cached individually with try/catch so failures are isolated.

const CACHE_VERSION = 'optipixel-v3.0';

// Core assets needed for basic functionality — fetched individually, never all-or-nothing
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/suite-nav.css',
  '/js/shared-suite.js',
  '/js/suite-nav.js',
  '/assets/logo.png',
  '/manifest.json'
];

// ──────────────────────────────────────────────
// INSTALL: Cache core assets individually
// If any single asset fails, the SW still installs
// ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const results = await Promise.allSettled(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Individual asset failed — log but do NOT throw, so SW still installs
            console.warn('[SW] Failed to cache:', url, err.message);
          }
        })
      );
      // Always skip waiting so the new SW takes over immediately
      return self.skipWaiting();
    }).catch((err) => {
      // Even if caches.open fails, don't block SW install
      console.warn('[SW] Install cache open failed:', err.message);
      return self.skipWaiting();
    })
  );
});

// ──────────────────────────────────────────────
// ACTIVATE: Remove old caches, claim clients
// ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ──────────────────────────────────────────────
// FETCH: Network-first strategy
// Always try network first; fall back to cache only if offline
// This ensures users always get fresh content
// ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return; // Invalid URL — ignore
  }

  // Skip non-same-origin requests (CDNs, APIs, etc.) — let them go through normally
  if (url.origin !== location.origin) return;

  // Skip chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for offline fallback
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION)
            .then((cache) => cache.put(event.request, responseClone))
            .catch(() => {}); // Cache write failures are non-critical
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — try cache as offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // No cache either — return a minimal offline response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // For other resources (JS, CSS, images) just let it fail gracefully
          return new Response('', { status: 408, statusText: 'Network timeout' });
        });
      })
  );
});
