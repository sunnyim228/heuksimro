// 모션그래픽 연출: 손님 도착, 마을 단서, 별의 소문 장, 마지막 화를 화면 가득 움직이는 그림으로 보여 줘요.
// 화면을 누르면 다음 줄로 넘어가요. 그림은 모두 코드로 그려요 (320×180 픽셀을 크게 늘려 보여 줘요).
import { makeAlien, makeChar, mk } from './art.js';
import { LOOKS } from './data.js';

const W = 320, H = 180;
let layer = null, cv = null, g = null, live = null, tapNow = null;

function ensure() {
  if (layer) return;
  layer = document.createElement('div'); layer.id = 'cinema'; layer.className = 'hide';
  layer.innerHTML = '<canvas width="320" height="180"></canvas><div class="cine-tap">눌러서 넘기기 ▸</div><div class="cine-live" aria-live="polite"></div>';
  document.body.appendChild(layer);
  cv = layer.querySelector('canvas'); g = cv.getContext('2d'); g.imageSmoothingEnabled = false; live = layer.querySelector('.cine-live');
  const st = document.createElement('style');
  st.textContent = '#cinema{position:fixed;inset:0;z-index:40;background:#070b1a;display:flex;align-items:center;justify-content:center;cursor:pointer}' +
    '#cinema.hide{display:none}#cinema canvas{width:min(100vw,177.78vh);height:min(56.25vw,100vh);image-rendering:pixelated;image-rendering:crisp-edges}' +
    '#cinema .cine-tap{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));color:#8d93b8;font-size:.75rem}' +
    '#cinema .cine-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
  document.head.appendChild(st);
}

