
const CACHE_NAME = "cherrycraft-v1";

const FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./assets/garden.png",
    "./assets/flower.png",
    "./assets/book.png",
    "./assets/apple.png",
    "./assets/diamond.png",
    "./assets/potion.png",
    "./assets/tree.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(() =>
            caches.match(event.request)
        )
    );
});
