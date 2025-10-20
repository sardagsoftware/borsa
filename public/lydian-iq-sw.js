// 🔒 LyDian IQ - Universal Service Worker
// Version: 3.2 - iOS & Android Cross-Platform Optimized
// Compatible: All browsers, all devices (iOS, Android, Desktop)
// White-Hat Security: Active
// iOS PWA: Fully compatible with iOS 11.3+
// Android PWA: Fully compatible with Android 5.0+

const CACHE_VERSION = 'lydian-iq-v3.2-20251007-ios-android-fix';
const CACHE_NAME = `${CACHE_VERSION}`;

// Detect iOS device for specific handling
const isIOS = /iPad|iPhone|iPod/.test(self.navigator.userAgent) ||
              (self.navigator.platform === 'MacIntel' && self.navigator.maxTouchPoints > 1);

// 🎯 Critical Assets (Always cache)
const CRITICAL_ASSETS = [
    '/lydian-iq.html',
    '/lydian-offline.html',
    '/lydian-manifest.json',
    '/lydian-logo.png',
    '/css/lydian-iq-enhancements.css'
];

// 🌐 External Resources (Cache with network fallback)
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net'
];

// 📦 Install Event - Precache critical assets
self.addEventListener('install', (event) => {
    console.log('✅ LyDian IQ Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Precaching critical assets...');
                return cache.addAll(CRITICAL_ASSETS).catch((err) => {
                    console.warn('⚠️ Some assets failed to cache (non-critical):', err);
                    // Don't fail installation if some assets can't be cached
                    return Promise.resolve();
                });
            })
            .then(() => {
                console.log('✅ LyDian IQ Service Worker: Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// 🔄 Activate Event - Cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 LyDian IQ Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Delete old versions
                            return cacheName.startsWith('lydian-iq-v') && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('✅ LyDian IQ Service Worker: Activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// 🌐 Fetch Event - Smart caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // 🚀 Skip external CDN resources (let browser handle them directly)
    const externalCDNs = [
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'd3js.org',
        'unpkg.com',
        'cdnjs.cloudflare.com',
        'ajax.googleapis.com'
    ];

    if (externalCDNs.some(cdn => url.hostname.includes(cdn))) {
        // Don't intercept - let browser fetch directly
        return;
    }

    // 🎯 Strategy: Network First with Cache Fallback (iOS & Android optimized)
    event.respondWith(
        fetch(request, {
            // iOS Safari timeout fix
            signal: isIOS ? undefined : request.signal,
            cache: 'no-store' // Prevent double caching on iOS
        })
            .then((response) => {
                // Clone response before caching
                const responseToCache = response.clone();

                // Cache successful responses (iOS-safe)
                if (response.status === 200 && response.type !== 'opaque') {
                    caches.open(CACHE_NAME).then((cache) => {
                        // iOS-safe cache put with error handling
                        cache.put(request, responseToCache).catch((err) => {
                            console.warn('⚠️ Cache put failed (iOS safe):', err);
                        });
                    });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('📦 Serving from cache:', request.url);
                            return cachedResponse;
                        }

                        // If HTML page, show offline page
                        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
                            return caches.match('/lydian-offline.html').then((offlinePage) => {
                                return offlinePage || new Response('Offline', {
                                    status: 503,
                                    statusText: 'Service Unavailable',
                                    headers: new Headers({ 'Content-Type': 'text/html' })
                                });
                            });
                        }

                        // For other resources, return empty response
                        return new Response('Offline - Resource not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// 📱 Push Notification Support
self.addEventListener('push', (event) => {
    console.log('📱 Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'LyDian IQ notification',
        icon: '/lydian-logo.png',
        badge: '/lydian-logo.png',
        vibrate: [200, 100, 200],
        tag: 'lydian-iq-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('LyDian IQ', options)
    );
});

// 🔔 Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/lydian-iq.html')
    );
});

// 💬 Message Handler (for communication with app)
self.addEventListener('message', (event) => {
    console.log('💬 Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// 🔄 Background Sync Support
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    // Placeholder for background sync logic
    console.log('📤 Syncing messages in background...');
    return Promise.resolve();
}

// ⚡ Performance Monitoring
console.log('⚡ LyDian IQ Service Worker loaded successfully');
console.log(`📦 Cache version: ${CACHE_VERSION}`);
console.log('🔒 Security: White-Hat Ethical AI');
console.log('🌐 Ready for offline mode');
