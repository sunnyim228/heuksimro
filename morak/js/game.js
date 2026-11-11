// 모락모락 — 솥골 식당 이야기 : 게임 엔진
import { T, buildSprites, renderGround, makeChar, portrait, itemIcon, iconURL, puff, rng } from './art.js';
import { ITEMS, SHOP_LIST, RECIPES, RECIPE_ORDER, COOKER_NAME, MEMORIES, itemName, baseOf, LOOKS, NPC_NAME, GUEST_LOOKS, GUEST_LINES, NPC_GUEST_LINES } from './data.js';
import { makeStory, GOALS } from './story.js';
import * as Au from './audio.js';

const $ = s => document.querySelector(s);
const cvs = $('#game'), ctx = cvs.getContext('2d');
const SAVE = 'morak-save-v1';
const D4 = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let VW = 320, VH = 180, SCALE = 3;
let G = null;            // 저장되는 진행 상태
let map = null;          // 지금 있는 지도
const MAPS = {};
let SPR = null;
const CHARS = {};        // 캐릭터 스프라이트
let mode = 'title', busy = 0, tAnim = 0, svc = null;
let camX = 0, camY = 0;
const P = { x: 0, y: 0, px: 0, py: 0, fx: 0, fy: 0, dir: 'down', moving: false, mt: 0, walkT: 0, path: null, onArrive: null, hands: null, act: null, fish: null, bumped: false };
const keys = {};
const particles = [], floaters = [];
let tapMark = null;

/* ═════════ 화면 크기 ═════════ */
function resize() {
  const w = innerWidth, h = innerHeight;
  SCALE = Math.max(2, Math.round(Math.min(w, h * 1.5) / 380));
  VW = Math.ceil(w / SCALE); VH = Math.ceil(h / SCALE);
  cvs.width = VW; cvs.height = VH;
  cvs.style.width = VW * SCALE + 'px'; cvs.style.height = VH * SCALE + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);

/* ═════════ 지도 만들기 ═════════ */
function makeMap(name, w, h, edge) {
  return { name, w, h, edge, kind: new Array(w * h).fill(edge), solid: new Uint8Array(w * h), things: [], decor: [], grid: null, ground: null };
}
const setK = (m, x, y, k) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.kind[y * m.w + x] = k; };
const fillK = (m, x0, y0, x1, y1, k) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setK(m, x, y, k); };
function add(m, th) {
  th.w = th.w || 1; th.h = th.h || 1;
  if (th.solid === undefined) th.solid = true;
  m.things.push(th); return th;
}
function finishMap(m) {
  for (let i = 0; i < m.kind.length; i++) if (m.kind[i] === 'w' || m.kind[i] === 'v' || m.kind[i] === 'W') m.solid[i] = 1;
  m.grid = Array.from({ length: m.w * m.h }, () => []);
  for (const th of m.things) for (let y = th.y; y < th.y + th.h; y++) for (let x = th.x; x < th.x + th.w; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.grid[y * m.w + x].push(th);
  m.ground = [renderGround(m, 0), renderGround(m, 1)];
}

function buildVillage() {
  const m = makeMap('village', 46, 38, 'g'), r = rng(8126);
  // 바다와 모래
  for (let x = 0; x < m.w; x++) {
    const top = 25 + (Math.sin(x * 1.3) > 0.5 ? 1 : 0);
    const shore = 30 + (Math.sin(x * 0.7) + Math.sin(x * 0.23 + 1) > 0.6 ? 1 : 0);
    for (let y = top; y < m.h; y++) setK(m, x, y, y >= shore ? 'w' : 's');
  }
  // 길
  fillK(m, 0, 17, 45, 18, 'p'); fillK(m, 22, 2, 23, 26, 'p'); fillK(m, 8, 8, 33, 8, 'p'); setK(m, 32, 7, 'p');
  fillK(m, 27, 16, 29, 16, 'p'); fillK(m, 13, 16, 18, 16, 'p'); setK(m, 6, 16, 'p');
  fillK(m, 34, 12, 39, 14, 'd');            // 텃밭
  fillK(m, 22, 30, 23, 35, 'k');            // 부두

  const clear = new Set();                    // 나무가 나면 안 되는 칸
  const keep = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) clear.add(x + ',' + y); };
  const building = (spr, x, y, w, h, door) => {
    add(m, { type: 'building', x, y, w, h, spr });
    keep(x - 1, y - 1, x + w, y + h + 1);
    for (const d of door.tiles) add(m, { type: 'door', x: d, y: y + h - 1, to: door.to, solid: false, act: true });
  };
  building(SPR.houseShop, 25, 11, 7, 5, { tiles: [28], to: 'shop' });
  building(SPR.houseStall, 12, 12, 6, 4, { tiles: [14, 15], to: null });
  building(SPR.houseSori, 4, 12, 5, 4, { tiles: [6], to: null });
  building(SPR.houseCabin, 30, 3, 5, 4, { tiles: [32], to: null });
  building(SPR.houseHut, 6, 23, 4, 3, { tiles: [7, 8], to: null });

  // 사람들
  const npc = (id, x, y) => { add(m, { type: 'npc', id, x, y, act: true, tall: true }); keep(x - 1, y - 1, x + 1, y + 1); };
  npc('ijang', 17, 16); npc('geumja', 11, 27); npc('sori', 9, 20); npc('doyun', 34, 8); npc('captain', 23, 35);

  // 소품
  const deco = (spr, x, y, o = {}) => { keep(x, y, x + (o.w || 1) - 1, y); return add(m, { type: o.type || 'deco', x, y, spr, ...o }); };
  deco(SPR.crates, 18, 15); deco(SPR.well, 20, 14, { type: 'look', id: 'well', act: true, tall: true });
  deco(SPR.lamp, 24, 16); deco(SPR.lamp, 21, 19);
  deco(SPR.busstop, 43, 16, { type: 'look', id: 'busstop', act: true, tall: true });
  deco(SPR.sign, 24, 10, { type: 'look', id: 'sign_forest', act: true });
  deco(SPR.sign, 24, 22, { type: 'look', id: 'sign_beach', act: true });
  deco(SPR.bench, 25, 28, { w: 2, type: 'look', id: 'bench', act: true });
  deco(SPR.cat0, 30, 16, { type: 'look', id: 'cat', act: true, cat: true });
  deco(SPR.logs, 35, 6); deco(SPR.stump, 36, 8); deco(SPR.swing, 11, 20);
  add(m, { type: 'deco', x: 25, y: 33, w: 2, spr: SPR.boat, solid: false, bobs: true });
  for (let x = 33; x <= 40; x++) deco(SPR.fenceH, x, 11);
  for (let y = 12; y <= 14; y++) { deco(SPR.fenceV, 33, y, { ax: -4 }); deco(SPR.fenceV, 40, y, { ax: 4 }); }
  keep(32, 10, 41, 16); keep(20, 0, 25, 30); keep(6, 7, 34, 9); keep(5, 18, 13, 23); keep(40, 15, 45, 20);

  // 텃밭 · 채집
  const node = (id, item, n, spr, x, y) => { add(m, { type: 'node', id, item, n, spr, x, y, act: true }); keep(x - 1, y - 1, x + 1, y + 1); };
  [['pa', SPR.crop_pa], ['pa', SPR.crop_pa], ['mu', SPR.crop_mu], ['mu', SPR.crop_mu], ['gamja', SPR.crop_gamja], ['gamja', SPR.crop_gamja]]
    .forEach(([it, spr], i) => node('crop' + i, it, 2, spr, 34 + i, 13));
  [[9, 4], [14, 6], [18, 4], [26, 7]].forEach(([x, y], i) => node('mush' + i, 'mushroom', 2, SPR.node_mushroom, x, y));
  [[11, 6], [16, 3], [7, 6]].forEach(([x, y], i) => node('namul' + i, 'namul', 2, SPR.node_namul, x, y));
  [[15, 28], [18, 27], [30, 28], [36, 27]].forEach(([x, y], i) => node('clam' + i, 'clam', 2, SPR.node_clam, x, y));
  [[13, 29], [27, 29], [33, 29], [39, 29]].forEach(([x, y], i) => node('miyeok' + i, 'miyeok', 2, SPR.node_miyeok, x, y));
  add(m, { type: 'fish', x: 21, y: 34, act: true, solid: false });

  // 숲과 나무, 꽃
  const K = (x, y) => m.kind[y * m.w + x];
  for (let y = 0; y < 25; y++) for (let x = 0; x < m.w; x++) {
    if (K(x, y) !== 'g' || clear.has(x + ',' + y)) { r(); continue; }
    let p;
    if (y <= 1) p = 0.92;
    else if (y <= 10) p = (x >= 6 && x <= 20 && y >= 3 && y <= 7) ? 0.07 : (x >= 28 && x <= 37 && y <= 9) ? 0.12 : y >= 9 ? 0.28 : 0.5;
    else p = (x <= 1 || x >= 44) ? 0.5 : 0.035;
    const v = r();
    if (v < p) add(m, { type: 'deco', x, y, spr: y <= 10 ? (r() < 0.45 ? SPR.pine : (r() < 0.5 ? SPR.tree : SPR.tree2)) : (r() < 0.5 ? SPR.tree : SPR.tree2) });
    else if (v < p + 0.02) add(m, { type: 'deco', x, y, spr: r() < 0.6 ? SPR.bush : SPR.rock });
  }
  const fl = [SPR.flowerA, SPR.flowerB, SPR.flowerC];
  for (let y = 2; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = K(x, y), v = r();
    const meadow = x >= 5 && x <= 13 && y >= 18 && y <= 23;
    if (k === 'g' && v < (meadow ? 0.5 : 0.1)) m.decor.push({ spr: fl[Math.floor(r() * 3)], px: x * T + 1 + Math.floor(r() * 8), py: y * T + 1 + Math.floor(r() * 8) });
    else if (k === 's' && v < 0.05) m.decor.push({ spr: r() < 0.6 ? SPR.shell : SPR.starfish, px: x * T + 2 + Math.floor(r() * 7), py: y * T + 2 + Math.floor(r() * 7) });
  }
  finishMap(m);
  return m;
}

