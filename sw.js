// 이 주소의 주인이 여행 수첩(흑심으路)에서 게임(모락모락)으로 바뀌었어요.
// 예전에 수첩 앱이 설치해 둔 서비스워커를 이 파일이 대신 받아서, 옛 캐시를 비우고 스스로 물러나요.
// 수첩 앱은 heuksim/ 폴더로 옮겼고, 쓰던 수첩 내용(기기 저장소)은 건드리지 않아요.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('heuksim-')) await caches.delete(k);
  await self.clients.claim();
  await self.registration.unregister();
})()));