/* ── 그리기 도구 ── */
const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
function ell(col, cx, cy, rx, ry) { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
function txt(s, x, y, col = '#fff4dc', size = 11, align = 'center', shadow = '#0c1124') {
  g.font = `${size}px Galmuri, sans-serif`; g.textAlign = align; g.textBaseline = 'top';
  if (shadow) { g.fillStyle = shadow; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function wrap(s, max = 27) { // 한 줄 글자 수에 맞춰 나눠요
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) { if ((line + ' ' + word).trim().length > max && line) { out.push(line); line = word; } else line = (line + ' ' + word).trim(); }
    out.push(line);
  }
  return out;
}
const ease = p => p < 0 ? 0 : p > 1 ? 1 : 1 - (1 - p) ** 3;
const c01 = p => Math.max(0, Math.min(1, p));
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARS = Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H, p: rnd() * 6.28, b: rnd() }));
const FX = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() * H, v: .4 + rnd() * .8, p: rnd() * 6.28 }));
function stars(t, k = 1) { for (const s of STARS) { const a = (.35 + .65 * Math.abs(Math.sin(t * (1 + s.b) + s.p))) * k; g.fillStyle = `rgba(255,244,220,${a.toFixed(2)})`; g.fillRect(Math.round(s.x), Math.round(s.y), s.b > .9 ? 2 : 1, s.b > .9 ? 2 : 1); } }
function sky(top, bot) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function snow(t, k = 10) { for (const f of FX) { const y = (f.y + t * f.v * k) % H, x = (f.x + Math.sin(t + f.p) * 5 + W) % W; R('rgba(255,244,220,.7)', x, y, 1, 1); } }
function steam(t, x0, y0, h, n = 26) {
  for (let i = 0; i < n; i++) {
    const p = ((t * .35 + i / n) % 1), y = y0 - p * h, x = x0 + Math.sin(p * 9 + i) * (2 + p * 7), r = 1 + Math.round(p * 3);
    g.fillStyle = `rgba(255,244,220,${(.7 * (1 - p)).toFixed(2)})`; g.fillRect(Math.round(x - r / 2), Math.round(y), r, r);
  }
}
function shop(x, y, s = 1) { // 모락 식당 (x, y = 바닥 가운데)
  const w = 56 * s, h = 34 * s;
  R('#5a3d33', x - w / 2, y - h, w, h); R('#7a4f3f', x - w / 2, y - h, w, 3);
  for (let i = 0; i < 10; i++) R('#8c3b2e', x - w / 2 - 6 + i, y - h - 10 + i, w + 12 - i * 2, 1);
  R('#f5c46a', x - 20 * s, y - 24 * s, 12 * s, 9 * s); R('#f5c46a', x + 8 * s, y - 24 * s, 12 * s, 9 * s); R('#3a2620', x - 6 * s, y - 20 * s, 12 * s, 20 * s);
  R('#4a3328', x + 16 * s, y - h - 24, 7, 18); R('#5d4033', x + 15 * s, y - h - 26, 9, 3);
  return [x + 19 * s, y - h - 28];
}
function village(t, glow) {
  sky('#0c1124', '#26305a'); stars(t, .8);
  ell('#f3e2bd', 262, 30, 9, 9); ell('#26305a', 266, 27, 8, 8);
  ell('#1a2244', 60, 170, 120, 40); ell('#1a2244', 270, 172, 110, 36); R('#141a35', 0, 150, W, 30);
  const house = (x, w, h, roof, win) => { R('#2b2f4f', x, 150 - h, w, h); for (let i = 0; i < 6; i++) R(roof, x - 3 + i, 150 - h - 6 + i, w + 6 - i * 2, 1); if (win) R('#f5c46a', x + w / 2 - 3, 150 - h + 5, 5, 4); };
  house(40, 26, 18, '#5b3a4a', true); house(84, 20, 14, '#3e4a6a', false); house(222, 24, 17, '#4a3a5b', true); house(262, 22, 13, '#3e4a6a', true);
  const [cx, cy] = shop(160, 150);
  steam(t, cx, cy, 70 + glow * 30);
  if (glow > 0) {
    const r = (t * 30) % 70; g.strokeStyle = `rgba(245,196,106,${(.5 * (1 - r / 70) * glow).toFixed(2)})`; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, 18, r, 0, 6.28); g.stroke(); ell(`rgba(255,244,220,${(.6 * glow).toFixed(2)})`, cx, 18, 2, 2);
  }
}
function busStop(t, extra) { // 밤의 정류장
  sky('#070b1a', '#1b2a4a'); stars(t, .6);
  ell('#141a35', 80, 176, 140, 30); R('#10152c', 0, 150, W, 30);
  const [cx, cy] = shop(44, 150, .45); steam(t, cx, cy, 90, 22);
  R('#8d93b8', 236, 92, 2, 58); R('#f5c46a', 228, 86, 18, 10); R('#141b33', 230, 88, 14, 6); txt('솥골', 237, 88, '#f5c46a', 6, 'center', null);
  R('#6b4a33', 170, 138, 50, 3); R('#4a3328', 172, 141, 3, 9); R('#4a3328', 215, 141, 3, 9); R('#5a3d28', 170, 128, 50, 2);
  if (extra) extra();
  snow(t);
}
function starBus(x, y) { // 별 막차
  R('#3d4f8c', x, y - 26, 70, 24); R('#5a6ab0', x, y - 26, 70, 3); R('#2b3466', x, y - 4, 70, 3);
  for (let i = 0; i < 4; i++) R('#f5c46a', x + 8 + i * 15, y - 20, 10, 8);
  R('#1d2547', x + 60, y - 20, 7, 17); ell('#141b33', x + 14, y - 1, 5, 5); ell('#141b33', x + 56, y - 1, 5, 5);
  R('#ffe58a', x - 1, y - 32, 3, 1); R('#ffe58a', x, y - 33, 1, 3);
}
function board(t, lines, sign) { // 우주 정거장 게시판
  sky('#0c1124', '#1d2547'); stars(t, .5);
  R('#2a3358', 50, 30, 220, 96); R('#3d4878', 50, 30, 220, 3); R('#1d2547', 50, 123, 220, 3);
  for (const [x, y] of [[54, 34], [262, 34], [54, 118], [262, 118]]) R('#8d93b8', x, y, 3, 3);
  for (let i = 0; i < 14; i++) R('rgba(141,147,184,.35)', 66 + (i * 37) % 180, 42 + (i * 23) % 76, 8 + (i % 4) * 5, 2);
  const all = lines.join(''), n = Math.floor(c01((t - .4) / 2.2) * all.length); let used = 0;
  lines.forEach((l, i) => { txt(l.slice(0, Math.max(0, n - used)), W / 2, 52 + i * 22, '#f5c46a', 14); used += l.length; });
  if (sign && t > 2.8) txt(sign, 250, 106, `rgba(255,244,220,${ease((t - 2.8) / .8)})`, 8, 'right', null);
}
const ART = { // 마을 단서 카드 앞면
  timetable(cx, cy) { for (let r = 0; r < 5; r++) R('#8d93b8', cx - 22, cy - 28 + r * 9, 44, 2); txt('☆ 지구행', cx, cy + 16, '#c4553f', 8, 'center', null); },
  photo(cx, cy) { R('#d9c2a6', cx - 24, cy - 32, 48, 50); ell('#fff', cx + 8, cy - 14, 10, 8); R('#ecd08a', cx - 14, cy - 22, 12, 3); R('#6fa8c9', cx - 13, cy - 12, 11, 18); R('#fff4dc', cx - 22, cy + 8, 20, 8); R('#c4553f', cx - 21, cy + 11, 18, 1); },
  kkakdugi(cx, cy) { for (let j = 0; j < 3; j++) { R('#e07a5f', cx - 20 + j * 14, cy - 8, 10, 10); R('#f3a79a', cx - 20 + j * 14, cy - 8, 10, 2); } },
};
function card(cx, cy, art, p, flip) { // p 나타나기, flip 0→1 뒤집기
  if (p <= 0) return;
  const y = cy + (1 - ease(p)) * 30, w = 62 * Math.abs(Math.cos(flip * Math.PI)) || 2, front = flip > .5;
  R(front ? '#fff4dc' : '#3d4f8c', cx - w / 2, y - 40, w, 80);
  if (!front) { R('#5a6ab0', cx - w / 2 + 3, y - 37, Math.max(0, w - 6), 74); txt('?', cx, y - 8, '#fff4dc', 14, 'center', null); }
  else if (w > 50 && ART[art]) ART[art](cx, y);
}

