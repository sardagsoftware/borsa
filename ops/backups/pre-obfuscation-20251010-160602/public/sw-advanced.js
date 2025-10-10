/**
 * 🚀 AiLydian Ultra Pro - Advanced Service Worker
 * Phase O: PWA & Offline Support
 *
 * Features:
 * - Multiple caching strategies (Network First, Cache First, Stale-While-Revalidate)
 * - Route-based caching (Phase M integration)
 * - Dynamic asset caching (Phase L lazy loading integration)
 * - Offline fallback support
 * - Background sync
 * - Push notifications
 * - Cache versioning and cleanup
 * - Security validations
 *
 * @version 3.0.0
 * @author LyDian AI Platform
 */

// ============================
// CONFIGURATION
// ============================

const SW_VERSION = '3.0.0';
const CACHE_VERSION = '20251008';

// Cache names
const CACHE_NAMES = {
  STATIC: `ailydian-static-v${CACHE_VERSION}`,
  DYNAMIC: `ailydian-dynamic-v${CACHE_VERSION}`,
  IMAGES: `ailydian-images-v${CACHE_VERSION}`,
  CSS: `ailydian-css-v${CACHE_VERSION}`,      // Phase M integration
  JS: `ailydian-js-v${CACHE_VERSION}`,         // Phase L integration
  FONTS: `ailydian-fonts-v${CACHE_VERSION}`,
  API: `ailydian-api-v${CACHE_VERSION}`
};

// Static assets to precache (only essential files to avoid errors)
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',

  // Core CSS (Phase M - common CSS)
  '/css/global-lydian-branding.css',
  '/css/animated-logo.css',

  // Core JS (Phase N - i18n system)
  '/js/auto-locale-detector.js',
  '/js/locale-engine.js',
  '/js/lydian-master-init.js',

  // Phase L - Lazy loader (need this for dynamic loading)
  '/js/lazy-loader.js',
  '/js/route-loader.js',

  // Phase M - CSS route loader
  '/js/css-route-loader.js'
];

// Cache configuration
const CACHE_CONFIG = {
  maxAgeSeconds: {
    static: 365 * 24 * 60 * 60,  // 1 year
    css: 30 * 24 * 60 * 60,       // 30 days
    js: 30 * 24 * 60 * 60,        // 30 days
    images: 90 * 24 * 60 * 60,    // 90 days
    api: 5 * 60,                  // 5 minutes
    dynamic: 24 * 60 * 60         // 1 day
  },
  maxEntries: {
    images: 50,
    css: 30,
    js: 50,
    api: 20,
    dynamic: 100
  }
};

// Network timeout for network-first strategies
const NETWORK_TIMEOUT = 3000; // 3 seconds

// Security: Allowed origins
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net',
  'https://cdnjs.cloudflare.com'
];

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Check if URL is from allowed origin
 */
function isAllowedOrigin(url) {
  const urlObj = new URL(url);
  return ALLOWED_ORIGINS.some(origin => urlObj.origin === origin);
}

/**
 * Check if response is valid for caching
 */
function isValidResponse(response) {
  return response &&
         response.status === 200 &&
         (response.type === 'basic' || response.type === 'cors');
}

/**
 * Check if request should skip cache
 */
function shouldSkipCache(request) {
  const url = new URL(request.url);

  // Skip sensitive endpoints
  if (url.pathname.includes('/auth') ||
      url.pathname.includes('/login') ||
      url.pathname.includes('/logout') ||
      url.pathname.includes('/admin')) {
    return true;
  }

  // Skip POST/PUT/DELETE requests
  if (request.method !== 'GET') {
    return true;
  }

  return false;
}

/**
 * Get appropriate cache name for request
 */
function getCacheName(request) {
  const url = new URL(request.url);

  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return CACHE_NAMES.IMAGES;
  }

  if (url.pathname.match(/\.css$/i) || url.pathname.includes('/css/')) {
    return CACHE_NAMES.CSS;
  }

  if (url.pathname.match(/\.js$/i) || url.pathname.includes('/js/')) {
    return CACHE_NAMES.JS;
  }

  if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/i)) {
    return CACHE_NAMES.FONTS;
  }

  if (url.pathname.includes('/api/')) {
    return CACHE_NAMES.API;
  }

  return CACHE_NAMES.DYNAMIC;
}

/**
 * Cleanup old cache entries (LRU-style)
 */
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries
    const entriesToDelete = keys.length - maxEntries;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Check if cached response is expired
 */
