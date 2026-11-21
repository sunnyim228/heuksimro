// 2부: 별손님이 오고, 도감 별이 오르고, 한 해가 끝나면 이어 하거나 새로 시작해요.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  await g.newGame();
  await g.ev(() => { const G = window.__morak.G; G.step = 'epilogue'; G.trait = 'soup'; G.coins = 300;
    G.recipes = ['egg_rice', 'doenjang_jjigae', 'radish_soup', 'miyeok_guk', 'gamjajeon', 'mushroom_rice', 'namul_rice', 'grilled_fish', 'gukbap']; });
  check(await g.ev(() => document.querySelector('[data-open="dex"]').classList.contains('hide')), '2부 전에는 도감 버튼이 숨어 있어요');
  await g.sleepNow();
  let G = await g.G();
  check(G.stay && G.stay.day === 1 && G.step === 'epilogue', '잠자리 뒤 홈스테이가 시작되고, 1부 단계는 그대로예요');
  check(G.world.italy, '첫 손님이 이탈리아 이야기를 가져와요');
  check(g.lines.some(l => l.includes('사람은 아니구먼')), '이장님은 손님이 사람이 아닌 걸 알아봐요');

  // 같은 요리를 계절마다 다른 손님에게 → ★ → ★★ → ★★★
  const dish = G.stay.today;
  const teach = async () => { await g.ev(id => { const M = window.__morak; M.G.stay.today = id; M.addItem(id, 1); M.talkBuddy(); }, dish); await g.drain(ch => ch.findIndex(c => c.includes('가르쳐'))); };
  await teach();
  check((await g.G()).dex[dish].length === 1, '첫 손님이 맛보면 별 하나');
  for (const [day, stars, word] of [[10, 2, '요령'], [20, 3, '이렇게도']]) {
    await g.ev(d => { window.__morak.G.stay.day = d; }, day); await g.sleepNow();
    g.lines.length = 0; await teach();
    check((await g.G()).dex[dish].length === stars, `다른 손님이 맛보면 별 ${stars}`);
    check(g.lines.some(l => l.includes(word)), `별 ${stars}에서 「${word}」가 열려요`);
  }
  // 정(♥): 수업·같이 먹기로 쌓이고 하트마다 속 이야기
  await g.ev(() => { window.__morak.G.stay.bond = 20; window.__morak.G.stay.ate = false; window.__morak.addItem('egg_rice', 1); window.__morak.talkBuddy(); });
  g.lines.length = 0; await g.drain(ch => ch.indexOf('같이 밥 먹기'));
  check(await g.ev(() => window.__morak.hearts) === 1, '같이 밥을 먹으면 정이 올라 ♥1');
  check(g.lines.some(l => l.includes('가까워졌다')), '하트가 오르면 속 이야기 장면');
  // 따라다니기
  await g.goShop(); await g.goVillage();
  check(await g.ev(() => { const M = window.__morak; return Math.abs(M.bud.x - M.P.x) + Math.abs(M.bud.y - M.P.y) <= 3; }), '손님이 주인공 곁을 따라다녀요');
  // 한 해 끝 → 한 해 더
  await g.ev(() => { window.__morak.G.stay.day = 40; }); await g.sleepNow();
  G = await g.G();
  check(G.stay.year === 2 && G.stay.day === 1, '한 해 더를 고르면 두 번째 해');
  // 한 해 끝 → 새로 시작 (도감 이어받기)
  await g.ev(() => { window.__morak.G.stay.day = 40; });
  await g.ev(() => { const M = window.__morak; M.interact(M.MAPS.shop.things.find(t => t.type === 'stairs')); });
  await g.drain(ch => (ch[0].startsWith('잠자리') ? 0 : 2)).catch(() => 'reloaded');
  await g.page.waitForTimeout(1000);
  check((await g.ev(() => document.querySelector('#greet').textContent)).includes('레시피 도감'), '타이틀에 도감 이어받기가 보여요');
  await g.page.click('#btn-new'); await g.page.waitForTimeout(300); await g.drain();
  check(((await g.G()).dex[dish] || []).length === 3, '새 판에도 도감이 이어져요');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
