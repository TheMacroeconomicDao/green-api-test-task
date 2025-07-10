// ===== SERVICE WORKER - GREEN API Test Interface =====
// Modern PWA Service Worker with caching strategies

const CACHE_NAME = 'green-api-v1.0.0';
const STATIC_CACHE = 'green-api-static-v1.0.0';
const DYNAMIC_CACHE = 'green-api-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/app.js',
    '/manifest.json'
];

// API endpoints that should be cached with different strategies
const API_CACHE_PATTERNS = [
    /^https:\/\/api\.green-api\.com\//
];

// ===== INSTALLATION =====
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

// ===== ACTIVATION =====
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// ===== FETCH HANDLING =====
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticAsset(request)) {
            // Static assets: Cache First strategy
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request)) {
            // API requests: Network First strategy
            event.respondWith(networkFirst(request));
        } else {
            // Other requests: Stale While Revalidate
            event.respondWith(staleWhileRevalidate(request));
        }
    } else {
        // POST/PUT/DELETE requests: Network Only
        event.respondWith(networkOnly(request));
    }
});

// ===== CACHING STRATEGIES =====

// Cache First: Good for static assets
async function cacheFirst(request) {
    try {
        const cacheResponse = await caches.match(request);
        if (cacheResponse) {
            return cacheResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First strategy failed:', error);
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network First: Good for API calls
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed, trying cache:', error);
        
        const cacheResponse = await caches.match(request);
        if (cacheResponse) {
            return cacheResponse;
        }
        
        return new Response(JSON.stringify({
            error: 'Network unavailable',
            message: 'Please check your internet connection',
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// Stale While Revalidate: Good for frequently updated content
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cacheResponse = await caches.match(request);
    
    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.warn('Network request failed:', error);
            return null;
        });
    
    return cacheResponse || networkResponsePromise;
}

// Network Only: For critical requests
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('Network Only request failed:', error);
        return new Response('Network Error', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ===== HELPER FUNCTIONS =====

function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname === asset) ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.html') ||
           url.pathname.endsWith('.json');
}

function isAPIRequest(request) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// ===== BACKGROUND SYNC =====
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'retry-api-call') {
        event.waitUntil(retryFailedAPICall());
    }
});

async function retryFailedAPICall() {
    // Implement retry logic for failed API calls
    console.log('🔁 Service Worker: Retrying failed API calls');
    
    try {
        // Get failed requests from IndexedDB or localStorage
        // Retry them when connection is restored
        const failedRequests = await getFailedRequests();
        
        for (const request of failedRequests) {
            try {
                await fetch(request);
                removeFailedRequest(request);
            } catch (error) {
                console.warn('Retry failed for request:', request.url);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', (event) => {
    console.log('📱 Service Worker: Push message received');
    
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'You have a new notification',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: data.data || {},
            actions: [
                {
                    action: 'view',
                    title: 'View',
                    icon: '/action-view.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: '/action-dismiss.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'GREEN API', options)
        );
    }
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            self.clients.openWindow('/')
        );
    }
});

// ===== MESSAGE HANDLING =====
self.addEventListener('message', (event) => {
    console.log('💬 Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== UTILITY FUNCTIONS =====

async function getFailedRequests() {
    // Implement storage of failed requests
    // This could use IndexedDB for more complex scenarios
    return [];
}

async function removeFailedRequest(request) {
    // Remove request from failed requests storage
}

// ===== PERFORMANCE MONITORING =====
self.addEventListener('fetch', (event) => {
    const start = performance.now();
    
    event.respondWith(
        (async () => {
            const response = await handleFetch(event.request);
            const duration = performance.now() - start;
            
            // Log performance metrics
            console.log(`⚡ Request: ${event.request.url} - ${duration.toFixed(2)}ms`);
            
            return response;
        })()
    );
});

async function handleFetch(request) {
    // Main fetch handling logic (simplified)
    return fetch(request).catch(() => {
        return new Response('Offline');
    });
}

// ===== ERROR HANDLING =====
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Service Worker Unhandled Rejection:', event.reason);
});

console.log('🚀 Service Worker: Script loaded successfully'); 