function isCacheExpired(cachedResponse, maxAge) {
  if (!cachedResponse) return true;

  const dateHeader = cachedResponse.headers.get('date');
  if (!dateHeader) return false;

  const cachedTime = new Date(dateHeader).getTime();
  const now = Date.now();

  return (now - cachedTime) > (maxAge * 1000);
}

// ============================
// CACHING STRATEGIES
// ============================

/**
 * Strategy: Cache First (Static assets)
 * Try cache first, fallback to network
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (isValidResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return offline page for HTML requests
    if (request.destination === 'document') {
      return cache.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Strategy: Network First (API requests, dynamic content)
 * Try network first, fallback to cache
 */
async function networkFirst(request, cacheName, timeout = NETWORK_TIMEOUT) {
  const cache = await caches.open(cacheName);

  try {
    // Race network request against timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

    if (isValidResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed or timed out, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Network failed, serving from cache:', request.url);
      return cachedResponse;
    }

    // No cache, return offline page for documents
    if (request.destination === 'document') {
      return cache.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Strategy: Stale While Revalidate (CSS, JS, Images)
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request).then(response => {
    if (isValidResponse(response)) {
      cache.put(request, response.clone());

      // Cleanup old entries
      const maxEntries = CACHE_CONFIG.maxEntries[cacheName.split('-')[1]?.toLowerCase()];
      if (maxEntries) {
        cleanupCache(cacheName, maxEntries);
      }
    }
    return response;
  }).catch(error => {
    console.warn('[SW] Background fetch failed:', error);
  });

  // If we have cached response and it's not expired, return it immediately
  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }

  // If cache is expired or missing, wait for network
  return fetchPromise || cachedResponse || cache.match('/offline.html');
}

/**
 * Strategy: Network Only (Sensitive requests)
 * Always fetch from network, never cache
 */
async function networkOnly(request) {
  return fetch(request);
}

// ============================
// SERVICE WORKER EVENTS
// ============================

/**
 * Install Event - Precache static assets
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then(cache => {
        console.log('[SW] Precaching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] ✅ Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[SW] ❌ Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}...`);

  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete caches that don't match current version
            const isCurrentCache = Object.values(CACHE_NAMES).includes(cacheName);
            if (!isCurrentCache) {
              console.log('[SW] 🗑️  Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all pages immediately
      self.clients.claim()
    ])
    .then(() => {
      console.log('[SW] ✅ Activation complete');
    })
  );
});

/**
 * Fetch Event - Handle all network requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and disallowed origins
  if (!isAllowedOrigin(request.url)) {
    return;
  }

  if (shouldSkipCache(request)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Determine strategy based on request type
  const cacheName = getCacheName(request);

  // Strategy selection
  if (cacheName === CACHE_NAMES.STATIC) {
    // Static assets: Cache First
    event.respondWith(cacheFirst(request, cacheName));
  }
  else if (cacheName === CACHE_NAMES.API) {
    // API requests: Network First with short timeout
    event.respondWith(networkFirst(request, cacheName, 2000));
  }
  else if (cacheName === CACHE_NAMES.CSS ||
           cacheName === CACHE_NAMES.JS ||
           cacheName === CACHE_NAMES.IMAGES) {
    // CSS, JS, Images: Stale While Revalidate
    const maxAge = CACHE_CONFIG.maxAgeSeconds[cacheName.split('-')[1]?.toLowerCase()];
    event.respondWith(staleWhileRevalidate(request, cacheName, maxAge));
  }
  else {
    // Dynamic content: Network First
    event.respondWith(networkFirst(request, cacheName));
  }
});

/**
 * Message Event - Handle messages from pages
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] 🗑️  All caches cleared');
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: SW_VERSION, cacheVersion: CACHE_VERSION });
      break;

    case 'CACHE_URLS':
      if (payload && Array.isArray(payload.urls)) {
        caches.open(CACHE_NAMES.DYNAMIC).then(cache => {
          return cache.addAll(payload.urls);
        }).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      }
      break;
  }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push notification received');

  let notificationData = {
    title: 'AiLydian Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: Math.random()
      },
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/favicon.ico'
        }
      ]
    })
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️  Notification clicked');
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Background Sync Event
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implement your sync logic here
      Promise.resolve()
    );
  }
});

// ============================
// INITIALIZATION
// ============================

console.log(`🚀 AiLydian Ultra Pro Service Worker v${SW_VERSION} loaded`);
console.log(`📦 Cache version: ${CACHE_VERSION}`);
console.log(`🔒 Security: Active | ✅ PWA Ready`);
