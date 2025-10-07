// 🏥 Medical AI PWA Service Worker
// Version: 1.0.0
// White-Hat Security: Active

const CACHE_NAME = 'medical-ai-v1.0.0';
const CACHE_VERSION = '20251006';

// Critical medical tools - cache for offline access
const STATIC_ASSETS = [
    '/medical-expert.html',
    '/epic-fhir-dashboard.html',
    // Medical calculators remain functional offline
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

// Security: Never cache sensitive medical data
const isSensitiveEndpoint = (url) => {
    const sensitivePatterns = [
        '/api/medical/chat',
        '/api/medical/epic-fhir',
        '/api/fhir/',
        '/api/dicom/',
        '/api/auth',
        '/patient',
        '/observation',
        '/condition',
        '/medication'
    ];

    return sensitivePatterns.some(pattern => url.includes(pattern));
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🏥 Medical AI Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching medical static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Medical Service Worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker installation failed:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Medical AI Service Worker: Activating...');

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
                console.log('✅ Medical Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network-first for medical data, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Security: Only handle same-origin requests
    if (!isSameOrigin(request.url)) {
        return;
    }

    // Security: NEVER cache sensitive medical data (HIPAA compliance)
    if (isSensitiveEndpoint(request.url)) {
        return event.respondWith(
            fetch(request)
                .catch(() => {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Offline - Medical data requires network connection',
                        offline: true
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    }

    // Static medical calculators - cache-first (work offline)
    if (request.url.includes('/medical-expert.html') ||
        request.url.includes('/epic-fhir-dashboard.html')) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((response) => {
                            if (!isValidResponse(response)) {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });

                            return response;
                        });
                })
        );
    }

    // All other requests - network-first
    event.respondWith(
        fetch(request)
            .catch((error) => {
                console.error('❌ Fetch failed:', error);
                return caches.match('/medical-expert.html');
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
            console.log('🗑️ Medical cache cleared');
        });
    }
});

// Push notification event (for medical alerts)
self.addEventListener('push', (event) => {
    console.log('🔔 Medical push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Medical AI Notification',
        icon: '/lydian-logo.png',
        badge: '/lydian-logo.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/lydian-logo.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/lydian-logo.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Medical AI Alert', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Medical notification clicked');
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/medical-expert.html')
        );
    }
});

// Background sync (for offline medical data submission)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-medical-data') {
        event.waitUntil(syncMedicalData());
    }
});

async function syncMedicalData() {
    try {
        // Retrieve pending medical data from IndexedDB
        const db = await openMedicalDB();
        const pendingData = await db.getAll('pending');

        for (const data of pendingData) {
            try {
                await fetch(data.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.payload)
                });

                // Remove from pending after successful sync
                await db.delete('pending', data.id);
                console.log('✅ Medical data synced:', data.id);
            } catch (error) {
                console.error('❌ Sync failed for:', data.id);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// IndexedDB for offline medical data storage
function openMedicalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MedicalAI', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending')) {
                db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

console.log('🏥 Medical AI Service Worker loaded - HIPAA Security Active');