function buildShop() {
  const m = makeMap('shop', 16, 11, 'v');
  fillK(m, 1, 1, 14, 9, 'f'); fillK(m, 1, 0, 14, 0, 'W'); fillK(m, 7, 10, 8, 10, 'f');
  m.decor.push({ spr: SPR.window, px: 3 * T + 8, py: 1 }, { spr: SPR.shelf, px: 6 * T + 3, py: 1 }, { spr: SPR.window, px: 9 * T + 1, py: 1 },
    { spr: SPR.rug, px: 5 * T + 8, py: 7 * T + 2 }, { spr: SPR.mat, px: 7 * T, py: 10 * T + 3 });
  const st = (type, x, spr, o = {}) => add(m, { type, x, y: 1, spr, act: true, tall: true, ...o });
  st('pantry', 1, SPR.pantry, { w: 2 });
  st('board', 3, SPR.board);
  st('counter', 4, SPR.counter, { item: null });
  st('cooker', 5, SPR.stove_pot, { kind: 'pot', contents: [], cook: null, result: null });
  st('cooker', 6, SPR.stove_pan, { kind: 'pan', contents: [], cook: null, result: null });
  st('counter', 7, SPR.counter, { item: null });
  st('sink', 8, SPR.sink);
  st('book', 9, SPR.bookstand);
  st('counter', 10, SPR.counter, { item: null });
  st('cooker', 11, SPR.cauldron0, { w: 2, kind: 'cauldron', contents: [], cook: null, result: null });
  st('stairs', 14, SPR.stairs);
  add(m, { type: 'look', id: 'photo', x: 13, y: 0, spr: SPR.photo, ay: -3, act: true });
  m.tables = [3, 8, 12].map((x, i) => {
    const t = add(m, { type: 'table', idx: i, x, y: 6, spr: SPR.table, ay: -5, act: true, cust: null, dish: null });
    add(m, { type: 'seat', table: t, x, y: 5, spr: SPR.stool, ay: -3, act: true, tall: true, forGuest: true });
    return t;
  });
  add(m, { type: 'sign', x: 10, y: 9, spr: SPR.signClosed, act: true, tall: true });
  add(m, { type: 'deco', x: 1, y: 9, spr: SPR.plant }); add(m, { type: 'deco', x: 14, y: 9, spr: SPR.plant });
  add(m, { type: 'door', x: 7, y: 10, to: 'village', act: true }); add(m, { type: 'door', x: 8, y: 10, to: 'village', act: true });
  finishMap(m);
  m.bg = '#2b1d18';
  return m;
}

/* ═════════ 칸 검사 · 길 찾기 ═════════ */
const visible = th => !(th.type === 'node' && G && G.taken[th.id]);
function thingsAt(x, y) { return (x < 0 || y < 0 || x >= map.w || y >= map.h) ? [] : map.grid[y * map.w + x]; }
function actAt(x, y) { return thingsAt(x, y).find(t => t.act && visible(t)); }
function passable(x, y, guest = false) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h || map.solid[y * map.w + x]) return false;
  for (const t of map.grid[y * map.w + x]) if (t.solid && visible(t) && !(guest && t.forGuest)) return false;
  return true;
}
function bfs(sx, sy, goal, pass) {
  const W = map.w, start = sy * W + sx, prev = new Int32Array(W * map.h).fill(-1), q = [start];
  prev[start] = start; let found = -1;
  for (let i = 0; i < q.length; i++) {
    const c = q[i], x = c % W, y = (c / W) | 0;
    if (goal(x, y)) { found = c; break; }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, n = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= map.h || prev[n] !== -1 || !pass(nx, ny)) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (found < 0) return null;
  const path = []; let c = found;
  while (c !== start) { path.push([c % W, (c / W) | 0]); c = prev[c]; }
  return path.reverse();
}
const adjacent = (th, x, y) =>
  (x >= th.x && x < th.x + th.w && (y === th.y - 1 || y === th.y + th.h)) ||
  (y >= th.y && y < th.y + th.h && (x === th.x - 1 || x === th.x + th.w));
function faceThing(th) {
  if (P.y >= th.y + th.h) P.dir = 'up'; else if (P.y < th.y) P.dir = 'down';
  else if (P.x < th.x) P.dir = 'right'; else P.dir = 'left';
}

/* ═════════ 가방 ═════════ */
const inv = id => G.inv[id] || 0;
function addItem(id, n = 1) { G.inv[id] = inv(id) + n; if (G.inv[id] <= 0) delete G.inv[id]; }
function looseItems() {
  const out = [];
  if (P.hands) out.push(P.hands);
  for (const t of MAPS.shop.things) {
    if (t.type === 'counter' && t.item) out.push(t.item);
    if (t.type === 'cooker') { out.push(...t.contents); if (t.result) out.push(t.result); }
  }
  return out;
}
function collectLoose() {
  for (const id of looseItems()) addItem(id);
  P.hands = null;
  for (const t of MAPS.shop.things) {
    if (t.type === 'counter') t.item = null;
    if (t.type === 'cooker') { t.contents = []; t.result = null; t.cook = null; }
    if (t.type === 'table') { t.dish = null; t.cust = null; }
  }
}
function stock(base) { // 손질 여부·들고 있는 것까지 합친 재료 수
  let n = inv(base) + inv(base + '_c');
  for (const id of looseItems()) if (baseOf(id) === base && !RECIPES[id]) n++;
  return n;
}
function dishStock(rid) { return inv(rid) + looseItems().filter(i => i === rid).length; }
function needOf(rid) { const need = {}; for (const i of RECIPES[rid].ing) need[baseOf(i)] = (need[baseOf(i)] || 0) + 1; return need; }
function servings(rid, reserved = {}) {
  let n = Infinity; const need = needOf(rid);
  for (const b in need) n = Math.min(n, Math.floor((stock(b) - (reserved[b] || 0)) / need[b]));
  return Math.max(0, n);
}

