// AILYDIAN AI Lens Pro - Mobile-First Service Worker
// © 2024 Emrah Şardağ - Z.AI GLM-4.5 Powered

const CACHE_NAME = 'ailens-turbo-v1';
const STATIC_CACHE = 'ailens-static-v1';
const API_CACHE = 'ailens-api-v1';

// Critical resources for mobile performance
const STATIC_ASSETS = [
  '/',
  '/tr/dashboard',
  '/manifest.json',
  '/offline.html'
];

// API routes to cache for offline functionality
const CACHED_API_ROUTES = [
  '/api/crypto/prices',
  '/api/user/portfolio'
];

// Network first, cache fallback strategy for API
const networkFirstCache = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Cache first, network fallback for static assets
const cacheFirstStrategy = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    throw error;
  }
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🚀 AILYDIAN SW Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ AILYDIAN SW Activated');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    if (CACHED_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(networkFirstCache(request, API_CACHE));
    }
    return;
  }

  // Static assets - cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.') // Files with extensions
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/offline.html') || 
                 caches.match('/tr/dashboard') ||
                 new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

// Background sync for trade operations
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'trade-sync') {
    event.waitUntil(syncTrades());
  }
  
  if (event.tag === 'portfolio-sync') {
    event.waitUntil(syncPortfolio());
  }
});

// Push notifications for trade alerts
self.addEventListener('push', (event) => {
  console.log('📱 Push received:', event);
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'trade-alert',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'view',
        title: 'Görüntüle',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Kapat',
        icon: '/icons/dismiss-action.png'
      }
    ],
    data: {
      url: data.url || '/tr/dashboard',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const clickAction = event.action;
  const notificationData = event.notification.data;
  
  if (clickAction === 'dismiss') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = notificationData?.url || '/tr/dashboard';
        
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes('dashboard') && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData
            });
            return;
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Sync functions
async function syncTrades() {
  try {
    const pendingTrades = await getStoredData('pending-trades');
    if (pendingTrades && pendingTrades.length > 0) {
      for (const trade of pendingTrades) {
        await fetch('/api/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trade)
        });
      }
      await clearStoredData('pending-trades');
    }
  } catch (error) {
    console.error('Trade sync failed:', error);
  }
}

async function syncPortfolio() {
  try {
    await fetch('/api/user/portfolio', { method: 'GET' });
  } catch (error) {
    console.error('Portfolio sync failed:', error);
  }
}

// IndexedDB helpers
function getStoredData(key) {
  return new Promise((resolve) => {
    // Simplified implementation - would use IndexedDB in production
    resolve([]);
  });
}

function clearStoredData(key) {
  return new Promise((resolve) => {
    // Simplified implementation - would use IndexedDB in production
    resolve();
  });
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
});

console.log('🤖 AILYDIAN AI Lens Pro SW Loaded - Mobile-First Ready!');