/* ── 장면 ── */
const sprites = {};
const alienOf = v => sprites[v.id] || (sprites[v.id] = makeAlien(v.alien).down[0]);
const ijangBack = () => sprites.ijangBack || (sprites.ijangBack = makeChar(LOOKS.ijang).up[0]);
const ijangFront = () => sprites.ijangFront || (sprites.ijangFront = makeChar(LOOKS.ijang).down[0]);

export const SCENES = {
  arrive: v => t => { // 저녁 막차가 들어오고 손님이 내려요
    busStop(t, () => {
      const bx = 330 - ease(t / 1.6) * 120; starBus(bx, 148);
      if (t > 1.9) { const p = ease((t - 1.9) / .6), s = 2; g.drawImage(alienOf(v), Math.round(bx + 58 - p * 30), Math.round(148 - 24 * s - Math.sin(p * Math.PI) * 10), 18 * s, 24 * s); }
    });
  },
  clue: c => t => { // 마을 단서: 카드가 나타나 뒤집혀요
    sky('#0c1124', '#1d2547'); stars(t, .4);
    txt('새 단서', W / 2, 14, '#8d93b8', 8, 'center', null);
    card(W / 2, 74, c.art, t / .4, c01((t - .5) / .5));
  },
  board: () => t => board(t, ['지구, 솥골.', '김이 오르는 집.'], '— 국밥을 먹어 본 손님'),
  village: () => t => village(t, ease((t - .8) / 1.5)),
  cards: () => t => { sky('#0c1124', '#1d2547'); stars(t, .4); ['timetable', 'photo', 'kkakdugi'].forEach((a, k) => card(70 + k * 90, 70, a, (t - k * .5) / .4, c01((t - k * .5 - .5) / .5))); },
  bench: () => t => busStop(t, () => g.drawImage(ijangBack(), 186, 114, 16, 22)),
  reveal: () => t => busStop(t, () => { // 이장이 돌아앉아요
    const turn = t > 1.2; g.drawImage(turn ? ijangFront() : ijangBack(), 186, 114, 16, 22);
    if (t > 1.6) { const a = ease((t - 1.6) / 1); ell(`rgba(255,229,138,${(.9 * a).toFixed(2)})`, 120, 30, 2, 2); g.strokeStyle = `rgba(255,229,138,${(.3 * a).toFixed(2)})`; g.beginPath(); g.arc(120, 30, 6 + Math.sin(t * 3) * 2, 0, 6.28); g.stroke(); }
  }),
  together: () => t => busStop(t, () => { // 둘이 나란히 앉아 국밥을 먹어요
    g.drawImage(ijangFront(), 180, 114, 16, 22); R('#fff4dc', 199, 130, 10, 4); R('#4a3328', 199, 133, 10, 2); steam(t, 204, 128, 20, 8);
  }),
};
export const SCENE_TITLE = t => { sky('#0c1124', '#141b33'); stars(t, .7); };