/* ═════════ 저장 ═════════ */
function newState(name) {
  return { v: 1, name: name || '하루', day: 1, time: 8 * 60, coins: 10, inv: {}, recipes: [], mem: [], flags: {}, step: 'intro', map: 'village', x: 42, y: 17, taken: {}, fishLeft: 5, servedToday: false, stats: { served: 0, earned: 0 } };
}
function save() {
  if (!G || mode !== 'play') return;
  const invAll = { ...G.inv };
  for (const id of looseItems()) invAll[id] = (invAll[id] || 0) + 1;
  // 영업 중에 닫으면 가게 안 문 앞에서 다시 시작해요
  const data = { ...G, inv: invAll, map: map.name, x: svc ? 7 : P.x, y: svc ? 9 : P.y };
  try { localStorage.setItem(SAVE, JSON.stringify(data)); } catch (e) { /* 저장 공간이 없으면 건너뜀 */ }
}
function load() { try { const d = JSON.parse(localStorage.getItem(SAVE)); return d && d.v === 1 ? d : null; } catch (e) { return null; } }

/* ═════════ UI: 알림 · 말풍선 ═════════ */
function toast(text, icon, ms = 3200) {
  const el = document.createElement('div');
  el.className = 'toast box';
  el.innerHTML = (icon ? `<img class="ic s" src="${iconURL(icon)}"> ` : '') + esc(text);
  $('#toasts').appendChild(el);
  while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function no(text) { Au.sfx('no'); toast(text); }
function floater(wx, wy, text, cls = 'float', life = 1.4) {
  const el = document.createElement('div'); el.className = cls; el.textContent = text;
  $('#floaters').appendChild(el);
  floaters.push({ el, wx, wy, life, max: life, rise: cls === 'float' });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.life -= dt;
    if (f.life <= 0) { f.el.remove(); floaters.splice(i, 1); continue; }
    const up = f.rise ? (1 - f.life / f.max) * 14 : 0;
    f.el.style.left = (f.wx - camX) * SCALE + 'px'; f.el.style.top = (f.wy - camY - up) * SCALE + 'px';
    f.el.style.opacity = Math.min(1, f.life * 3);
  }
}
function clearFloaters() { for (const f of floaters) f.el.remove(); floaters.length = 0; }

function refreshHUD() {
  if (!G) return;
  const h = Math.floor(G.time / 60), mi = Math.floor(G.time % 60 / 10) * 10;
  const ap = h < 12 ? '오전' : '오후', hh = h % 12 === 0 ? 12 : h % 12;
  $('#status').innerHTML = `${G.day}일째 · ${ap} ${hh}:${String(mi).padStart(2, '0')}<br><img class="ic s" src="${iconURL('coin')}"> <b>${G.coins}</b>닢`;
  const goal = GOALS[G.step] || '';
  $('#goal').classList.toggle('hide', !goal || !!svc);
  $('#goal .txt').textContent = goal;
  $('#svcbar').classList.toggle('hide', !svc);
  if (svc) $('#svcbar').textContent = `영업 중 · 대접 ${svc.served}그릇 · 남은 손님 ${svc.left + svc.cust.filter(c => c.state !== 'out').length}명`;
}

/* ═════════ UI: 대화 ═════════ */
let dlg = null; // {full, shown, resolve, t}
const faceCache = {};
function showDialog(who, text, center) {
  return new Promise(resolve => {
    const layer = $('#dlg-layer');
    layer.classList.remove('hide'); layer.classList.toggle('center', !!center);
    const name = who === 'me' ? G.name : NPC_NAME[who];
    $('#dlg-name').textContent = name || ''; $('#dlg-name').classList.toggle('hide', !name || center);
    const face = $('#dlg-face'); face.classList.toggle('hide', !who || center);
    if (who && !center) {
      const key = who === 'me' ? 'player' : who;
      const pc = faceCache[key] || (faceCache[key] = portrait(CHARS[key], 4));
      const g = face.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 56, 52); g.drawImage(pc, 0, 0);
    }
    $('#choices').innerHTML = ''; $('#dlg-next').classList.add('hide');
    $('#dlg-text').textContent = '';
    dlg = { full: text, shown: 0, resolve, t: 0, done: false };
  });
}
function updateDialog(dt) {
  if (!dlg || dlg.done) return;
  dlg.t += dt * 42;
  const n = Math.min(dlg.full.length, Math.floor(dlg.t));
  if (n !== dlg.shown) {
    dlg.shown = n; $('#dlg-text').textContent = dlg.full.slice(0, n);
    if (n % 3 === 0) Au.sfx('blip');
  }
  if (n >= dlg.full.length) { dlg.done = true; if (!dlg.choice) $('#dlg-next').classList.remove('hide'); }
}
function advanceDialog() {
  if (!dlg || dlg.choice) return;
  if (!dlg.done) { dlg.t = dlg.full.length; updateDialog(0); return; }
  const r = dlg.resolve; dlg = null; $('#dlg-layer').classList.add('hide'); r();
}
let blackOn = false;
const UI = {
  say: (who, text) => showDialog(who, text, false),
  narr: text => showDialog(null, text, blackOn),
  black(on) { blackOn = on; $('#black').classList.toggle('on', on); return new Promise(r => setTimeout(r, 380)); },
  letter(text) {
    return new Promise(resolve => {
      Au.sfx('page');
      $('#letter-text').textContent = text; $('#letter').classList.remove('hide');
      const t0 = performance.now();
      const close = () => { if (performance.now() - t0 < 500) return; $('#letter').classList.add('hide'); $('#letter').onclick = null; letterClose = null; resolve(); };
      $('#letter').onclick = close; letterClose = close;
    });
  },
  choose(options) {
    return new Promise(resolve => {
      const layer = $('#dlg-layer'); layer.classList.remove('hide', 'center');
      $('#dlg-name').classList.add('hide'); $('#dlg-face').classList.add('hide'); $('#dlg-next').classList.add('hide');
      $('#dlg-text').textContent = '어떻게 할까?';
      dlg = { choice: true, done: true, full: '', options, pick: i => { dlg = null; layer.classList.add('hide'); $('#choices').innerHTML = ''; Au.sfx('blip'); resolve(i); } };
      $('#choices').innerHTML = options.map((o, i) => `<button class="btn" data-i="${i}">${esc(o)}</button>`).join('');
    });
  },
};
let letterClose = null;
$('#choices').addEventListener('click', e => { const b = e.target.closest('button'); if (b && dlg && dlg.choice) { e.stopPropagation(); dlg.pick(+b.dataset.i); } });
$('#dlg-layer').addEventListener('click', () => advanceDialog());

async function runScene(fn) {
  busy++; P.path = null; P.onArrive = null;
  try { await fn(); } finally { busy--; }
  checkProgress(); refreshHUD(); save();
}

/* ═════════ UI: 패널 ═════════ */
let panelClose = null;
function openPanel(title, html, onClick) {
  return new Promise(resolve => {
    busy++;
    $('#panel-title').textContent = title; $('#panel-body').innerHTML = html; $('#panel-layer').classList.remove('hide');
    const body = $('#panel-body');
    const handler = e => { const el = e.target.closest('[data-a]'); if (el && onClick) onClick(el.dataset.a, el.dataset.v, api); };
    const api = { close, set: h => { body.innerHTML = h; } };
    function close(v) { body.removeEventListener('click', handler); $('#panel-layer').classList.add('hide'); panelClose = null; busy--; refreshHUD(); resolve(v); }
    body.addEventListener('click', handler);
    panelClose = () => close();
  });
}
$('#panel-x').addEventListener('click', () => panelClose && panelClose());
$('#panel-layer').addEventListener('click', e => { if (e.target.id === 'panel-layer' && panelClose) panelClose(); });

