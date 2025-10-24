/**
 * ADVANCED SERVICE WORKER - OFFLINE-FIRST ARCHITECTURE
 *
 * UKALAI Trading Platform
 *
 * FEATURES:
 * - Multi-strategy caching (network-first, cache-first, stale-while-revalidate)
 * - Offline fallback with cached data
 * - Background sync for failed requests
 * - Periodic background sync for market data
 * - Push notifications for trading signals
 * - Request queue for offline requests
 * - Intelligent cache invalidation
 *
 * CACHE STRATEGIES:
 * 1. Network First: API calls (fresh data priority)
 * 2. Cache First: Static assets (performance priority)
 * 3. Stale While Revalidate: Market data (balance)
 * 4. Network Only: Critical operations
 *
 * WHITE-HAT:
 * - User privacy respected
 * - Transparent caching
 * - No tracking
 * - Minimal data collection
 */

const VERSION = 'v2.0.0';
const CACHE_NAME = `ukalai-${VERSION}`;
const RUNTIME_CACHE = `ukalai-runtime-${VERSION}`;
const OFFLINE_CACHE = `ukalai-offline-${VERSION}`;

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/market',
  '/charts',
  '/offline.html',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
];

// API endpoints to cache for offline access
const CACHEABLE_APIs = [
  '/api/market/overview',
  '/api/symbols',
  '/api/futures-all',
];

// Request queue for offline operations
const REQUEST_QUEUE = 'request-queue';
let offlineQueue = [];

// ════════════════════════════════════════════════════════════
// INSTALL EVENT - Cache static assets
// ════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installing Service Worker v' + VERSION);

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache offline page
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('[SW] Caching offline fallback...');
        return cache.add('/offline.html');
      }),
    ])
      .then(() => {
        console.log('[SW] ✅ Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] ❌ Installation failed:', error);
      })
  );
});

// ════════════════════════════════════════════════════════════
// ACTIVATE EVENT - Clean old caches and claim clients
// ════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Activating Service Worker v' + VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Keep only current version caches
              return name.startsWith('ukalai-') && !name.includes(VERSION);
            })
            .map((name) => {
              console.log('[SW] 🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Activation complete');
        return self.clients.claim();
      })
  );
});

// ════════════════════════════════════════════════════════════
// FETCH EVENT - Handle all network requests
// ════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (except for queueing POST for offline)
  if (request.method !== 'GET') {
    if (request.method === 'POST' || request.method === 'PUT') {
      event.respondWith(handleMutableRequest(request));
    }
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // Skip different origins (except Binance API)
  if (url.origin !== location.origin && !url.origin.includes('binance.com')) {
    return;
  }

  // Strategy selection based on request type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// ════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ════════════════════════════════════════════════════════════

/**
 * STRATEGY 1: Network First (for API calls)
 * Try network, fallback to cache, fallback to offline response
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses for offline use
    if (networkResponse.ok && CACHEABLE_APIs.some((api) => url.pathname.startsWith(api))) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] ⚠️ Network failed for API, trying cache:', url.pathname);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] ✅ Serving from cache:', url.pathname);
      return cachedResponse;
    }

    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection and no cached data available',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * STRATEGY 2: Cache First (for static assets)
 * Try cache first, fallback to network
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * STRATEGY 3: Stale While Revalidate (for navigation/HTML)
 * Serve cached immediately, update cache in background
 */
async function handleNavigation(request) {
  try {
    // Try cache first for instant response
    const cachedResponse = await caches.match(request);

    // Fetch fresh version in background
    const networkResponsePromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(RUNTIME_CACHE);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    });

    // Return cached if available, otherwise wait for network
    return cachedResponse || (await networkResponsePromise);
  } catch (error) {
    // Network failed and no cache, show offline page
    console.log('[SW] ⚠️ Navigation failed, showing offline page');
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * STRATEGY 4: Network First with Runtime Cache (for other requests)
 */
async function handleOtherRequests(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle POST/PUT requests (queue if offline)
 */
async function handleMutableRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Network failed, queue request for later
    console.log('[SW] ⏳ Queueing request for background sync:', request.url);

    // Clone request for queueing
    const requestData = {
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body: await request.clone().text(),
      timestamp: Date.now(),
    };

    offlineQueue.push(requestData);

    // Register background sync
    await self.registration.sync.register('sync-offline-requests');

    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Request queued for background sync',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(processOfflineQueue());
  }

  if (event.tag === 'sync-market-data') {
    event.waitUntil(syncMarketData());
  }
});

/**
 * Process queued offline requests
 */
async function processOfflineQueue() {
  console.log('[SW] 📤 Processing offline queue...');

  const queueCopy = [...offlineQueue];
  offlineQueue = [];

  for (const requestData of queueCopy) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: new Headers(requestData.headers),
        body: requestData.body,
      });

      if (response.ok) {
        console.log('[SW] ✅ Queued request sent successfully:', requestData.url);
      } else {
        console.log('[SW] ⚠️ Queued request failed, re-queueing:', requestData.url);
        offlineQueue.push(requestData);
      }
    } catch (error) {
      console.log('[SW] ❌ Failed to send queued request:', error);
      offlineQueue.push(requestData);
    }
  }
}

/**
 * Sync market data in background
 */
async function syncMarketData() {
  console.log('[SW] 📊 Syncing market data...');

  try {
    const response = await fetch('/api/market/overview');
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put('/api/market/overview', response);
      console.log('[SW] ✅ Market data synced');
    }
  } catch (error) {
    console.error('[SW] ❌ Market data sync failed:', error);
  }
}

// ════════════════════════════════════════════════════════════
// PERIODIC BACKGROUND SYNC (Chrome only)
// ════════════════════════════════════════════════════════════

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] ⏰ Periodic sync triggered:', event.tag);

  if (event.tag === 'market-data-sync') {
    event.waitUntil(syncMarketData());
  }
});

// ════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push notification received');

  let data = {
    title: 'UKALAI Trading',
    body: 'New trading signal detected!',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'trading-signal',
    requireInteraction: true,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(data.title, data));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Notification clicked');

  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data?.url || '/market'));
});

// ════════════════════════════════════════════════════════════
// MESSAGE HANDLING (from main thread)
// ════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('[SW] 📨 Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => cache.addAll(urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(names.map((name) => caches.delete(name)))
        )
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

// ════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════

console.log('[SW] 🚀 Service Worker loaded successfully - v' + VERSION);
console.log('[SW] 📦 Cache strategy: Offline-First Architecture');
console.log('[SW] 🔒 Privacy: Local-only, no tracking');
