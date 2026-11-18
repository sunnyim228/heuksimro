// 세계 요리: 손님이 단서와 재료를 가져오고, 부엌에서 조합해 직접 찾아내요.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  await g.newGame();
  await g.ev(() => { const G = window.__morak.G; G.step = 'epilogue'; G.coins = 300; G.recipes = ['egg_rice', 'mushroom_rice']; });
  await g.sleepNow();
  // 만물상에 이탈리아 재료
  await g.ev(() => { const M = window.__morak; M.interact(M.MAPS.village.things.find(t => t.id === 'ijang')); }); await g.page.waitForTimeout(200);
  await g.page.click('#choices button[data-i="0"]'); await g.page.waitForTimeout(200);
  const shop = await g.ev(() => [...document.querySelectorAll('#panel-body [data-a="buy"]')].map(b => b.dataset.v));
  check(['pasta', 'tomato', 'cheese'].every(i => shop.includes(i)), '만물상에 파스타면·토마토·치즈');
  await g.page.click('#panel-x'); await g.drain();
  // 도감: 찾기 전엔 ?와 단서, 아직 안 온 나라는 잠겨 있음
  await g.page.click('[data-open="dex"]'); await g.page.waitForTimeout(200);
  check(await g.ev(() => document.querySelectorAll('#panel-body [data-a="hint"]').length) === 2, '이탈리아 요리 두 개는 단서 보기');
  check(await g.ev(() => [...document.querySelectorAll('#panel-body .sec')].some(e => e.textContent.includes('태국 — 아직'))), '태국은 아직 잠겨 있어요');
  await g.page.click('#panel-x');
  // 부엌에서 찾아내기
  const put = (item, kind) => g.ev(([item, kind]) => { const M = window.__morak; M.map = M.MAPS.shop; M.P.hands = item; M.interact(M.MAPS.shop.things.find(t => t.type === 'cooker' && t.kind === kind)); return M.P.hands; }, [item, kind]);
  check(await put('tortilla', 'pot') === 'tortilla', '맞지 않는 재료는 냄비에 안 들어가요');
  await g.ev(() => { window.__morak.P.hands = null; });
  for (const i of ['pasta', 'tomato', 'cheese']) check(await put(i, 'pot') === null, `${i}는 냄비에 들어가요`);
  check((await g.G()).recipes.includes('tomato_pasta'), '맞는 조합이면 「새 요리 발견!」');
  // 여름 손님 → 태국 열림
  await g.ev(() => { window.__morak.P.hands = null; window.__morak.G.stay.day = 7; }); await g.sleepNow();
  check((await g.G()).world.thai, '여름 손님이 태국을 열어요');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