const cell = (id, n, a) => `<${a ? 'button' : 'div'} class="cell" ${a ? `data-a="${a}" data-v="${id}"` : ''}><span class="n">${n}</span><img class="ic" src="${iconURL(id)}"><br>${itemName(id)}</${a ? 'button' : 'div'}>`;
function invGroups() {
  const ids = Object.keys(G.inv).filter(i => G.inv[i] > 0);
  return [['재료', ids.filter(i => ITEMS[i])], ['손질한 재료', ids.filter(i => i.endsWith('_c'))], ['완성한 요리', ids.filter(i => RECIPES[i])]].filter(g => g[1].length);
}
function invHTML(action) {
  const gs = invGroups();
  if (!gs.length) return '<p class="center">텅 비었어요.<br>텃밭·숲·바닷가에서 재료를 구해 봐요.</p>';
  return gs.map(([t, ids]) => `<div class="sec">${t}</div><div class="grid">${ids.map(i => cell(i, G.inv[i], action)).join('')}</div>`).join('');
}
function openBag() { return openPanel('가방', invHTML(null) + (G.flags.rod ? `<div class="sec">도구</div><div class="grid"><div class="cell"><img class="ic" src="${iconURL('rod')}"><br>낚싯대</div></div>` : '')); }
function openBook() {
  let h = '<div class="sec">할머니의 레시피 수첩</div>';
  for (const id of RECIPE_ORDER) {
    const r = RECIPES[id];
    if (!G.recipes.includes(id)) { h += `<div class="rcp torn">— 뜯겨 나간 장 —</div>`; continue; }
    const n = servings(id);
    h += `<div class="rcp"><h4><img class="ic" src="${iconURL(id)}">${r.name}<span class="can">${n > 0 ? `지금 ${n}그릇 가능` : '재료 부족'}</span></h4>
      <div class="how">${COOKER_NAME[r.cooker]}에 ▸ ${r.ing.map(i => `<img class="ic s" src="${iconURL(i)}">${itemName(i)}`).join(' + ')}</div>
      <div class="memo">"${r.memo}"<br>— ${r.from} · ${r.price}닢</div></div>`;
  }
  if (G.mem.length || G.recipes.length > 3) {
    h += `<div class="sec">모락국밥의 기억 (${G.mem.length}/4)</div>`;
    for (const k of Object.keys(MEMORIES)) {
      h += G.mem.includes(k) ? `<div class="rcp"><div class="how"><img class="ic s" src="${iconURL(k === 'rice' ? 'rice' : k)}"> ${MEMORIES[k].who}</div><div class="memo">${MEMORIES[k].text}</div></div>` : `<div class="rcp torn">— 아직 듣지 못한 기억 —</div>`;
    }
  }
  return openPanel('수첩', h);
}
function openSettings() {
  const html = () => `
    <div class="row"><span class="grow">효과음</span><button class="btn" data-a="sfx">${Au.opt.sfx ? '켜짐' : '꺼짐'}</button></div>
    <div class="row"><span class="grow">배경 음악</span><button class="btn" data-a="music">${Au.opt.music ? '켜짐' : '꺼짐'}</button></div>
    <div class="row"><span class="grow">지금 저장</span><button class="btn" data-a="save">저장</button></div>
    <div class="row"><span class="grow">처음부터 다시</span><button class="btn" data-a="reset">지우기</button></div>
    <div class="sec">조작</div>
    <p>· 화면을 누르면 그곳으로 걸어가요.<br>· 사람·물건·조리대를 누르면 다가가서 말을 걸거나 써요.<br>· 키보드: 방향키/WASD 이동, 스페이스 살펴보기.</p>
    <div class="sec">요리 순서</div>
    <p>선반에서 재료 꺼내기 → (채소·두부·버섯은) 도마에서 손질 → 레시피에 맞는 팬/냄비에 넣기 → 다 되면 꺼내서 손님 식탁으로.<br>한 번에 하나만 들 수 있고, 빈 조리대에 잠깐 올려 둘 수 있어요.</p>`;
  return openPanel('설정', html(), (a, v, p) => {
    if (a === 'sfx') Au.setSfx(!Au.opt.sfx);
    if (a === 'music') Au.setMusic(!Au.opt.music);
    if (a === 'save') { save(); toast('저장했어요.'); }
    if (a === 'reset') { if (confirm('저장된 진행을 모두 지우고 처음으로 돌아갈까요?')) { try { localStorage.removeItem(SAVE); } catch (e) { /* 무시 */ } location.reload(); } return; }
    p.set(html());
  });
}
function openShop() {
  if (G.coins < 4 && stock('rice') === 0 && !G.flags.credit) {
    G.flags.credit = true; addItem('rice', 3); addItem('egg', 3);
    toast('이장님이 쌀과 달걀을 외상으로 쥐여 줬다. "나중에 밥으로 갚아라!"', 'rice', 4500);
  }
  const html = () => `<p>"필요한 거 골라 봐라. 싸게 주마!" — 가진 돈 <b>${G.coins}</b>닢</p>` + SHOP_LIST.map(id =>
    `<div class="row"><img class="ic" src="${iconURL(id)}"><span class="grow">${ITEMS[id].name} <small>(가진 것 ${inv(id)})</small></span><span>${ITEMS[id].price}닢</span>
     <button class="btn" data-a="buy" data-v="${id}" ${G.coins < ITEMS[id].price ? 'disabled' : ''}>사기</button></div>`).join('');
  return openPanel('봉 이장네 만물상', html(), (a, id, p) => {
    if (a !== 'buy' || G.coins < ITEMS[id].price) return;
    G.coins -= ITEMS[id].price; addItem(id); Au.sfx('coin'); p.set(html()); refreshHUD(); checkProgress();
  });
}
document.querySelector('#hud-btns').addEventListener('click', e => {
  const b = e.target.closest('[data-open]'); if (!b || busy || mode !== 'play') return;
  Au.sfx('blip');
  ({ bag: openBag, book: openBook, set: openSettings })[b.dataset.open]();
});
$('#goal').addEventListener('click', () => $('#goal').classList.toggle('min'));

/* ═════════ 이야기 연결 ═════════ */
const story = makeStory({
  state: () => G,
  say: UI.say, narr: UI.narr, letter: UI.letter, black: UI.black, choose: UI.choose,
  give(id, n) { addItem(id, n); Au.sfx('pick'); toast(`${itemName(id)} +${n}`, id); },
  take(id) { addItem(id, -1); },
  has: id => inv(id) > 0,
  learn(ids) { for (const id of ids) if (!G.recipes.includes(id)) { G.recipes.push(id); toast(`레시피 「${RECIPES[id].name}」 — 수첩에 끼워 넣었다`, 'page', 4200); } Au.sfx('page'); },
  remember(id) { if (!G.mem.includes(id)) { G.mem.push(id); toast(`모락국밥의 기억 (${G.mem.length}/4) — ${MEMORIES[id].who}`, 'heart', 4200); Au.sfx('heart'); } },
  flag(k) { G.flags[k] = true; },
  setStep(s) { G.step = s; $('#goal').classList.remove('min'); refreshHUD(); },
  toast: (t) => toast(t, null, 4500),
  tip: (t) => toast(t, null, 9000),
  shop: () => openShop(),
});
function checkProgress() {
  if (!G) return;
  if (G.step === 'gather' && stock('pa') >= 1 && stock('rice') >= 1 && stock('egg') >= 1) { G.step = 'first_cook'; toast('재료가 다 모였다! 식당 주방으로 가자.', 'egg_rice', 4200); }
  refreshHUD();
}
const QUEST_NPC = { gather: 'ijang', q_geumja: 'geumja', q_sori: 'sori', q_doyun: 'doyun', q_captain: 'captain', q_ijang2: 'ijang' };

