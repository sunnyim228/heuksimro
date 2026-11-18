// 자동 테스트 공통 도구: 작은 웹 서버, 게임 열기, 대화 넘기기, 걷기·요리 같은 조작
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.gif': 'image/gif', '.md': 'text/plain; charset=utf-8' };

export function serve(root) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() }));
  });
}

export function check(ok, msg) { if (!ok) throw new Error(msg); }

// 게임 한 판을 여는 도우미. 반환값의 함수들로 화면을 조작해요.
export async function openGame(browser, url, { viewport = { width: 1000, height: 660 }, init } = {}) {
  const ctx = await browser.newContext({ viewport });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(url + '?test'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);

  const lines = [];
  // 대화·편지·선택지를 끝까지 넘겨요. pick(선택지 글자 배열) → 고를 번호
  async function drain(pick = () => 0, max = 300) {
    for (let i = 0; i < max; i++) {
      const s = await ev(() => ({
        letter: !document.querySelector('#letter').classList.contains('hide'),
        dlg: !document.querySelector('#dlg-layer').classList.contains('hide'),
        ch: [...document.querySelectorAll('#choices button')].map(b => b.textContent),
        busy: window.__morak.busy, panel: !document.querySelector('#panel-layer').classList.contains('hide'),
        name: document.querySelector('#dlg-name').textContent,
      }));
      if (s.letter) { await p.waitForTimeout(550); await p.click('#letter'); }
      else if (s.ch.length) await p.click(`#choices button[data-i="${pick(s.ch)}"]`);
      else if (s.dlg) {
        await p.keyboard.press('Space'); await p.waitForTimeout(30);
        lines.push((s.name ? s.name + ': ' : '') + await ev(() => document.querySelector('#dlg-text').textContent));
        await p.keyboard.press('Space');
      }
      else if (s.panel) return 'panel';
      else if (!s.busy) return 'idle';
      await p.waitForTimeout(50);
    }
    throw new Error('대화가 끝나지 않아요');
  }
  async function idle(ms = 9000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await ev(() => { const M = window.__morak; return !M.P.moving && !(M.P.path && M.P.path.length) && !M.P.onArrive && !M.P.act; })) return;
      await p.waitForTimeout(50);
    }
    throw new Error('주인공이 멈추지 않아요');
  }
  // 지금 지도에서 조건에 맞는 것을 눌러 그곳까지 걸어가 써요
  async function use(sel, pick) {
    const pos = await ev(src => { const M = window.__morak; const th = M.map.things.find(eval(src)); return th ? M.toScreen(th.x, th.y) : null; }, sel);
    check(pos, `찾을 수 없어요: ${sel}`);
    await ev(([x, y]) => { window.__morak.tapWorld(x, y); }, pos);
    await p.waitForTimeout(60); await idle(); await p.waitForTimeout(80);
    return drain(pick);
  }
  async function take(id) {
    check(await use(`t=>t.type==='pantry'`) === 'panel', '선반이 안 열려요');
    await p.click(`#panel-body [data-v="${id}"]`); await p.waitForTimeout(80);
  }
  async function cook(rid) {
    const r = await ev(async id => { const { RECIPES } = await import('./js/data.js'); return RECIPES[id]; }, rid);
    for (const ing of r.ing) {
      await take(ing.replace(/_c$/, ''));
      if (ing.endsWith('_c')) { await use(`t=>t.type==='board'`); await idle(); }
      await use(`t=>t.type==='cooker'&&t.kind==='${r.cooker}'`);
    }
    for (let i = 0; i < 100; i++) { if (await ev(k => window.__morak.MAPS.shop.things.some(t => t.type === 'cooker' && t.kind === k && t.result), r.cooker)) break; await p.waitForTimeout(100); }
    await use(`t=>t.type==='cooker'&&t.kind==='${r.cooker}'&&t.result`);
  }
  const give = items => ev(o => { for (const k in o) window.__morak.addItem(k, o[k]); }, items);
  const G = () => ev(() => JSON.parse(JSON.stringify(window.__morak.G)));
  const goShop = async () => { await use(`t=>t.type==='door'&&t.to==='shop'`); await p.waitForTimeout(700); await drain(); };
  const goVillage = async () => { await use(`t=>t.type==='door'&&t.to==='village'`); await p.waitForTimeout(700); await drain(); };
  const sleepNow = async pick => { await ev(() => { const M = window.__morak; M.interact(M.MAPS.shop.things.find(t => t.type === 'stairs')); }); return drain(pick || (ch => (ch[0].startsWith('잠자리') ? 0 : 0))); };
  const newGame = async () => { await p.click('#btn-new'); await p.waitForTimeout(300); await drain(); };
  return { page: p, ctx, ev, drain, idle, use, take, cook, give, G, goShop, goVillage, sleepNow, newGame, lines, errors };
}
