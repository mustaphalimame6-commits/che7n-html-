// ═══════════════════════════════════════
//  CH7N Service Worker — نسخة مع تحديث تلقائي
//  غيّر هذا الرقم في كل مرة ترفع تحديثاً جديداً
// ═══════════════════════════════════════
const VERSION = 'ch7n-v3';

// الملفات التي تُحفظ في الكاش
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
];

// ══ تثبيت: احفظ الملفات ══
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(STATIC))
  );
  // تفعيل فوري بدون انتظار
  self.skipWaiting();
});

// ══ تفعيل: احذف الكاش القديم ══
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      )
    )
  );
  // سيطر على جميع الصفحات فوراً
  self.clients.claim();
});

// ══ استقبال رسالة SKIP_WAITING من الصفحة ══
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ══ Fetch: Network First (الشبكة أولاً، الكاش احتياطي) ══
self.addEventListener('fetch', e => {
  // تجاهل طلبات تيليجرام وGoogle وCloudinary
  const url = e.request.url;
  if (
    url.includes('api.telegram.org') ||
    url.includes('googleapis.com') ||
    url.includes('cloudinary.com') ||
    url.includes('script.google.com') ||
    url.includes('wa.me')
  ) {
    return; // لا تتدخل — اتركها تذهب للشبكة مباشرة
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // احفظ نسخة جديدة في الكاش
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // إذا انقطع الإنترنت — ارجع للكاش
        return caches.match(e.request).then(r => r || caches.match('/index.html'));
      })
  );
});
