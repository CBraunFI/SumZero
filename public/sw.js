// SumZero Service Worker - Optimized for Vite build
const CACHE_VERSION = '1.3.2'
const CACHE_NAME = `sumzero-v${CACHE_VERSION}`

// Core assets to cache immediately on install
const CORE_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png'
]

// Install event - cache resources
self.addEventListener('install', event => {
  console.log(`[SW v${CACHE_VERSION}] Installing...`)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets')
        return cache.addAll(CORE_CACHE)
      })
      .then(() => {
        console.log('SumZero Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('SumZero Service Worker: Cache failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SumZero Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SumZero Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('SumZero Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip cross-origin requests
  if (url.origin !== location.origin) return

  // HTML/Navigation: Network-first strategy (always get latest)
  if (request.mode === 'navigate' || request.destination === 'document' ||
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the new version
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request).then(cached => cached || caches.match('/'))
        })
    )
    return
  }

  // All other assets: Cache-first strategy (fast performance)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
      .catch(error => {
        console.error('[SW] Fetch failed:', error)
        throw error
      })
  )
})

// Handle background sync for game data
self.addEventListener('sync', event => {
  if (event.tag === 'gamedata-sync') {
    console.log('SumZero Service Worker: Background sync triggered')
    event.waitUntil(syncGameData())
  }
})

// Sync game data when connection is restored
async function syncGameData() {
  try {
    // This could sync game statistics, achievements, etc.
    console.log('SumZero Service Worker: Syncing game data...')
    // Implementation would depend on your backend
  } catch (error) {
    console.error('SumZero Service Worker: Sync failed:', error)
  }
}

// Handle push notifications (if needed later)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    console.log('SumZero Service Worker: Push received:', data)

    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Play Now',
          icon: '/icons/icon-72x72.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'SumZero', options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('SumZero Service Worker: Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})