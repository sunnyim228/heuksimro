// 연재 화 파일 점검: 새 화를 넣었을 때 빠진 것·겹치는 것이 없는지.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  const r = await g.ev(async () => {
    const { EPISODES, EPISODE_PROBLEMS } = await import('./js/episodes/index.js');
    const { REAL, DEX_MORE, HINTS, DEX_ORDER } = await import('./js/homestay.js');
    const { RECIPES } = await import('./js/data.js');
    const { itemIcon } = await import('./js/art.js');
    const blank = id => { const c = itemIcon(id), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return false; return true; };
    const out = [];
    for (const ep of EPISODES) {
      for (const d of ep.dishes) {
        if (!REAL[d.id] || REAL[d.id].steps.length < 3 || REAL[d.id].ing.length < 2) out.push(`${d.id}: 진짜 레시피가 모자라요`);
        if (!DEX_MORE[d.id].tip || !DEX_MORE[d.id].vary) out.push(`${d.id}: 요령·변주가 비었어요`);
        if (!HINTS[d.id]) out.push(`${d.id}: 단서가 없어요`);
        if (blank(d.id)) out.push(`${d.id}: 그림이 비었어요`);
        if (!d.tags || !d.tags.length) out.push(`${d.id}: 요리 성격이 없어요`);
      }
      for (const it of ep.items) if (typeof it !== 'string' && blank(it.id)) out.push(`${it.id}: 재료 그림이 비었어요`);
      if (!ep.visitor.hello.length || !ep.visitor.bye) out.push(`${ep.id}: 손님 대사가 비었어요`);
      if (!ep.visitor.bonds || ep.visitor.bonds.length !== 4 || !ep.visitor.gift) out.push(`${ep.id}: 정(♥) 장면 4개와 선물이 필요해요`);
      if (!ep.visitor.clues || !ep.visitor.clues.arrive || !ep.visitor.clues.h2 || !ep.visitor.clues.h4) out.push(`${ep.id}: 소문 단서 3개(arrive·h2·h4)가 필요해요`);
    }
    for (const id of DEX_ORDER) if (!RECIPES[id]) out.push(`${id}: 도감에 있는데 레시피가 없어요`);
    return { problems: [...EPISODE_PROBLEMS, ...out], count: EPISODES.length, dex: DEX_ORDER.length };
  });
  check(!r.problems.length, '연재 화 문제:\n' + r.problems.join('\n'));
  check(r.count >= 4 && r.dex >= 20, '화 4개 이상, 도감 20가지 이상');
  await g.ctx.close();
}