/* ── 재생 ── */
const TEST = /[?&]test\b/.test(location.search);
// caps: ['줄', {who:'이장', text}, {title:'1장 · 소문'}]. 화면을 누르면 다음 줄, 가만히 두어도 넘어가요.
// 줄이 없으면 dur초 동안 그림만 보여 줘요.
export function play(scene, caps = [], { dur = 2.8 } = {}) {
  ensure();
  const lines = caps.map(c => typeof c === 'string' ? { text: c } : c);
  return new Promise(resolve => {
    layer.classList.remove('hide');
    const t0 = performance.now(), now = () => (performance.now() - t0) / 1000;
    let idx = 0, lineT = 0, done = false;
    const show = () => { const l = lines[idx]; const s = l ? (l.title || (l.who ? l.who + ': ' : '') + l.text) : ''; live.textContent = s; if (l) layer.dataset.caption = s; };
    const next = () => { idx++; lineT = now(); if (idx >= lines.length) finish(); else show(); };
    function finish() { if (done) return; done = true; tapNow = null; layer.removeEventListener('click', onTap); document.removeEventListener('keydown', onKey, true); layer.classList.add('hide'); delete layer.dataset.caption; resolve(); }
    const onTap = () => { if (now() - lineT < .3) return; if (lines.length) next(); else finish(); };
    const onKey = e => { if (['Space', 'Enter', 'KeyZ', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); onTap(); } };
    layer.addEventListener('click', onTap); document.addEventListener('keydown', onKey, true); tapNow = onTap;
    show();
    (function frame() {
      if (done) return;
      const t = now(), l = lines[idx];
      g.clearRect(0, 0, W, H); scene(t);
      if (l && l.title) {
        const a = ease((t - lineT) / .6);
        g.fillStyle = `rgba(7,11,26,${(.5 * a).toFixed(2)})`; g.fillRect(0, 66, W, 40);
        txt(l.title, W / 2, 76 + (1 - a) * 4, `rgba(245,196,106,${a})`, 16);
        if (!TEST && t - lineT > 2.2) next();
      } else if (l) {
        const a = ease((t - lineT) / .5), rows = wrap(l.text), y0 = 168 - rows.length * 13;
        g.fillStyle = `rgba(7,11,26,${(.6 * a).toFixed(2)})`; g.fillRect(0, y0 - (l.who ? 18 : 6), W, H);
        if (l.who) txt(l.who, 16, y0 - 14, `rgba(245,196,106,${a})`, 8, 'left', null);
        rows.forEach((r, i) => txt(r, W / 2, y0 + i * 13, `rgba(255,244,220,${a})`, 11));
        if (!TEST && t - lineT > Math.max(2.8, l.text.length * .12)) next();
      } else if (!lines.length && t > (TEST ? .1 : dur)) finish();
      const fade = Math.max(0, 1 - t / .4); if (fade) { g.fillStyle = `rgba(7,11,26,${fade.toFixed(2)})`; g.fillRect(0, 0, W, H); }
      requestAnimationFrame(frame);
    })();
  });
}
export const isOpen = () => !!layer && !layer.classList.contains('hide');
export const tap = () => tapNow && tapNow(); // 게임패드 A 버튼
