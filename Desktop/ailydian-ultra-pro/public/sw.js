// AiLydian Enterprise Service Worker
// Version 1.0.0

const CACHE_NAME = 'ailydian-enterprise-v1.0.0';
const STATIC_CACHE_NAME = 'ailydian-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'ailydian-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/enterprise-index.html',
  '/search.html',
  '/docs.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  // Add critical CSS and JS files
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// API endpoints to cache dynamically
const API_CACHE_PATTERNS = [
  /^\/api\/health$/,
  /^\/api\/status$/,
  /^\/api\/models$/,
  /^\/api\/languages$/,
  /^\/api\/translate\/ui\//
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        console.log('Service Worker: Dynamic cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('ailydian-')) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except fonts and CDN)
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com') &&
      !url.hostname.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Strategy 1: Cache First for static assets
    if (STATIC_ASSETS.some(asset => pathname.includes(asset)) ||
        pathname.includes('/fonts/') ||
        pathname.includes('/icons/') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg')) {

      return await cacheFirst(request, STATIC_CACHE_NAME);
    }

    // Strategy 2: Network First for API calls with dynamic caching
    if (pathname.startsWith('/api/')) {
      return await networkFirstWithCache(request);
    }

    // Strategy 3: Stale While Revalidate for HTML pages
    if (pathname === '/' ||
        pathname.endsWith('.html') ||
        pathname.includes('search') ||
        pathname.includes('docs')) {

      return await staleWhileRevalidate(request);
    }

    // Default: Network only
    return await fetch(request);

  } catch (error) {
    console.error('Service Worker: Fetch failed:', error);
    return await handleOffline(request);
  }
}

// Caching Strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Cache First failed:', error);
    throw error;
  }
}

async function networkFirstWithCache(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only cache specific API endpoints
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));

  try {
    const response = await fetch(request);

    if (response.ok && shouldCache) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    if (shouldCache) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.error('Background fetch failed:', error);
  });

  // Return cached version immediately if available
  if (cached) {
    fetchPromise; // Continue background update
    return cached;
  }

  // Wait for network if no cached version
  return await fetchPromise;
}

async function handleOffline(request) {
  const url = new URL(request.url);

  // Try to find cached version
  const caches_to_try = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

  for (const cacheName of caches_to_try) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
  }

  // Offline fallback for HTML pages
  if (request.headers.get('Accept')?.includes('text/html')) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AiLydian - Offline</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
          .offline-content {
            max-width: 400px;
            padding: 2rem;
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.1rem;
            opacity: 0.9;
            line-height: 1.6;
          }
          .retry-btn {
            margin-top: 2rem;
            padding: 0.75rem 2rem;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
          }
          .retry-btn:hover {
            background: rgba(255,255,255,0.3);
          }
        </style>
      </head>
      <body>
        <div class="offline-content">
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>
            AiLydian Enterprise requires an internet connection to access AI services.
            Please check your connection and try again.
          </p>
          <button class="retry-btn" onclick="window.location.reload()">
            Retry Connection
          </button>
        </div>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }

  // Offline fallback for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }

  // Default offline response
  return new Response('Offline', { status: 503 });
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync tasks
      syncOfflineActions()
    );
  }
});

async function syncOfflineActions() {
  try {
    // Clear old caches
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
      name.startsWith('ailydian-') &&
      name !== STATIC_CACHE_NAME &&
      name !== DYNAMIC_CACHE_NAME
    );

    await Promise.all(
      oldCaches.map(cacheName => caches.delete(cacheName))
    );

    // Refresh critical data
    const criticalEndpoints = ['/api/health', '/api/status', '/api/models'];
    const cache = await caches.open(DYNAMIC_CACHE_NAME);

    await Promise.all(
      criticalEndpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            await cache.put(endpoint, response);
          }
        } catch (error) {
          console.warn('Failed to sync:', endpoint, error);
        }
      })
    );

    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Push notifications (if needed)
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'AiLydian Enterprise', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCriticalCache());
  }
});

async function updateCriticalCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const endpoints = ['/api/health', '/api/status'];

    await Promise.all(
      endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            await cache.put(endpoint, response);
          }
        } catch (error) {
          console.warn('Periodic sync failed for:', endpoint);
        }
      })
    );
  } catch (error) {
    console.error('Periodic sync error:', error);
  }
}

console.log('🚀 AiLydian Enterprise Service Worker loaded successfully');