/* ═════════ 상호작용 ═════════ */
function interact(th) {
  if (busy || !th) return;
  switch (th.type) {
    case 'npc': return runScene(() => story.talk[th.id]());
    case 'look': if (th.id === 'cat') Au.sfx('pick'); return runScene(() => story.look[th.id]());
    case 'node': return harvest(th);
    case 'fish': return startFishing();
    case 'door':
      if (th.to === 'shop') return enterShop();
      if (th.to === 'village') return exitShop();
      return runScene(() => story.look.locked());
    case 'pantry': return usePantry();
    case 'board': return useBoard();
    case 'counter': return useCounter(th);
    case 'cooker': return useCooker(th);
    case 'sink': return toast('반짝반짝. 할머니는 설거지를 미루는 법이 없었다.');
    case 'book': return openBook();
    case 'stairs': return runScene(sleep);
    case 'sign': return useSign();
    case 'table': return useTable(th);
    case 'seat': return useTable(th.table);
  }
}
function harvest(th) {
  G.taken[th.id] = 1; addItem(th.item, th.n); Au.sfx('pick');
  floater(th.x * T + 8, th.y * T, `+${th.n} ${itemName(th.item)}`);
  checkProgress();
}
function startFishing() {
  if (!G.flags.rod) return runScene(() => UI.narr('물결이 인다. 물고기가 있는 것 같다.\n낚싯대가 있으면 좋을 텐데.'));
  if (G.fishLeft <= 0) return toast('오늘은 물고기가 더 안 보여요. 바다도 쉬어야죠.');
  P.fish = { t: 0, bite: 1.6 + Math.random() * 2.6, state: 'wait' };
  P.dir = 'left'; Au.sfx('splash');
  toast('찌를 던졌다… 「!」가 뜨면 화면을 눌러요.');
}
function reel() {
  const f = P.fish; if (!f) return;
  if (f.state === 'bite') {
    addItem('fish'); G.fishLeft--; Au.sfx('pick'); Au.sfx('splash');
    floater(P.x * T + 8, P.y * T - 6, '+1 생선!');
  } else { Au.sfx('no'); toast('너무 빨랐다… 물고기가 달아났다.'); }
  P.fish = null;
}

async function changeMap(name, x, y, dir) {
  busy++; Au.sfx('door');
  await UI.black(true);
  clearFloaters(); particles.length = 0;
  map = MAPS[name]; G.map = name;
  P.x = x; P.y = y; P.px = x * T; P.py = y * T; P.dir = dir; P.moving = false; P.path = null; P.onArrive = null;
  snapCam();
  Au.setMood(name === 'shop' ? (svc ? 'service' : 'day') : (G.time >= 19 * 60 ? 'night' : 'day'));
  await UI.black(false);
  busy--;
}
async function enterShop() {
  await changeMap('shop', 7, 9, 'up');
  if (G.step === 'enter_shop') await runScene(story.scenes.enter_shop);
  save();
}
async function exitShop() {
  if (svc) return no('영업 중에는 가게를 비울 수 없어요.');
  collectLoose();
  await changeMap('village', 28, 16, 'down');
  save();
}

/* ── 주방 ── */
function usePantry() {
  if (P.hands) { addItem(P.hands); toast(`${itemName(P.hands)}: 선반에 넣어 뒀어요.`); P.hands = null; Au.sfx('put'); return; }
  openPanel('선반 — 무엇을 꺼낼까?', invHTML('take'), (a, id, p) => {
    if (a !== 'take' || inv(id) <= 0) return;
    addItem(id, -1); P.hands = id; Au.sfx('pick'); p.close();
  });
}
function useBoard() {
  if (!P.hands) return toast('도마: 손질할 재료를 들고 와요.');
  if (!(ITEMS[P.hands] && ITEMS[P.hands].chop)) return no(`${itemName(P.hands)}: 손질할 필요가 없어요.`);
  P.act = { t: 0, dur: 0.9, tick: 0, done() { P.hands += '_c'; Au.sfx('put'); } };
}
function useCounter(c) {
  const h = P.hands; P.hands = c.item; c.item = h;
  if (h || P.hands) Au.sfx(h ? 'put' : 'pick'); else toast('빈 조리대. 들고 있는 걸 잠깐 올려 둘 수 있어요.');
}
const subMulti = (a, b) => { const pool = [...b]; return a.every(x => { const i = pool.indexOf(x); if (i < 0) return false; pool.splice(i, 1); return true; }); };
function useCooker(c) {
  const cname = COOKER_NAME[c.kind];
  if (c.kind === 'cauldron' && !G.flags.cauldronOpen) {
    if (G.step === 'cauldron') return runScene(story.scenes.cauldron_open);
    return runScene(() => UI.narr('커다란 가마솥. 뚜껑이 무겁게 닫혀 있다.\n손잡이에만 먼지가 없다.'));
  }
  if (c.result) {
    if (P.hands) return no('손이 비어 있어야 꺼낼 수 있어요.');
    const dish = c.result; c.result = null; P.hands = dish; Au.sfx('pick');
    if (G.step === 'first_cook' && dish === 'egg_rice') { P.hands = null; return runScene(story.scenes.first_taste); }
    if (G.step === 'gukbap' && dish === 'gukbap') { P.hands = null; return runScene(story.scenes.ending); }
    return;
  }
  if (c.cook !== null) return toast('보글보글… 조금만 기다려요.');
  if (!P.hands) {
    if (c.contents.length) { P.hands = c.contents.pop(); Au.sfx('pick'); }
    else toast(`${cname}: 재료를 들고 와서 넣어요.`);
    return;
  }
  const it = P.hands;
  if (RECIPES[it]) return no('완성된 요리는 다시 넣을 수 없어요.');
  if (ITEMS[it] && ITEMS[it].chop) return no(`${itemName(it)}: 먼저 도마에서 손질해요.`);
  const next = [...c.contents, it];
  const mine = G.recipes.filter(r => RECIPES[r].cooker === c.kind);
  if (!mine.some(r => subMulti(next, RECIPES[r].ing))) return no(`지금 ${cname}에는 어울리지 않는 재료예요. (수첩을 확인해요)`);
  c.contents = next; P.hands = null; Au.sfx('put');
  const full = mine.find(r => RECIPES[r].ing.length === next.length && subMulti(next, RECIPES[r].ing));
  if (full) { c.cook = 0; c.making = full; Au.sfx('sizzle'); }
}
function updateCookers(dt) {
  for (const c of MAPS.shop.things) {
    if (c.type !== 'cooker' || c.cook === null) continue;
    c.cook += dt / (c.kind === 'cauldron' ? 7 : 5);
    if (Math.random() < dt * 9) particles.push({ x: c.x * T + c.w * 8 - 4 + Math.random() * 8, y: T + 4, vx: (Math.random() - 0.5) * 4, vy: -9 - Math.random() * 6, life: 1.3, max: 1.3 });
    if (c.cook >= 1) { c.cook = null; c.result = c.making; c.contents = []; Au.sfx('done'); floater(c.x * T + c.w * 8, T - 4, `${RECIPES[c.result].name} 완성!`); }
  }
}

