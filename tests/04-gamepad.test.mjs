// 게임 패드: 화면을 누르지 않고 버튼만으로 시작·대화·걷기·선택·메뉴가 돼요.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url, {
    init: () => {
      window.__pad = { connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      navigator.getGamepads = () => [window.__pad];
    },
  });
  const press = async i => { await g.ev(i => { window.__pad.buttons[i].pressed = true; }, i); await g.page.waitForTimeout(90); await g.ev(i => { window.__pad.buttons[i].pressed = false; }, i); await g.page.waitForTimeout(90); };
  const A = 0, B = 1, X = 2, DOWN = 13;
  await press(A); await g.page.waitForTimeout(400);
  check(await g.ev(() => !!window.__morak.G), 'A로 새 게임이 시작돼요');
  for (let i = 0; i < 80; i++) {
    const s = await g.ev(() => ({ busy: window.__morak.busy, letter: !document.querySelector('#letter').classList.contains('hide') }));
    if (!s.busy) break; if (s.letter) await g.page.waitForTimeout(550); await press(A);
  }
  check((await g.G()).step === 'enter_shop', 'A만으로 프롤로그를 넘겨요');
  const x0 = await g.ev(() => window.__morak.P.x);
  await g.ev(() => { window.__pad.buttons[14].pressed = true; }); await g.page.waitForTimeout(600); await g.ev(() => { window.__pad.buttons[14].pressed = false; });
  check(await g.ev(() => window.__morak.P.x) < x0, '십자 버튼으로 걸어요');
  await g.ev(() => { const M = window.__morak; M.G.step = 'q_geumja'; M.interact(M.map.things.find(t => t.id === 'ijang')); }); await g.page.waitForTimeout(200);
  await press(DOWN); await press(DOWN);
  check(await g.ev(() => document.querySelectorAll('#choices button')[2].classList.contains('sel')), '십자 버튼으로 선택지를 골라요');
  await press(A); await g.page.waitForTimeout(200);
  check(await g.ev(() => document.querySelector('#panel-layer').classList.contains('hide')), '세 번째(이야기한다)를 고르면 상점이 안 열려요');
  for (let i = 0; i < 20; i++) { if (!(await g.ev(() => window.__morak.busy))) break; await press(A); }
  await press(X);
  check(await g.ev(() => document.querySelector('#panel-title').textContent) === '가방', 'X는 가방');
  await press(B);
  check(await g.ev(() => document.querySelector('#panel-layer').classList.contains('hide')), 'B는 닫기');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
