/**
 * عامل الخدمة — بحيرة سمارت
 *
 * الفلسفة: لا ندّعي أن التطبيق كله يعمل دون اتصال.
 * نُبقي متاحًا ما سبق للمواطن أن فتحه، ونصرّح بما لا يعمل.
 *
 * الاستراتيجيات:
 *  - أصول البناء الثابتة  → cache-first   (لها بصمة في الاسم، فلا تتغير)
 *  - صفحات التصفح         → network-first (المحتوى الرسمي يجب أن يكون الأحدث)
 *  - واجهات GET           → network-first مع نسخة احتياطية
 *  - واجهات POST          → الشبكة فقط، بلا تخزين (الإرسال يحتاج تأكيد الخادم)
 */

const VERSION = "bs-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGES_CACHE = `${VERSION}-pages`;
const ASSETS_CACHE = `${VERSION}-assets`;
const DATA_CACHE = `${VERSION}-data`;

const SHELL_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/brand/icon.svg",
];

const MAX_PAGES = 45;
const MAX_DATA = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // لا نخزّن مسارات الإدارة إطلاقًا — بيانات تشغيلية حساسة ومتغيرة.
  if (url.pathname.startsWith("/admin")) return;

  // أصول البناء — أسماؤها تحمل بصمة المحتوى، فالتخزين الدائم آمن.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/brand")) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DATA_CACHE, MAX_DATA));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  event.respondWith(networkFirst(request, PAGES_CACHE, MAX_PAGES));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName, limit) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      void trim(cacheName, limit);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
      void trim(PAGES_CACHE, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const fallback = await caches.match("/offline");
    if (fallback) return fallback;
    return new Response("لا يوجد اتصال بالإنترنت.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/** حدّ أعلى لكل مخزن حتى لا تتضخم مساحة التخزين على هاتف المواطن. */
async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (const key of keys.slice(0, keys.length - limit)) {
    await cache.delete(key);
  }
}
