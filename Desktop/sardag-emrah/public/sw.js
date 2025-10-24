/**
 * SERVICE WORKER - UKal AI PWA
 *
 * Features:
 * - Push notifications
 * - Offline caching
 * - Background sync
 * - Ultra-fast performance
 */

const CACHE_VERSION = 'ukalai-v1';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/market',
  '/charts',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('ukalai-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // API requests - network only (always fresh)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request))
    );
    return;
  }

  // Everything else - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then((cached) => {
            if (cached) return cached;

            // Offline page fallback
            if (request.mode === 'navigate') {
              return caches.match('/');
            }

            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'UKal AI',
    body: 'New trading signal detected!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'trading-signal',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Signal', icon: '/icon-chart-96x96.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icon-close-96x96.png' }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/market')
    );
  } else if (event.action !== 'dismiss') {
    event.waitUntil(
      clients.openWindow('/market')
    );
  }
});

// Background sync - SCANNER SYNC
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  // Market data sync
  if (event.tag === 'sync-market-data') {
    event.waitUntil(
      fetch('/api/market/overview')
        .then((response) => response.json())
        .then((data) => {
          console.log('[SW] Market data synced');
          return data;
        })
        .catch((err) => {
          console.error('[SW] Sync failed:', err);
        })
    );
  }

  // Scanner sync - NEW!
  if (event.tag === 'scanner-sync') {
    event.waitUntil(scanAndNotify());
  }
});

// Periodic Background Sync - Chrome only
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'scanner-periodic') {
    event.waitUntil(scanAndNotify());
  }
});

// Scanner function - scans for signals and shows notifications
async function scanAndNotify() {
  try {
    console.log('[SW] 🔍 Scanning for signals...');

    const response = await fetch('/api/scanner/signals?limit=20&type=STRONG_BUY');

    if (!response.ok) {
      throw new Error(`Scanner API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[SW] Scan complete: ${data.found} signals from ${data.scanned} coins`);

    // Show notifications for found signals
    if (data.found > 0 && data.signals) {
      for (const signal of data.signals) {
        const symbolDisplay = signal.symbol.replace('USDT', '');
        const emoji = signal.signal === 'STRONG_BUY' ? '🚀' : '✅';

        await self.registration.showNotification(
          `${emoji} ${symbolDisplay} - AL SİNYALİ`,
          {
            body: `${signal.strategies}/6 Strateji • %${Math.floor(signal.confidence)} Güven\nGiriş: $${signal.entryPrice.toFixed(2)}`,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            tag: signal.symbol, // Group by symbol
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            data: {
              symbol: signal.symbol,
              url: `/market?symbol=${signal.symbol}`,
              signal: signal.signal,
              confidence: signal.confidence
            },
            actions: [
              { action: 'view', title: 'Detayları Gör', icon: '/icon-chart-96x96.png' },
              { action: 'dismiss', title: 'Kapat', icon: '/icon-close-96x96.png' }
            ]
          }
        );

        console.log(`[SW] ✅ Notification shown for ${signal.symbol}`);
      }
    }

    return data;
  } catch (error) {
    console.error('[SW] Scanner error:', error);
    return null;
  }
}

// Message event (for commands from main thread)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }
});

console.log('[SW] Service Worker loaded successfully');
