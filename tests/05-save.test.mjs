// 저장: 예전 버전 저장 옮기기, 깨진 저장은 백업으로, 백업 코드 주고받기, 확인 창 없이 지우기.
import { openGame, check } from './lib.mjs';

export default async function ({ browser, url }) {
  const g = await openGame(browser, url);
  // 1) 옛 형식(v1) 저장 — 빈 칸이 많고 '진짜 레시피북'이 있던 시절
  await g.ev(() => localStorage.setItem('morak-save-v1', JSON.stringify({ v: 1, name: '옛손님', day: 9, time: 480, coins: 77, inv: { rice: 2 }, recipes: ['egg_rice'], mem: [], flags: {}, step: 'homestay', map: 'village', x: 28, y: 16, taken: {}, fishLeft: 5, book: ['gamjajeon'], stay: { day: 3, len: 40, year: 1, today: 'egg_rice', taught: false } })));
  await g.page.reload(); await g.page.waitForTimeout(500);
  check(await g.ev(() => !document.querySelector('#btn-continue').classList.contains('hide')), '옛 저장도 이어하기가 보여요');
  await g.page.click('#btn-continue'); await g.page.waitForTimeout(300); await g.drain();
  let G = await g.G();
  check(G.v === 2 && G.coins === 77 && G.dex.gamjajeon && !G.book && G.bank && G.body, '옛 저장이 새 형식으로 옮겨져요');
  // 2) 하루가 바뀌면 어제 저장이 백업으로 남고, 저장이 깨지면 백업으로 열려요
  await g.ev(() => window.__morak.save());
  await g.sleepNow();
  check(await g.ev(() => !!localStorage.getItem('morak-save-backup')), '잠자리에 들면 백업이 남아요');
  await g.ev(() => localStorage.setItem('morak-save-v1', '{깨진 저장'));
  await g.page.reload(); await g.page.waitForTimeout(500);
  await g.page.click('#btn-continue'); await g.page.waitForTimeout(300); await g.drain();
  check((await g.G()).name === '옛손님', '깨진 저장 대신 백업으로 이어해요');
  // 3) 백업 코드로 내보내고 불러오기
  await g.page.click('[data-open="set"]'); await g.page.click('#panel-body [data-a="backup"]'); await g.page.waitForTimeout(200);
  const code = await g.ev(() => document.querySelector('#bk-out').value);
  check(code.length > 50, '백업 코드가 만들어져요');
  await g.ev(() => { window.__morak.G.coins = 1; window.__morak.save(); });
  await g.page.fill('#bk-in', code); await g.page.click('#panel-body [data-a="load"]'); await g.page.waitForTimeout(200);
  await g.drain(() => 0).catch(() => 'reloaded'); await g.page.waitForTimeout(800);
  await g.page.click('#btn-continue'); await g.page.waitForTimeout(300); await g.drain();
  check((await g.G()).coins !== 1, '백업 코드로 불러오면 그때 진행으로 돌아가요');
  // 4) 타이틀 '새로 시작'은 두 번 눌러야 저장을 지워요 (브라우저 확인 창 없음)
  await g.ev(() => window.__morak.save());
  await g.page.reload(); await g.page.waitForTimeout(500);
  await g.page.click('#btn-new'); await g.page.waitForTimeout(200);
  check(await g.ev(() => !window.__morak.G), '한 번 누르면 아직 시작하지 않아요');
  await g.page.click('#btn-new'); await g.page.waitForTimeout(300); await g.drain();
  check((await g.G()).name !== '옛손님', '두 번 누르면 새로 시작');
  check(!g.errors.length, '페이지 오류: ' + g.errors.join(' / '));
  await g.ctx.close();
}
