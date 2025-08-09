// TodoHouse Service Worker - Minimal PWA implementation
const CACHE_NAME = "todohouse-v1";
const STATIC_CACHE_URLS = [
	"/",
	"/manifest.json",
	"/icon-192.svg",
	"/icon-512.svg",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("SW: Caching essential resources");
				return cache.addAll(STATIC_CACHE_URLS);
			})
			.then(() => self.skipWaiting()),
	);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => caches.delete(cacheName)),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch event - serve from cache when possible
self.addEventListener("fetch", (event) => {
	// Only handle GET requests
	if (event.request.method !== "GET") return;

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// Return cached version if available
			if (cachedResponse) {
				return cachedResponse;
			}

			// Otherwise, fetch from network
			return fetch(event.request)
				.then((response) => {
					// Don't cache non-successful responses
					if (
						!response ||
						response.status !== 200 ||
						response.type !== "basic"
					) {
						return response;
					}

					// Clone response to cache it
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						// Only cache same-origin requests
						if (event.request.url.startsWith(self.location.origin)) {
							cache.put(event.request, responseToCache);
						}
					});

					return response;
				})
				.catch(() => {
					// Return a basic offline page for navigation requests
					if (event.request.mode === "navigate") {
						return caches.match("/");
					}
				});
		}),
	);
});

// Background sync for offline functionality (minimal implementation)
self.addEventListener("sync", (event) => {
	if (event.tag === "background-sync") {
		console.log("SW: Background sync triggered");
	}
});

console.log("TodoHouse Service Worker loaded");
