// 1부 「식은 솥」을 처음부터 엔딩까지 실제로 플레이해요.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  const step = async () => (await g.G()).step;
  await g.newGame();
  check(await step() === 'enter_shop', '프롤로그 뒤에는 식당에 들어가야 해요');

  await g.goShop();
  check(await step() === 'gather', '식당에 들어가면 재료 모으기');
  await g.goVillage();
  await g.use(`t=>t.id==='crop0'`); await g.use(`t=>t.id==='crop1'`);
  await g.use(`t=>t.id==='ijang'`);
  check(await step() === 'first_cook', '파·쌀·달걀이 모이면 첫 요리');

  await g.goShop();
  await g.cook('egg_rice'); await g.drain();
  check(await step() === 'first_open', '첫 요리를 맛보면 첫 영업');
  check((await g.G()).trait, '손맛이 랜덤으로 정해져야 해요');

  // 첫 영업: 손님 주문을 끝까지 받아요
  await g.use(`t=>t.type==='sign'`);
  for (let i = 0; i < 80; i++) {
    const w = await g.ev(() => { const s = window.__morak.svc; return s ? s.cust.filter(c => c.state === 'wait').map(c => ({ o: c.order, t: c.table.idx })) : null; });
    if (!w) break;
    if (!w.length) { await g.page.waitForTimeout(300); continue; }
    await g.cook(w[0].o);
    await g.use(`t=>t.type==='table'&&t.idx===${w[0].t}`);
  }
  await g.page.waitForTimeout(300);
  if (await g.ev(() => !document.querySelector('#panel-layer').classList.contains('hide'))) await g.page.click('#panel-body [data-a="ok"]');
  await g.drain();
  check(await step() === 'sleep1', '첫 영업 뒤에는 잠자리');
  check((await g.G()).stats.served >= 1, '손님을 한 명 이상 대접해야 해요');

  await g.sleepNow();
  check(await step() === 'q_geumja', '다음 날 아침 이장님이 레시피를 돌려줘요');

  // 마을 사람 다섯에게 차례로 대접
  await g.give({ doenjang: 3, tofu: 3, pa: 3, miyeok: 2, clam: 2, gamja: 2, egg: 2, rice: 4, mushroom: 4, fish: 1, mu: 3 });
  const chain = [['doenjang_jjigae', 'geumja', 'q_sori'], ['miyeok_guk', 'sori', 'q_doyun'], ['gamjajeon', 'doyun', 'q_captain'], ['mushroom_rice', 'captain', 'q_ijang2'], ['grilled_fish', 'ijang', 'cauldron']];
  for (const [dish, npc, next] of chain) {
    await g.cook(dish);
    await g.use(`t=>t.type==='pantry'`); // 들고 있는 요리를 선반(가방)에
    await g.goVillage();
    await g.use(`t=>t.id==='${npc}'`);
    check(await step() === next, `${npc}에게 ${dish}를 주면 ${next}`);
    await g.goShop();
  }
  await g.use(`t=>t.type==='cooker'&&t.kind==='cauldron'`);
  check(await step() === 'gukbap', '가마솥을 열면 국밥 단계');
  check((await g.G()).mem.length === 4, '국밥의 기억 네 개');
  await g.cook('gukbap'); await g.drain();
  check(await step() === 'epilogue', '국밥을 끓이면 1부 끝');

  // 저장 → 다시 열어 이어하기
  await g.ev(() => window.__morak.save());
  await g.page.reload(); await g.page.waitForTimeout(600);
  await g.page.click('#btn-continue'); await g.page.waitForTimeout(300); await g.drain();
  check(await step() === 'epilogue', '이어하기로 같은 진행이 열려야 해요');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
