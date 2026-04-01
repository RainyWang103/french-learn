const CACHE_VERSION = 'v1'
const CURRICULUM_CACHE = `curriculum-${CACHE_VERSION}`
const APP_CACHE = `app-${CACHE_VERSION}`

const CURRICULUM_PREFIX = '/curriculum/'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CURRICULUM_CACHE && k !== APP_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Cache-first for curriculum JSON files
  if (url.pathname.startsWith(CURRICULUM_PREFIX)) {
    event.respondWith(
      caches.open(CURRICULUM_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
        }),
      ),
    )
    return
  }

  // Network-first for everything else (Supabase calls, app shell)
  event.respondWith(
    fetch(request).catch(() =>
      caches.open(APP_CACHE).then((cache) => cache.match(request)),
    ),
  )
})
