const CACHE_NAME = 'mis-ramos-v1';

// Aquí le decimos qué archivos debe descargar y guardar en el celular
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './IMG/calculadora-notas-promedio.png',
    './IMG/icono.png',
    './IMG/compartir.png',
    './IMG/calcula-mis-ramos-descarga.png',
    // Tus herramientas externas (Tailwind, Gráficos y Descarga de imagen)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 1. Instalar y guardar en caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Activar y limpiar cachés viejos (por si en el futuro actualizas tu web)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Interceptar peticiones: Si no hay internet, usa el caché
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el archivo está en la memoria caché, lo muestra al instante
                if (response) {
                    return response;
                }
                // Si no está en caché (o si hay internet), lo busca en la red normal
                return fetch(event.request);
            })
    );
});