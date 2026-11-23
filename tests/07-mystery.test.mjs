// 별의 소문: 손님과 마을에서 단서를 모으고, 일정 개수마다 이야기가 풀려요.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  const log = (...a) => process.env.DBG && console.log('  ·', ...a);
  await g.newGame(); log('new');
  await g.ev(() => { const G = window.__morak.G; G.step = 'q_geumja'; G.recipes = ['egg_rice']; });
  await g.sleepNow(); log('slept');
  let G = await g.G();
  check(G.clues.includes('eunha_arrive'), '첫 손님이 도착하며 소문 단서를 줘요');
  // ♥2가 되면 단서
  await g.ev(() => { const M = window.__morak; M.G.stay.bond = 46; M.G.stay.talked = false; M.talkBuddy(); });
  await g.drain(ch => Math.max(0, ch.findIndex(c => c.includes('이야기'))));
  G = await g.G();
  check(G.clues.includes('eunha_h2'), '♥2에 손님이 단서를 털어놓아요');
  // 단서 3개가 되면 버스 정류장에서 마을 단서, 5개면 1장이 풀려요
  await g.ev(() => { window.__morak.G.clues.push('bori_arrive'); });
  g.lines.length = 0;
  await g.ev(() => { const M = window.__morak; M.interact(M.MAPS.village.things.find(t => t.type === 'bus')); });
  await g.drain();
  check((await g.G()).clues.includes('v_bus'), '단서 3개 뒤 버스 정류장에서 손글씨를 찾아요');
  await g.ev(() => { window.__morak.G.clues = window.__morak.G.clues.filter(c => c !== 'eunha_h4'); });
  await g.ev(async () => { const M = window.__morak; M.G.stay.bond = 96; M.G.stay.talked = false; M.talkBuddy(); });
  g.lines.length = 0; await g.drain(ch => Math.max(0, ch.findIndex(c => c.includes('이야기'))));
  G = await g.G();
  check(G.clues.length >= 5, '단서 5개');
  check(g.lines.some(l => l.includes('1장')), '단서 5개가 모이면 「1장」이 풀려요');
  // 마지막 화 (모션그래픽)
  g.lines.length = 0;
  await g.ev(() => { window.__morak.playFinale(); });
  await g.drain();
  check((await g.G()).flags.finale1, '마지막 화를 보면 표시가 남아요');
  check(g.lines.some(l => l.includes('덕수')), '마지막 화에서 첫 손님의 이름이 나와요');
  // 별의 소문 화면
  await g.ev(() => { window.__morak.openClues(); }); await g.page.waitForTimeout(200);
  const head = await g.ev(() => document.querySelector('#panel-body p').innerText);
  check(head.includes('모은 단서'), '별의 소문 화면에 진행이 보여요');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
