// 🛡️ LyDian IQ - Secure Service Worker
// Version: 2.0
// White-Hat Security: Active

const CACHE_NAME = 'lydian-iq-v2.0';
const CACHE_VERSION = '20251006';

// Assets to cache for offline support
const STATIC_ASSETS = [
    '/lydian-iq.html',
    '/lydian-legal-search.html',
    '/lydian-logo.svg',
    '/lydian-logo.png',
    '/manifest.json',
    '/css/lydian-iq-enhancements.css'
];

// Security: Only cache same-origin requests
const isSameOrigin = (url) => {
    return new URL(url).origin === location.origin;
};

// Security: Validate response before caching
const isValidResponse = (response) => {
    return response &&
           response.status === 200 &&
           response.type === 'basic';
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 LyDian IQ Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker installation failed:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 LyDian IQ Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Security: Only handle same-origin requests
    if (!isSameOrigin(request.url)) {
        return;
    }

    // Security: Skip caching for sensitive endpoints
    if (request.url.includes('/api/') ||
        request.url.includes('auth') ||
        request.url.includes('login')) {
        return event.respondWith(fetch(request));
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Security: Validate response before caching
                        if (!isValidResponse(response)) {
                            return response;
                        }

                        // Clone the response before caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('❌ Fetch failed:', error);

                        // Return offline page if available
                        return caches.match('/lydian-iq.html');
                    });
            })
    );
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ Cache cleared successfully');
        });
    }
});

// Push notification event (for future use)
self.addEventListener('push', (event) => {
    console.log('🔔 Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'LyDian IQ Bildirimi',
        icon: '/lydian-logo.png',
        badge: '/lydian-logo.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('LyDian IQ', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/lydian-iq.html')
    );
});

console.log('🛡️ LyDian IQ Service Worker loaded - White-Hat Security Active');
