const CACHE_NAME = 'sumzero-v1.3.0'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.js',
  '/src/ui/UI.js',
  '/src/ui/MenuUI.js',
  '/src/core/game/GameService.js',
  '/src/core/game/GameState.js',
  '/src/core/scoring/PatternRecognizer.js',
  '/src/core/scoring/ScoringService.js',
  '/src/core/draft/DraftService.js',
  '/src/core/placement/PlacementService.js',
  '/src/core/pieces/PieceLibrary.js',
  '/src/core/pieces/PieceDefinitions.js',
  '/src/core/board/Board.js',
  '/src/core/board/BoardShapes.js',
  '/src/core/geometry/Transform.js',
  '/src/ai/SimpleAI.js',
  '/src/utils/constants.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('SumZero Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SumZero Service Worker: Caching app shell')
        return cache.addAll(urlsToCache)
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

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('SumZero Service Worker: Serving from cache:', event.request.url)
          return response
        }

        // Otherwise fetch from network
        console.log('SumZero Service Worker: Fetching from network:', event.request.url)
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response for caching
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(error => {
          console.error('SumZero Service Worker: Fetch failed:', error)

          // Return a custom offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/')
          }

          throw error
        })
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