const CACHE_NAME = 'animal-land-pro-v10'; // رفع الإصدار
const ASSETS_TO_CACHE = [
    '/', // تخزين الصفحة الرئيسية
    'index.html',
    'manifest.json',
    'logo.png',
    'assets/js/main.js',
    'assets/css/style.css'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // استخدام addAll بحذر، إذا فشل ملف واحد يفشل التخزين بالكامل
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch Strategy: Stale-While-Revalidate (أفضل للتوازن بين السرعة والتحديث)
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات غير الـ GET (مثل POST) لتجنب الأخطاء
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // التأكد من صحة الاستجابة قبل تخزينها
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // هنا يمكن توجيه المستخدم لصفحة offline.html إذا فشل الكل
            });

            // نرجع الملف من الكاش فوراً إذا وجد، مع تحديثه في الخلفية
            return cachedResponse || fetchPromise;
        })
    );
});