/* ── 영업 ── */
function menuNow(reserved) { return G.recipes.filter(r => servings(r, reserved) > 0 || dishStock(r) > 0); }
function useSign() {
  if (svc) return toast('영업 중이에요. 손님이 모두 돌아가면 끝나요.');
  if (G.servedToday) return toast('오늘 영업은 끝났어요. 2층에서 푹 쉬어요.');
  if (G.step === 'enter_shop' || G.step === 'gather' || G.step === 'first_cook') return toast('아직은 일러요. 먼저 음식을 하나 만들어 봐요.');
  const menu = menuNow({});
  if (!menu.length) return no('지금 만들 수 있는 요리가 없어요. 재료를 구해 와요.');
  runScene(async () => {
    await UI.narr(`오늘의 메뉴: ${menu.map(r => RECIPES[r].name).join(', ')}`);
    if (await UI.choose(['영업을 시작한다', '아직 준비 중']) !== 0) return;
    svc = { left: Math.min(9, 3 + G.recipes.length), spawnT: 1.2, cust: [], served: 0, earned: 0, missed: 0, reserved: {}, usedNpc: {}, stuck: 0 };
    G.time = Math.max(G.time, 17 * 60);
    Au.setMood('service'); Au.sfx('door'); toast('모락식당, 문 열었습니다!');
  });
}
function pickOrder() {
  const c = G.recipes.filter(r => servings(r, svc.reserved) > 0);
  if (!c.length) return null;
  return c[Math.floor(Math.random() * c.length)];
}
function reserve(rid, sign) { const need = needOf(rid); for (const b in need) svc.reserved[b] = (svc.reserved[b] || 0) + sign * need[b]; }
function spawnGuest(rid, table) {
  let npc = null;
  const pool = Object.keys(NPC_GUEST_LINES).filter(n => !svc.usedNpc[n] && G.step !== 'first_open');
  if (pool.length && Math.random() < 0.3) { npc = pool[Math.floor(Math.random() * pool.length)]; svc.usedNpc[npc] = 1; }
  const spr = npc ? CHARS[npc] : CHARS['guest' + Math.floor(Math.random() * GUEST_LOOKS.length)];
  const g = { spr, npc, x: 8, y: 9, px: 8 * T, py: 10 * T, dir: 'up', state: 'in', table, order: rid, patience: 90, t: 0, walkT: 0 };
  g.path = bfs(8, 9, (x, y) => x === table.x && y === table.y - 1, (x, y) => passable(x, y, true)) || [];
  table.cust = g; reserve(rid, 1); svc.cust.push(g); Au.sfx('door');
}
function moveGuest(g, dt) {
  const tx = g.x * T, ty = g.y * T, sp = 52 * dt;
  const dx = tx - g.px, dy = ty - g.py, d = Math.hypot(dx, dy);
  if (d > sp) { g.px += dx / d * sp; g.py += dy / d * sp; g.walkT += dt; g.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); return false; }
  g.px = tx; g.py = ty;
  if (g.path && g.path.length) { [g.x, g.y] = g.path.shift(); return false; }
  return true;
}
function leave(g) {
  g.state = 'out'; g.table.cust = null; g.table.dish = null;
  g.path = bfs(g.x, g.y, (x, y) => x === 8 && y === 9, (x, y) => passable(x, y, true)) || [];
  g.path.push([8, 10]);
}
function updateService(dt) {
  svc.spawnT -= dt;
  const free = MAPS.shop.tables.filter(t => !t.cust);
  if (svc.left > 0 && svc.spawnT <= 0 && free.length) {
    const rid = pickOrder();
    if (rid) { spawnGuest(rid, free[Math.floor(Math.random() * free.length)]); svc.left--; svc.spawnT = 6 + Math.random() * 5; svc.stuck = 0; }
    else { svc.spawnT = 2; if (!svc.cust.length && ++svc.stuck >= 2) { svc.left = 0; toast('재료가 다 떨어졌어요. 오늘은 여기까지!'); } }
  }
  for (let i = svc.cust.length - 1; i >= 0; i--) {
    const g = svc.cust[i];
    if (g.state === 'in') { if (moveGuest(g, dt)) { g.state = 'wait'; g.dir = 'down'; Au.sfx('blip'); } }
    else if (g.state === 'wait') {
      g.patience -= dt;
      if (g.patience <= 0) { reserve(g.order, -1); svc.missed++; floater(g.px + 8, g.py - 12, '다음에 올게요…', 'bubble', 2); leave(g); }
    } else if (g.state === 'eat') {
      g.t -= dt;
      if (g.t <= 0) {
        const pay = RECIPES[g.order].price + (g.tip ? 2 : 0);
        G.coins += pay; svc.earned += pay; G.stats.earned += pay; Au.sfx('coin');
        floater(g.px + 8, g.py - 10, `+${pay}닢`);
        leave(g);
      }
    } else if (g.state === 'out') { if (moveGuest(g, dt)) svc.cust.splice(i, 1); }
  }
  if (svc.left <= 0 && !svc.cust.length) endService();
}
function useTable(t) {
  const g = t.cust;
  if (!g || g.state !== 'wait') { if (g && g.state === 'eat') return toast('맛있게 드시는 중이에요.'); return toast(svc ? '빈 자리예요.' : '손님 식탁. 영업을 시작하면 손님이 앉아요.'); }
  if (!P.hands) return toast(`「${RECIPES[g.order].name}」를 기다리고 있어요.`, g.order);
  if (P.hands !== g.order) return no(`주문은 「${RECIPES[g.order].name}」예요.`);
  P.hands = null; reserve(g.order, -1);
  g.state = 'eat'; g.t = 4.5; g.tip = g.patience > 45; t.dish = g.order;
  svc.served++; G.stats.served++; Au.sfx('heart');
  const lines = g.npc ? NPC_GUEST_LINES[g.npc] : GUEST_LINES;
  floater(g.px + 8, g.py - 12, lines[Math.floor(Math.random() * lines.length)], 'bubble', 2.6);
  refreshHUD();
}
function endService() {
  const s = svc; svc = null; G.servedToday = true; G.time = 20 * 60;
  Au.setMood('night'); Au.sfx('done');
  runScene(async () => {
    await openPanel('오늘의 영업 끝', `<p class="center">돌아온 빈 그릇 <b>${s.served}</b>개<br>번 돈 <b>${s.earned}</b>닢${s.missed ? `<br><small>기다리다 돌아간 손님 ${s.missed}명 — 괜찮아요, 내일 또 와요.</small>` : ''}</p>
      <p class="center"><button class="btn main" data-a="ok">수고했어요</button></p>`, (a, v, p) => p.close());
    if (G.step === 'first_open' && s.served > 0) await story.scenes.first_close();
    else toast('2층 계단으로 올라가면 하루를 마쳐요.');
  });
}

/* ── 잠 ── */
async function sleep() {
  if (svc) return no('손님이 계신데 잘 수는 없죠.');
  if (await UI.choose(['잠자리에 든다 (다음 날로)', '아직 할 일이 남았다']) !== 0) return;
  await UI.black(true); Au.sfx('sleep');
  collectLoose();
  G.day++; G.time = 8 * 60; G.taken = {}; G.fishLeft = 5; G.servedToday = false; G.flags.credit = false;
  P.x = 13; P.y = 2; P.px = P.x * T; P.py = P.y * T; P.dir = 'down';
  Au.setMood('day');
  await UI.narr(`${G.day}일째 아침.\n텃밭과 숲, 바다가 밤사이 다시 차올랐다.`);
  if (G.step === 'sleep1') { await UI.black(false); await story.scenes.morning2(); }
  else await UI.black(false);
}

/* ═════════ 입력 ═════════ */
function tapWorld(cx, cy) {
  if (mode !== 'play' || busy) return;
  Au.unlock();
  if (P.fish) return reel();
  if (P.act) return;
  const wx = cx / SCALE + camX, wy = cy / SCALE + camY;
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  let th = actAt(tx, ty);
  if (!th) { const below = actAt(tx, ty + 1); if (below && below.tall) th = below; }
  if (!th && svc) { // 앉은 손님을 눌러도 식탁으로
    const g = svc.cust.find(c => c.state !== 'in' && c.state !== 'out' && c.x === tx && (c.y === ty || c.y === ty + 1));
    if (g) th = g.table;
  }
  if (th) {
    tapMark = { x: th.x * T + th.w * 8, y: th.y * T + th.h * 8, t: 0.4 };
    if (adjacent(th, P.x, P.y) && !P.moving) { faceThing(th); return interact(th); }
    const path = bfs(P.x, P.y, (x, y) => adjacent(th, x, y), (x, y) => passable(x, y));
    if (!path) return toast('거기까지는 갈 수 없어요.');
    P.path = path; P.onArrive = () => { faceThing(th); interact(th); };
    return;
  }
  if (!passable(tx, ty)) return;
  const path = bfs(P.x, P.y, (x, y) => x === tx && y === ty, (x, y) => passable(x, y));
  if (path) { P.path = path; P.onArrive = null; tapMark = { x: tx * T + 8, y: ty * T + 8, t: 0.4 }; }
}
cvs.addEventListener('pointerdown', e => { e.preventDefault(); tapWorld(e.clientX, e.clientY); });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (e.repeat) return;
  keys[k] = true; Au.unlock();
  const ok = k === ' ' || k === 'enter' || k === 'e';
  if (k === 'escape' && panelClose) return panelClose();
  if (ok && letterClose) return letterClose();
  if (ok && dlg) return advanceDialog();
  if (dlg && dlg.choice && /^[1-9]$/.test(k) && +k <= dlg.options.length) return dlg.pick(+k - 1);
  if (mode !== 'play' || busy) return;
  if (ok) {
    if (P.fish) return reel();
    if (P.moving || P.act) return;
    const [dx, dy] = DIRS[P.dir];
    let th = actAt(P.x + dx, P.y + dy);
    if (!th && svc) { const g = svc.cust.find(c => c.x === P.x + dx && c.y === P.y + dy); if (g) th = g.table; }
    if (th) interact(th);
  }
  if (k === 'i') openBag(); if (k === 'r') openBook();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function keyDir() {
  if (keys.arrowup || keys.w) return 'up'; if (keys.arrowdown || keys.s) return 'down';
  if (keys.arrowleft || keys.a) return 'left'; if (keys.arrowright || keys.d) return 'right';
  return null;
}

