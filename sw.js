// ===== SERVICE WORKER: GREEN API Test Interface =====

const CACHE_NAME = 'green-api-static-v1';
const CACHE_VERSION = '1.0.0';

// Static resources to cache
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/js/app.js',
  '/styles/main.css',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('✅ Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
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

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip API calls (let them fail when offline)
  if (request.url.includes('api.green-api.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for static resources
            if (networkResponse.status === 200 && isStaticResource(request.url)) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('🌐 Network request failed:', request.url, error);
            
            // Return offline fallback if available
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Helper function to determine if a resource should be cached
function isStaticResource(url) {
  const staticExtensions = ['.js', '.css', '.html', '.json', '.ico', '.png', '.jpg', '.svg'];
  return staticExtensions.some(ext => url.includes(ext)) || 
         url.endsWith('/') || 
         !url.includes('.');
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload;
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urls))
    );
  }
});

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.keys().then((requests) => {
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            return Promise.all(
              requests.map((request) => {
                return cache.match(request).then((response) => {
                  if (response) {
                    const dateHeader = response.headers.get('date');
                    if (dateHeader) {
                      const responseDate = new Date(dateHeader).getTime();
                      if (now - responseDate > maxAge) {
                        return cache.delete(request);
                      }
                    }
                  }
                });
              })
            );
          });
        })
    );
  }
});

// Background sync for failed API requests (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('🔄 Background sync triggered');
      // Handle background sync logic here if needed
    }
  });
}

console.log('🔧 Service Worker script loaded'); 