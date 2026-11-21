// 모락모락 서비스워커: 한 번 열어 두면 인터넷이 없어도 이어서 할 수 있게 파일을 보관해요.
// 항상 새 파일을 먼저 받아 오고(업데이트가 바로 반영), 연결이 없을 때만 보관해 둔 파일을 써요.
// 예전 여행 수첩 앱(heuksim/)은 자기 서비스워커가 따로 있어서 여기서는 건드리지 않아요.
const CACHE = 'morak-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'js/game.js', 'js/art.js', 'js/data.js', 'js/story.js', 'js/audio.js', 'js/homestay.js', 'fonts/Galmuri11.woff2', 'icons/icon-192.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('morak-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/heuksim/')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok) { const c = await caches.open(CACHE); c.put(r, res.clone()); }
      return res;
    } catch (err) {
      return (await caches.match(r)) || (r.mode === 'navigate' ? caches.match('index.html') : Response.error());
    }
  })());
});