/* ═════════ 갱신 ═════════ */
function stepTo(nx, ny) {
  if (!passable(nx, ny)) return false;
  if (svc && svc.cust.some(c => (c.state === 'wait' || c.state === 'eat') && c.x === nx && c.y === ny)) return false;
  P.fx = P.x; P.fy = P.y; P.x = nx; P.y = ny; P.moving = true; P.mt = 0;
  return true;
}
function updatePlayer(dt) {
  if (P.act) {
    P.act.t += dt; P.act.tick -= dt;
    if (P.act.tick <= 0) { P.act.tick = 0.2; Au.sfx('chop'); }
    if (P.act.t >= P.act.dur) { const d = P.act.done; P.act = null; d(); }
    return;
  }
  if (P.fish) {
    const f = P.fish; f.t += dt;
    if (f.state === 'wait' && f.t >= f.bite) { f.state = 'bite'; f.t = 0; Au.sfx('bite'); }
    else if (f.state === 'bite' && f.t > 1.2) { P.fish = null; toast('놓쳤다… 다시 던져 봐요.'); }
    return;
  }
  let budget = dt * (map.name === 'shop' ? 6.2 : 5.6);
  for (let guard = 0; guard < 3 && budget > 0; guard++) {
    if (P.moving) {
      const need = 1 - P.mt, use = Math.min(need, budget);
      P.mt += use; budget -= use; P.walkT += dt;
      if (P.mt >= 1) { P.moving = false; P.px = P.x * T; P.py = P.y * T; }
      else { P.px = (P.fx + (P.x - P.fx) * P.mt) * T; P.py = (P.fy + (P.y - P.fy) * P.mt) * T; break; }
    }
    const kd = keyDir();
    if (kd) { P.path = null; P.onArrive = null; }
    if (P.path && P.path.length) {
      const [nx, ny] = P.path.shift();
      P.dir = nx > P.x ? 'right' : nx < P.x ? 'left' : ny > P.y ? 'down' : 'up';
      if (!stepTo(nx, ny)) { P.path = null; P.onArrive = null; break; }
    } else if (P.onArrive) { const f = P.onArrive; P.onArrive = null; P.path = null; f(); break; }
    else if (kd) {
      P.dir = kd; const [dx, dy] = DIRS[kd];
      if (!stepTo(P.x + dx, P.y + dy)) {
        const th = actAt(P.x + dx, P.y + dy);
        if (th && th.type === 'door' && !P.bumped) { P.bumped = true; interact(th); }
        break;
      }
    } else { P.bumped = false; break; }
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx += (Math.random() - 0.5) * 20 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
let hudT = 0, saveT = 0, sunsetTold = false;
function update(dt) {
  tAnim += dt;
  updateDialog(dt); updateParticles(dt);
  if (tapMark) { tapMark.t -= dt; if (tapMark.t <= 0) tapMark = null; }
  if (mode === 'title') { const m = MAPS.village; camX = clamp(28 * T - VW / 2 + Math.sin(tAnim * 0.15) * 60, 0, m.w * T - VW); camY = clamp(15 * T - VH / 2 + Math.cos(tAnim * 0.11) * 30, 0, m.h * T - VH); }
  if (mode !== 'play') return;
  // 모락모락: 식당 굴뚝 연기
  if (map.name === 'village' && Math.random() < dt * (G.recipes.length ? 5 : 0)) particles.push({ x: 31 * T + 2 + Math.random() * 4, y: 10 * T + 4, vx: 3, vy: -7 - Math.random() * 4, life: 2.2, max: 2.2 });
  if (!busy) {
    if (map.name === 'village' && G.time < 17.5 * 60) {
      G.time += dt * 1.6;
      if (G.time >= 17 * 60 && !sunsetTold && !G.servedToday && G.recipes.length) { sunsetTold = true; toast('해가 기울어요. 슬슬 저녁 장사를 준비해 볼까요?'); }
    }
    updatePlayer(dt);
    if (map.name === 'shop') updateCookers(dt);
    if (svc) updateService(dt);
    saveT += dt; if (saveT > 20) { saveT = 0; save(); }
  }
  followCam(dt);
  updateFloaters(dt);
  hudT -= dt; if (hudT <= 0) { hudT = 0.5; refreshHUD(); }
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function camTarget() {
  const mw = map.w * T, mh = map.h * T;
  const pad = map.name === 'shop' ? 34 : 0; // 가게 안에서는 위쪽 조리대가 HUD에 가리지 않게
  const cx = mw <= VW ? (mw - VW) / 2 : clamp(P.px + 8 - VW / 2, 0, mw - VW);
  const cy = mh + pad <= VH ? (mh - pad - VH) / 2 : clamp(P.py + 8 - VH / 2, -pad, mh - VH);
  return [cx, cy];
}
function snapCam() { [camX, camY] = camTarget(); }
function followCam(dt) { const [tx, ty] = camTarget(); const k = Math.min(1, dt * 8); camX += (tx - camX) * k; camY += (ty - camY) * k; }

/* ═════════ 그리기 ═════════ */
function drawChar(spr, dir, moving, walkT, px, py, sit) {
  const f = moving ? [1, 0, 2, 0][Math.floor(walkT * 9) % 4] : 0;
  ctx.fillStyle = 'rgba(40,30,20,.22)';
  if (!sit) { ctx.fillRect(px + 3, py + 13, 10, 2); ctx.fillRect(px + 4, py + 12, 8, 4); }
  ctx.drawImage(spr[dir][f], px, py - 8 + (sit ? 2 : 0));
}
function drawIcon(id, x, y) { ctx.drawImage(itemIcon(id), Math.round(x), Math.round(y)); }
function bubbleBox(x, y, w, h) {
  ctx.fillStyle = '#4a3328'; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#4a3328'; ctx.fillRect(x + w / 2 - 1, y + h, 3, 1); ctx.fillRect(x + w / 2, y + h + 1, 1, 1);
}
function bar(x, y, w, v, col) {
  ctx.fillStyle = '#4a3328'; ctx.fillRect(x - 1, y - 1, w + 2, 4);
  ctx.fillStyle = '#fff4dc'; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(v, 0, 1)), 2);
}
function render() {
  ctx.fillStyle = map.bg || '#62bcd8'; ctx.fillRect(0, 0, VW, VH);
  const cx = Math.round(camX), cy = Math.round(camY);
  ctx.save(); ctx.translate(-cx, -cy);
  const frame = Math.floor(tAnim * 1.6) % 2;
  ctx.drawImage(map.ground[frame], 0, 0);

  const list = [];
  const x0 = cx - 40, x1 = cx + VW + 40, y0 = cy - 20, y1 = cy + VH + 60;
  for (const th of map.things) {
    if (!visible(th)) continue;
    const bx = th.x * T, by = (th.y + th.h) * T;
    if (bx > x1 || bx + th.w * T < x0 || by < y0 || by - 90 > y1) continue;
    list.push({ k: by + (th.type === 'seat' ? -20 : 0), th });
  }
  if (mode === 'play') {
    if (map === MAPS[G.map]) list.push({ k: P.py + T + 0.5, pl: true });
    if (svc && map.name === 'shop') for (const g of svc.cust) list.push({ k: g.py + T + 0.4, g });
  }
  list.sort((a, b) => a.k - b.k);

  for (const d of list) {
    if (d.pl) { drawChar(CHARS.player, P.dir, P.moving, P.walkT, Math.round(P.px), Math.round(P.py)); continue; }
    if (d.g) { const g = d.g, sit = g.state === 'wait' || g.state === 'eat'; drawChar(g.spr, g.dir, !sit, g.walkT, Math.round(g.px), Math.round(g.py), sit); continue; }
    const th = d.th;
    if (th.type === 'npc') {
      const turn = Math.floor(tAnim / 3 + th.x) % 5 === 0;
      drawChar(CHARS[th.id], turn ? (th.x % 2 ? 'left' : 'right') : 'down', false, 0, th.x * T, th.y * T);
      continue;
    }
    if (th.type === 'fish') { ctx.globalAlpha = 0.8; ctx.drawImage(frame ? SPR.ripple1 : SPR.ripple0, th.x * T, th.y * T); ctx.globalAlpha = 1; continue; }
    let spr = th.spr; if (!spr) continue;
    if (th.cat) spr = Math.floor(tAnim * 0.7) % 4 === 0 ? SPR.cat1 : SPR.cat0;
    if (th.type === 'sign') spr = svc ? SPR.signOpen : SPR.signClosed;
    if (th.type === 'cooker' && th.kind === 'cauldron') spr = G && G.flags.cauldronOpen ? SPR.cauldron1 : SPR.cauldron0;
    const x = Math.floor(th.x * T + (th.w * T - spr.width) / 2 + (th.ax || 0));
    const y = (th.y + th.h) * T - spr.height + (th.ay || 0) + (th.bobs ? Math.round(Math.sin(tAnim * 1.5)) : 0);
    ctx.drawImage(spr, x, y);
    if (th.type === 'table' && th.dish) drawIcon(th.dish, th.x * T + 2, th.y * T - 6);
  }

  // 위에 얹는 것들
  if (mode === 'play') {
    if (map.name === 'shop') {
      for (const th of map.things) {
        const mx = th.x * T + th.w * 8;
        if (th.type === 'counter' && th.item) drawIcon(th.item, mx - 6, T - 4);
        if (th.type === 'cooker') {
          if (th.result) { const b = Math.round(Math.sin(tAnim * 5) * 1.5); bubbleBox(mx - 9, -6 + b, 18, 17); drawIcon(th.result, mx - 6, -4 + b); }
          else if (th.cook !== null) bar(mx - 6, T - 2, 12, th.cook, '#e8884a');
          else th.contents.forEach((it, i) => drawIcon(it, mx - th.contents.length * 5 + i * 10 - 1, 2));
        }
      }
      if (svc) for (const g of svc.cust) if (g.state === 'wait') {
        const bx = Math.round(g.px) - 1, by = Math.round(g.py) - 30;
        bubbleBox(bx, by, 18, 17); drawIcon(g.order, bx + 3, by + 2);
        bar(bx + 3, by + 14, 12, g.patience / 90, g.patience > 45 ? '#5fa644' : g.patience > 20 ? '#f2a03c' : '#c4553f');
      } else if (g.state === 'eat') drawIcon('heart', g.px + 2, g.py - 22 + Math.sin(tAnim * 6));
    }
    const q = QUEST_NPC[G.step];
    if (q && map.name === 'village' && !(G.step === 'gather' && G.flags.gift)) {
      const n = map.things.find(t => t.type === 'npc' && t.id === q);
      if (n) drawIcon('bang', n.x * T + 2, n.y * T - 22 + Math.round(Math.sin(tAnim * 5) * 2));
    }
    if (G.step === 'cauldron' && map.name === 'shop') drawIcon('bang', 11 * T + 10, -2 + Math.round(Math.sin(tAnim * 5) * 2));
    if (G.step === 'enter_shop' && map.name === 'village') drawIcon('bang', 28 * T + 2, 10 * T - 8 + Math.round(Math.sin(tAnim * 5) * 2));
    const hx = Math.round(P.px), hy = Math.round(P.py);
    if (P.hands) drawIcon(P.hands, hx + 2, hy - 20);
    if (P.act) bar(hx + 2, hy - 24, 12, P.act.t / P.act.dur, '#5fa644');
    if (P.fish) {
      ctx.drawImage(SPR.bobber, hx - 12, hy + 4 + (P.fish.state === 'bite' ? 3 : Math.round(Math.sin(tAnim * 4))));
      ctx.fillStyle = '#eee'; for (let i = 0; i < 8; i++) ctx.fillRect(hx - 9 + i, hy + 3 - i, 1, 1);
      if (P.fish.state === 'bite') { bubbleBox(hx - 1, hy - 30, 18, 16); drawIcon('bang', hx + 2, hy - 28); }
    }
    if (tapMark) { ctx.globalAlpha = tapMark.t * 2; ctx.fillStyle = '#fff'; const s = Math.round((0.4 - tapMark.t) * 14); ctx.fillRect(tapMark.x - s, tapMark.y, 2, 1); ctx.fillRect(tapMark.x + s, tapMark.y, 2, 1); ctx.fillRect(tapMark.x, tapMark.y - s, 1, 2); ctx.fillRect(tapMark.x, tapMark.y + s, 1, 2); ctx.globalAlpha = 1; }
  }
  for (const p of particles) puff(ctx, p.x, p.y, p.life / p.max);
  ctx.restore();

  // 시간에 따른 빛
  if (G && mode === 'play' && map.name === 'village') {
    const t = G.time / 60;
    if (t >= 19) { ctx.fillStyle = 'rgba(28,36,92,.38)'; ctx.fillRect(0, 0, VW, VH); }
    else if (t > 15.5) { ctx.fillStyle = `rgba(255,140,60,${Math.min(0.2, (t - 15.5) * 0.1)})`; ctx.fillRect(0, 0, VW, VH); }
  }
}

/* ═════════ 시작 ═════════ */
function startGame(state, isNew) {
  G = state; if (!G.stats) G.stats = { served: 0, earned: 0 };
  mode = 'play'; svc = null;
  map = MAPS[G.map] || MAPS.village;
  P.x = G.x; P.y = G.y; P.px = P.x * T; P.py = P.y * T; P.dir = 'down'; P.hands = null; P.moving = false; P.path = null;
  if (!passable(P.x, P.y)) { if (map.name === 'shop') { P.x = 7; P.y = 9; } else { P.x = 28; P.y = 16; } P.px = P.x * T; P.py = P.y * T; }
  snapCam();
  $('#title').classList.add('hide'); $('#hud').classList.remove('hide');
  Au.unlock(); Au.setMood(G.time >= 19 * 60 ? 'night' : 'day');
  refreshHUD();
  if (isNew) runScene(story.scenes.intro);
}
function boot() {
  resize();
  SPR = buildSprites();
  for (const k in LOOKS) CHARS[k] = makeChar(LOOKS[k]);
  GUEST_LOOKS.forEach((l, i) => { CHARS['guest' + i] = makeChar(l); });
  MAPS.village = buildVillage(); MAPS.shop = buildShop();
  map = MAPS.village;
  const sv = load();
  if (sv) $('#btn-continue').classList.remove('hide');
  $('#btn-continue').addEventListener('click', () => startGame(load(), false));
  $('#btn-new').addEventListener('click', () => {
    if (load() && !confirm('저장된 진행이 있어요. 지우고 새로 시작할까요?')) return;
    const name = ($('#name').value || '').trim().slice(0, 6) || '하루';
    startGame(newState(name), true);
  });
  addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  addEventListener('pagehide', save);
  let last = 0;
  const loop = ts => { const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; update(dt); render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__morak = { get G() { return G; }, P, MAPS, get map() { return map; }, get svc() { return svc; }, get busy() { return busy; }, tapWorld, bfs, passable, addItem, story, save, interact, toScreen: (tx, ty) => [(tx * T + 8 - camX) * SCALE, (ty * T + 8 - camY) * SCALE] };
}
boot();
