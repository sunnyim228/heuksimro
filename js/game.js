// 모락모락 — 솥골 식당 이야기 : 게임 엔진
import { T, buildSprites, renderGround, makeChar, makeAlien, portrait, itemIcon, iconURL, puff, rng, registerDish } from './art.js';
import { ITEMS, SHOP_LIST, RECIPES, RECIPE_ORDER, COOKER_NAME, MEMORIES, itemName, baseOf, LOOKS, NPC_NAME, GUEST_LOOKS, GUEST_LINES, NPC_GUEST_LINES, VALUE, TRAITS, RANKS, rankOf, UPGRADES, CHALLENGES, TRAVEL_ORDER, CRAFTS, PLACES, HAIR_COLORS, HAIR_STYLES, WEAR, EVENTS, REQ_PEOPLE, REQ_ITEMS, WALKER_LINES, SHARE_LINES, NPC_DONE, TAG_NAME, tagsFor, MOODS, MOOD_MISS, BOND_STORIES } from './data.js';
import { makeStory, GOALS, josa } from './story.js';
import * as Au from './audio.js';
import { EPISODES } from './episodes/index.js'; // 연재 화들을 먼저 등록해요
import { VILLAGE_CLUES, CHAPTERS, FINALE } from './mystery.js';
import * as Cine from './cinema.js';
import { YEAR_DAYS, seasonOf, SEASON_DISHES, REAL, VISITORS, visitorOf, DEX_MORE, DEX_ORDER, WORLD, HINTS, DEX_GROUPS } from './homestay.js';

const $ = s => document.querySelector(s);
const cvs = $('#game'), ctx = cvs.getContext('2d');
const SAVE = 'morak-save-v1';
// 자동 테스트용: 주소에 ?test 를 붙이면 조리·손질만 빨라져요 (일반 플레이에는 영향 없음)
const TEST_SPEED = /[?&]test\b/.test(location.search) ? 25 : 1;
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
  deco(SPR.busstop, 43, 16, { type: 'bus', act: true, tall: true });
  deco(SPR.jars, 32, 15, { type: 'craft', act: true, tall: true });
  deco(SPR.noticeboard, 26, 19, { type: 'reqboard', act: true, tall: true });
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
  st('counter', 7, SPR.counter, { item: null, unless: 'pan2' });
  st('cooker', 7, SPR.stove_pan, { kind: 'pan', contents: [], cook: null, result: null, own: 'pan2' });
  st('sink', 8, SPR.sink);
  st('book', 9, SPR.bookstand);
  st('counter', 10, SPR.counter, { item: null, unless: 'pot2' });
  st('cooker', 10, SPR.stove_pot, { kind: 'pot', contents: [], cook: null, result: null, own: 'pot2' });
  st('cooker', 11, SPR.cauldron0, { w: 2, kind: 'cauldron', contents: [], cook: null, result: null });
  st('stairs', 14, SPR.stairs);
  add(m, { type: 'look', id: 'photo', x: 13, y: 0, spr: SPR.photo, ay: -3, act: true });
  m.tables = [[3, 6], [8, 6], [12, 6], [3, 9], [12, 9]].map(([x, y], i) => {
    const own = i >= 3 ? 'table' + (i + 1) : undefined; // 4·5번째 식탁은 목공소에서 늘려요
    const t = add(m, { type: 'table', idx: i, x, y, spr: SPR.table, ay: -5, act: true, cust: null, dish: null, own });
    add(m, { type: 'seat', table: t, x, y: y - 1, spr: SPR.stool, ay: -3, act: true, tall: true, forGuest: true, own });
    return t;
  });
  add(m, { type: 'sign', x: 10, y: 9, spr: SPR.signClosed, act: true, tall: true });
  add(m, { type: 'deco', x: 1, y: 7, spr: SPR.plant }); add(m, { type: 'deco', x: 14, y: 7, spr: SPR.plant });
  add(m, { type: 'door', x: 7, y: 10, to: 'village', act: true }); add(m, { type: 'door', x: 8, y: 10, to: 'village', act: true });
  finishMap(m);
  m.bg = '#2b1d18';
  return m;
}

/* ═════════ 칸 검사 · 길 찾기 ═════════ */
const owns = k => !!(G && G.up && G.up[k]);
const rank = () => rankOf(G.rep || 0);
const visible = th => !(th.type === 'node' && G && G.taken[th.id]) && !(th.own && !owns(th.own)) && !(th.unless && owns(th.unless));
const tables = () => MAPS.shop.tables.filter(visible);
function priceOf(rid) {
  const r = RECIPES[rid];
  const m = (G.trait === 'fire' && r.cooker === 'pan') || (G.trait === 'soup' && r.cooker !== 'pan') ? 1.25 : 1;
  return Math.round(r.price * m * (G.event === 'rain' && r.cooker === 'pan' ? 1.3 : 1) * (G.body ? tasteMult() : 1) * (1 + 0.1 * Math.max(0, dexLv(rid) - 1)));
}
const buyPrice = (id, base = ITEMS[id].price) => Math.max(1, base - (G.trait === 'thrift' ? 1 : 0) + (G.event === 'pricey' ? 1 : G.event === 'sale' ? -1 : 0));
const sellPrice = id => RECIPES[id] ? Math.floor(priceOf(id) * 0.6) : Math.max(1, Math.floor(VALUE[baseOf(id)] / 2));
function gainRep(n) {
  const r0 = rank(); G.rep = (G.rep || 0) + n;
  if (rank() > r0) { Au.sfx('page'); toast(`모락식당이 ${rank()}성 식당이 됐어요!\n손님이 늘고, 목공소에 새 일을 맡길 수 있어요.`, 'heart', 5200); }
}
function checkChallenges() {
  if (!G || !G.done) return;
  for (const c of CHALLENGES) if (!G.done[c.id] && c.test(G)) {
    G.done[c.id] = 1; G.coins += c.reward; Au.sfx('coin');
    toast(`도전 달성 — ${c.name}\n보상 ${c.reward}닢`, 'coin', 5000);
  }
}
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

const STEPS = Object.keys(GOALS);
const opened = () => STEPS.indexOf(G.step) > STEPS.indexOf('sleep1'); // 2일째 아침부터 마을 기능이 열려요
const loanLimit = () => 100 + 100 * rank();
const dishTags = id => { const r = RECIPES[id]; return r ? (r.tags || (r.tags = tagsFor(r.cooker, r.ing))) : []; };
const tagLine = id => `성격: ${dishTags(id).map(t => TAG_NAME[t]).join(' · ')}`;
/* ── 몸 상태: 기운과 밥맛 ── */
const wearing = id => !!G.look && (G.look.hat === id || G.look.shirt === id);
const clampB = v => Math.max(0, Math.min(100, Math.round(v)));
function tire(n, forage = false) { // 일을 하면 기운이 빠져요
  if (forage && wearing('shirt_work')) n = Math.ceil(n / 2);
  if (wearing('hat_beanie')) n = Math.max(1, n - 1);
  G.body.en = clampB(G.body.en - n);
  if (G.body.en === 0 && !G.body.warned) { G.body.warned = true; toast('기운이 바닥났어요.\n가방의 요리를 먹거나 2층에서 푹 자요.', null, 5000); }
}
const tasteMult = () => G.body.taste >= 70 ? 1.1 : G.body.taste < 30 ? 0.9 : 1;
const tasteWord = () => G.body.taste >= 70 ? '손맛이 살아 있다 (요리 값 +10%)' : G.body.taste < 30 ? '간이 잘 안 맞는다 (요리 값 -10%)' : '보통';
function feed(id, withSomeone) {
  const b = G.body, fresh = !b.ate.slice(-3).includes(id);
  b.en = clampB(b.en + 15 + RECIPES[id].price * 1.5);
  const up = (fresh ? 8 : 3) + (withSomeone ? 6 : 0);
  b.taste = clampB(b.taste + up); b.meals++; b.ate.push(id); b.ate = b.ate.slice(-5); b.warned = false;
  return { up, fresh };
}
function eat(id) {
  if (!RECIPES[id]) return no('날것은 먹을 수 없어요. 요리해서 먹어요.');
  if (inv(id) <= 0) return;
  if (G.body.meals >= 3) return no('배가 불러요. 하루 세 끼면 충분해요.');
  addItem(id, -1); const r = feed(id, false); Au.sfx('heart');
  toast(`${RECIPES[id].name} — 잘 먹었습니다.\n기운 ${G.body.en} · 밥맛 +${r.up}${r.fresh ? '' : ' (요즘 자주 먹은 음식이라 덜 올라요)'}`, id, 4200);
  refreshHUD();
}
async function shareMeal(npc, dishes) {
  let id = dishes[0];
  if (dishes.length > 1) {
    id = await openPanel('무엇을 같이 먹을까?', `<div class="grid">${dishes.map(d => cell(d, G.inv[d], 'pick')).join('')}</div>`, (a, v, p) => { if (a === 'pick') p.close(v); });
    if (!id) return;
  }
  addItem(id, -1); G.body.shared = true; if (G.body.meals >= 3) G.body.meals = 2;
  const r = feed(id, true); Au.sfx('heart');
  await UI.narr(`${NPC_NAME[npc]}와 마주 앉아 ${RECIPES[id].name}을(를) 나눠 먹었다.`);
  G.bond = G.bond || {}; const n = G.bond[npc] = (G.bond[npc] || 0) + 1;
  await UI.say(npc, (n % 2 === 0 && BOND_STORIES[npc][n / 2 - 1]) || SHARE_LINES[npc]);
  toast(`같이 먹은 밥 — 밥맛 +${r.up} · 평판 +1`, 'heart', 4200);
  gainRep(1);
}
const pickOne = a => a[Math.floor(Math.random() * a.length)];
function applyLook() {
  const L = G.look, hat = WEAR.find(w => w.id === L.hat) || WEAR.find(w => w.id === 'hat_band'), shirt = WEAR.find(w => w.id === L.shirt) || WEAR[0];
  CHARS.player = makeChar({ ...LOOKS.player, hair: L.hair, style: L.style, shirt: shirt.col, hat: hat.hat, hatCol: hat.col, apron: L.apron });
  delete faceCache.player;
}
const ensureReqs = () => { if (opened() && G.reqDay !== G.day) genRequests(); };
function genRequests() {
  G.reqs = []; G.reqDay = G.day;
  const people = [...REQ_PEOPLE].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 2 + (rank() >= 3 ? 1 : 0); i++) {
    const known = G.recipes.filter(r => RECIPES[r] && r !== 'gukbap');
    if (i > 0 && known.length && Math.random() < 0.5) { const item = pickOne(known); G.reqs.push({ who: people[i], item, n: 1, coins: Math.round(priceOf(item) * 1.6), rep: 2 }); }
    else { const item = pickOne(REQ_ITEMS), n = 2 + Math.floor(Math.random() * 3); G.reqs.push({ who: people[i], item, n, coins: VALUE[item] * n * 2 + 6, rep: 1 }); }
  }
}

/* ═════════ 현실 시간 ═════════ */
// 1) 자리를 비운 사이에 흐르는 것  2) 함께한 시간 기록  3) 현실 시각에 맞춘 인사
const AWAY_MIN = 10 * 60e3, AWAY_CAP = 8 * 3600e3;
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function markDay() { const k = todayKey(); if (G.lastDate !== k) { G.lastDate = k; G.realDays = (G.realDays || 0) + 1; checkChallenges(); } }
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return '좋은 아침이에요. 아침은 드셨어요?';
  if (h >= 10 && h < 14) return '점심때네요. 밥은 꼭 챙겨 먹어요.';
  if (h >= 14 && h < 18) return '나른한 오후예요. 잠깐 쉬어 가요.';
  if (h >= 18 && h < 22) return '저녁이에요. 오늘 하루도 수고했어요.';
  return '늦은 밤이에요. 너무 늦게 자지 말아요.';
}
const fmtDur = ms => { const m = Math.max(1, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? `${h}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`; };
function awayReport() {
  const now = Date.now(), last = G.seenAt || now;
  G.seenAt = now;
  const raw = now - last, ms = Math.min(raw, AWAY_CAP);
  if (raw < AWAY_MIN || !opened()) return null;
  const h = ms / 3600e3, lines = [];
  const curing = G.craft.filter(c => !c.ready);
  if (h >= 1 && curing.length) { curing.forEach(c => { c.ready = true; }); lines.push(['dried_mushroom', `건조대에 널어 둔 ${curing.length}가지가 다 말랐어요`]); }
  if (G.bank.dep > 0) { const gain = Math.min(10, Math.floor(G.bank.dep * 0.01 * h / 8)); if (gain) { G.bank.dep += gain; lines.push(['coin', `맡겨 둔 돈에 이자가 붙었어요 (+${gain}닢)`]); } }
  const crops = Object.keys(G.taken).filter(k => k.startsWith('crop'));
  if (h >= 2 && crops.length) { crops.forEach(k => delete G.taken[k]); lines.push(['pa', '텃밭이 다시 자랐어요']); }
  const wild = Object.keys(G.taken).filter(k => !k.startsWith('crop'));
  if (h >= 4 && wild.length) { wild.forEach(k => delete G.taken[k]); lines.push(['mushroom', '숲과 바닷가에도 다시 났어요']); }
  const up = Math.min(100 - G.body.en, Math.round(h * 12));
  if (up > 0) { G.body.en += up; lines.push(['heart', `푹 쉬어서 기운이 돌아왔어요 (+${up})`]); }
  return { ms, capped: raw > AWAY_CAP, lines };
}
// 이어하기와, 다른 앱에 갔다가 돌아왔을 때 불러요. 벌은 없고 반가움만 있어요.
function welcomeBack() {
  if (!G || mode !== 'play') return;
  markDay();
  if (busy) return;
  const r = awayReport();
  if (!r) return;
  Au.sfx('page');
  openPanel('다녀오셨어요', `<p class="center">${fmtDur(r.ms)} 동안 자리를 비웠어요.${r.capped ? '<br><small>(8시간까지만 세어요)</small>' : ''}</p>` +
    (r.lines.length ? r.lines.map(([ic, t]) => `<div class="row"><img class="ic" src="${iconURL(ic)}"><span class="grow">${t}</span></div>`).join('') : '<p class="center"><small>가게는 조용히 잘 있었어요.</small></p>') +
    `<p class="center">${greeting()}</p><p class="center"><button class="btn main" data-a="ok">가게로</button></p>`, (a, v, p) => p.close()).then(() => { checkProgress(); save(); });
}

/* ═════════ 처음 설정은 랜덤으로 ═════════ */
const NAMES = ['하루', '봄이', '다온', '이안', '서리', '누리', '해솔', '가온', '도담', '라온', '단비', '새봄', '여름', '은재', '시우', '나래'];
const randomName = () => pickOne(NAMES);
function randomLook() {
  const shirts = WEAR.filter(w => w.kind === 'shirt' && w.free).map(w => w.id);
  return { hair: pickOne(HAIR_COLORS), style: pickOne(HAIR_STYLES)[0], shirt: pickOne(shirts), hat: pickOne(['hat_band', 'hat_none']), apron: true };
}

/* ═════════ 저장 ═════════ */
function newState(name) {
  return { v: SAVE_VERSION, name: name || '하루', day: 1, time: 8 * 60, coins: 10, inv: {}, recipes: [], mem: [], flags: {}, step: 'intro', map: 'village', x: 42, y: 17, taken: {}, fishLeft: 5, servedToday: false, stats: { served: 0, earned: 0 }, up: {}, rep: 0, trait: null, custom: [], done: {}, bank: { dep: 0, loan: 0 }, craft: [], reqs: [], event: null, traveled: false, wear: [], look: randomLook(), body: { en: 100, taste: 35, meals: 0, ate: [], shared: false } };
}
/* 저장 형식이 바뀔 때마다 SAVE_VERSION 을 한 칸 올리고, MIGRATIONS 에 "앞 버전 → 다음 버전" 변환을 하나 더해요.
   불러올 때 낮은 버전부터 차례로 변환하니, 아무리 오래된 저장도 이어서 할 수 있어요. */
const SAVE_VERSION = 2;
const BACKUP = 'morak-save-backup';
function fillDefaults(d) { // 기능이 늘며 생긴 칸을 채워요. 여러 번 해도 결과가 같아요.
  d.stats = d.stats || { served: 0, earned: 0 };
  d.up = d.up || {}; d.rep = d.rep || 0; d.custom = d.custom || []; d.done = d.done || {}; if (d.trait === undefined) d.trait = null;
  d.bank = d.bank || { dep: 0, loan: 0 }; d.craft = d.craft || []; d.wear = d.wear || []; d.event = d.event || null; d.traveled = !!d.traveled;
  d.look = d.look || { hair: '#7a4b2e', style: 'short', shirt: 'shirt_white', hat: 'hat_band', apron: true };
  d.dex = d.dex || {}; d.world = d.world || {}; d.met = d.met || []; d.album = d.album || {}; d.clues = d.clues || [];
  if (d.stay) { d.stay.bond = d.stay.bond || 0; d.stay.walk = d.stay.walk || 0; }
  if (d.book) { for (const id of d.book) d.dex[id] = d.dex[id] || ['eunha']; delete d.book; } // 예전 '진짜 레시피북'을 도감으로
  d.body = d.body || { en: 100, taste: 35, meals: 0, ate: [], shared: false };
  if (!d.rep && d.stats.served) d.rep = d.stats.served;
  d.reqs = d.reqs || []; d.flags = d.flags || {}; d.inv = d.inv || {}; d.recipes = d.recipes || [];
  return d;
}
const MIGRATIONS = {
  1: d => { fillDefaults(d); if (d.stay && !d.met.length) d.met = ['eunha']; d.v = 2; }, // v1: 기능을 붙여 가던 시절의 저장
};
function upgradeSave(d) {
  while (d.v < SAVE_VERSION) { const m = MIGRATIONS[d.v]; if (!m) return null; m(d); }
  return d;
}
function parseSave(str) {
  try { const d = JSON.parse(str); if (!d || typeof d.v !== 'number' || d.v > SAVE_VERSION || !d.name) return null; return upgradeSave(d); }
  catch (e) { return null; }
}
const encodeSave = s => btoa(unescape(encodeURIComponent(s)));
const decodeSave = s => { s = s.trim(); if (s.startsWith('{')) return s; try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } };
let saveWarned = false;
function save() {
  if (!G || mode !== 'play' || busy) return; // 대화·장면 도중에는 저장하지 않아요 (장면이 끝나면 저장)
  G.seenAt = Date.now();
  const invAll = { ...G.inv };
  for (const id of looseItems()) invAll[id] = (invAll[id] || 0) + 1;
  // 영업 중에 닫으면 가게 안 문 앞에서 다시 시작해요
  const data = { ...G, inv: invAll, map: map.name, x: svc ? 7 : P.x, y: svc ? 9 : P.y };
  data.v = SAVE_VERSION;
  try { localStorage.setItem(SAVE, JSON.stringify(data)); saveWarned = false; }
  catch (e) { if (!saveWarned) { saveWarned = true; toast('저장하지 못했어요. 기기 저장 공간을 확인하고, 설정에서 백업 코드를 받아 두세요.', null, 6000); } }
}
function load() { // 저장이 깨졌으면 어제 아침 백업으로
  let d = null;
  try { d = parseSave(localStorage.getItem(SAVE)) || parseSave(localStorage.getItem(BACKUP)); } catch (e) { d = null; }
  return d;
}

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
  ensureReqs();
  const h = Math.floor(G.time / 60), mi = Math.floor(G.time % 60 / 10) * 10;
  const ap = h < 12 ? '오전' : '오후', hh = h % 12 === 0 ? 12 : h % 12;
  $('#status').innerHTML = `${G.day}일째 · ${ap} ${hh}:${String(mi).padStart(2, '0')}<br><img class="ic s" src="${iconURL('coin')}"> <b>${G.coins}</b>닢${G.bank && G.bank.loan ? ` · 빚 ${G.bank.loan}` : ''}${G.event ? `<br><small>오늘: ${EVENTS[G.event].name}</small>` : ''}${G.stay ? `<br><small>별손님 ${visitorOf(G.stay.day, G.stay.year).name} · ${seasonOf(G.stay.day)} · 한 해 D-${Math.max(0, G.stay.len - G.stay.day)}</small>` : ''}<div class="bars">기운<i><em class="${G.body.en < 25 ? 'low' : ''}" style="width:${G.body.en}%"></em></i>밥맛<i><em class="${G.body.taste < 30 ? 'low' : 't'}" style="width:${G.body.taste}%"></em></i></div>`;
  $('[data-open="dex"]').classList.toggle('hide', !G.stay && !Object.keys(G.dex || {}).length);
  const guest = G.stay ? `별손님 ${visitorOf(G.stay.day, G.stay.year).name} ${'♥'.repeat(hearts())}${'♡'.repeat(4 - hearts())} · ${G.stay.taught ? '오늘 수업 끝' : G.stay.today && RECIPES[G.stay.today] ? `오늘 궁금한 것 「${RECIPES[G.stay.today].name}」` : '막 도착했어요'}` : '';
  const goal = [G.step === 'homestay' || G.step === 'after_stay' ? '' : GOALS[G.step] || '', guest].filter(Boolean).join('\n');
  $('#goal').classList.toggle('hide', !goal || !!svc);
  $('#goal .txt').textContent = goal;
  $('#svcbar').classList.toggle('hide', !svc);
  if (svc) $('#svcbar').textContent = svc.auto
    ? `${NPC_NAME[svc.helper]}에게 맡김 · ${svc.served}그릇 · ${svc.earned}닢 · 남은 요리 ${readyDishes().reduce((t, d) => t + G.inv[d], 0)}그릇`
    : `영업 중 · 대접 ${svc.served}그릇 · 남은 손님 ${svc.left + svc.cust.filter(c => c.state !== 'out').length}명`;
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
      dlg = { choice: true, done: true, full: '', options, sel: 0, pick: i => { dlg = null; layer.classList.add('hide'); $('#choices').innerHTML = ''; Au.sfx('blip'); resolve(i); } };
      $('#choices').innerHTML = options.map((o, i) => `<button class="btn${i ? '' : ' sel'}" data-i="${i}">${esc(o)}</button>`).join('');
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
    $('#toasts').innerHTML = ''; $('#toasts').classList.add('low'); // 메뉴를 열면 떠 있던 알림은 치우고, 새 알림은 아래로
    const body = $('#panel-body');
    const handler = e => { const el = e.target.closest('[data-a]'); if (el && onClick) onClick(el.dataset.a, el.dataset.v, api); };
    const api = { close, set: h => { body.innerHTML = h; } };
    function close(v) { body.removeEventListener('click', handler); $('#panel-layer').classList.add('hide'); $('#toasts').classList.remove('low'); panelClose = null; busy--; refreshHUD(); resolve(v); }
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
function openBag() { return openPanel('가방', `<p class="center"><button class="btn" data-a="wardrobe">옷장 열기</button></p><p class="center"><small>완성한 요리를 누르면 먹어요. (오늘 ${G.body.meals}/3끼 · 기운 ${G.body.en} · 밥맛 ${G.body.taste})</small></p>` + invHTML('eat') + (G.flags.rod ? `<div class="sec">도구</div><div class="grid"><div class="cell"><img class="ic" src="${iconURL('rod')}"><br>낚싯대</div></div>` : ''), (a, v, p) => { if (a === 'wardrobe') { p.close(); openWardrobe(); } if (a === 'eat') { p.close(); eat(v); if (RECIPES[v]) openBag(); } }); }
function openBook() {
  let h = '<div class="sec">할머니의 레시피 수첩</div>';
  for (const id of RECIPE_ORDER) {
    const r = RECIPES[id];
    if (!G.recipes.includes(id)) { h += `<div class="rcp torn">— 뜯겨 나간 장 —</div>`; continue; }
    const n = servings(id);
    h += `<div class="rcp"><h4><img class="ic" src="${iconURL(id)}">${r.name}<span class="can">${n > 0 ? `지금 ${n}그릇 가능` : '재료 부족'}</span></h4>
      <div class="how">${COOKER_NAME[r.cooker]}에 ▸ ${r.ing.map(i => `<img class="ic s" src="${iconURL(i)}">${itemName(i)}`).join(' + ')}</div>
      <div class="how">${tagLine(id)}</div>
      <div class="memo">"${r.memo}"<br>— ${r.from} · ${priceOf(id)}닢</div></div>`;
  }
  if (Object.keys(G.dex || {}).length) h += `<p class="center"><button class="btn main" data-a="dex">레시피 도감 열기 (${DEX_ORDER.filter(dexFound).length}/${DEX_ORDER.length})</button></p>`;
  const worldFound = DEX_GROUPS.slice(1).flatMap(gr => gr[1]).filter(id => G.recipes.includes(id));
  if (worldFound.length) {
    h += `<div class="sec">찾아낸 세계 요리</div>`;
    for (const id of worldFound) {
      const r = RECIPES[id], n = servings(id);
      h += `<div class="rcp"><h4><img class="ic" src="${iconURL(id)}">${r.name}<span class="can">${n > 0 ? `지금 ${n}그릇 가능` : '재료 부족'}</span></h4>
        <div class="how">${COOKER_NAME[r.cooker]}에 ▸ ${r.ing.map(i => `<img class="ic s" src="${iconURL(i)}">${itemName(i)}`).join(' + ')}</div>
        <div class="how">${tagLine(id)}</div>
        <div class="memo">"${r.memo}"<br>— ${r.from} · ${priceOf(id)}닢</div></div>`;
    }
  }
  h += `<div class="sec">길에서 얻은 레시피</div>`;
  const got = TRAVEL_ORDER.filter(id => G.recipes.includes(id));
  for (const id of got) {
    const r = RECIPES[id], n = servings(id);
    h += `<div class="rcp"><h4><img class="ic" src="${iconURL(id)}">${r.name}<span class="can">${n > 0 ? `지금 ${n}그릇 가능` : '재료 부족'}</span></h4>
      <div class="how">${COOKER_NAME[r.cooker]}에 ▸ ${r.ing.map(i => `<img class="ic s" src="${iconURL(i)}">${itemName(i)}`).join(' + ')}</div>
      <div class="how">${tagLine(id)}</div>
      <div class="memo">"${r.memo}"<br>— ${r.from} · ${priceOf(id)}닢</div></div>`;
  }
  if (got.length < TRAVEL_ORDER.length) h += `<div class="rcp torn">버스를 타고 다른 고장에 가면 그곳의 레시피를 구할 수 있어요</div>`;
  const slots = Math.min(3, rank());
  h += `<div class="sec">나만의 요리 (${G.custom.length}/${slots}) — 별이 오르면 칸이 늘어요</div>`;
  for (const c of G.custom) {
    const n = servings(c.id);
    h += `<div class="rcp"><h4><img class="ic" src="${iconURL(c.id)}">${esc(c.name)}<span class="can">${n > 0 ? `지금 ${n}그릇 가능` : '재료 부족'}</span></h4>
      <div class="how">${COOKER_NAME[c.cooker]}에 ▸ ${c.ing.map(i => `<img class="ic s" src="${iconURL(i)}">${itemName(i)}`).join(' + ')}</div>
      <div class="how">${tagLine(c.id)}</div>
      <div class="memo">${esc(G.name)}의 요리 · ${priceOf(c.id)}닢 <button class="btn" data-a="del" data-v="${c.id}" style="float:right;padding:.1rem .5rem">지우기</button></div></div>`;
  }
  if (!G.recipes.length) h += `<div class="rcp torn">먼저 첫 요리를 만들어 봐요</div>`;
  else if (G.custom.length < slots) h += `<p class="center"><button class="btn main" data-a="new">새 요리 짓기</button></p>`;
  if (G.mem.length || G.recipes.length > 3) {
    h += `<div class="sec">모락국밥의 기억 (${G.mem.length}/4)</div>`;
    for (const k of Object.keys(MEMORIES)) {
      h += G.mem.includes(k) ? `<div class="rcp"><div class="how"><img class="ic s" src="${iconURL(k === 'rice' ? 'rice' : k)}"> ${MEMORIES[k].who}</div><div class="memo">${MEMORIES[k].text}</div></div>` : `<div class="rcp torn">— 아직 듣지 못한 기억 —</div>`;
    }
  }
  return openPanel('수첩', h, (a, v, p) => {
    if (a === 'dex') { p.close(); openDex(); }
    if (a === 'new') { p.close(); openCreator().then(openBook); }
    if (a === 'del' && (svc || looseItems().includes(v))) return no('지금 쓰고 있는 요리예요. 영업이 끝나고 주방을 비운 뒤에 지워요.');
    if (a === 'del') {
      p.close();
      runScene(async () => {
        if (await UI.choose([`「${RECIPES[v].name}」 지우기`, '그만두기']) !== 0) return;
        G.custom = G.custom.filter(c => c.id !== v); G.recipes = G.recipes.filter(r => r !== v);
        delete G.inv[v]; delete RECIPES[v];
      }).then(openBook);
    }
  });
}
function registerCustom(c) {
  RECIPES[c.id] = { name: c.name, cooker: c.cooker, ing: c.ing, price: c.price, custom: true, memo: '', from: '' };
  registerDish(c.id, c.cooker, c.ing);
}
// 나만의 요리 짓기: 조리도구 + 재료 2~3가지 + 이름
function openCreator() {
  const stt = { cooker: null, ing: [], name: '', msg: '' };
  const toIng = b => ITEMS[b].chop ? b + '_c' : b;
  const price = () => Math.round(stt.ing.reduce((n, b) => n + VALUE[b], 0) * 1.5 + 3);
  const autoName = () => stt.ing.length ? `${G.name}표 ${ITEMS[stt.ing[0]].name}${stt.cooker === 'pan' ? '볶음' : '탕'}` : '';
  const html = () => `
    <div class="sec">1. 무엇으로 만들까</div>
    <div class="grid">${['pan', 'pot'].map(k => `<button class="cell ${stt.cooker === k ? 'on' : ''}" data-a="ck" data-v="${k}">${COOKER_NAME[k]}<br><small>${k === 'pan' ? '볶고 굽기' : '끓이고 짓기'}</small></button>`).join('')}</div>
    <div class="sec">2. 재료 2~3가지 (${stt.ing.length}/3)</div>
    <div class="grid">${Object.keys(ITEMS).map(b => `<button class="cell ${stt.ing.includes(b) ? 'on' : ''}" data-a="ing" data-v="${b}"><img class="ic" src="${iconURL(b)}"><br>${ITEMS[b].name}</button>`).join('')}</div>
    <div class="sec">3. 이름</div>
    <p><input id="my-name" maxlength="12" placeholder="${esc(autoName() || '요리 이름')}" value="${esc(stt.name)}"></p>
    <p>${stt.cooker && stt.ing.length ? `성격: ${tagsFor(stt.cooker, stt.ing).map(t => TAG_NAME[t]).join(' · ')}<br>` : ''}${stt.ing.length >= 2 ? `예상 값 <b>${price()}</b>닢 (손맛 보너스 별도)` : '재료가 비쌀수록, 많을수록 값이 올라요.'}${stt.msg ? `<br><span style="color:var(--red)">${stt.msg}</span>` : ''}</p>
    <p class="center"><button class="btn main" data-a="ok">수첩에 적는다</button></p>`;
  return openPanel('나만의 요리 짓기', html(), (a, v, p) => {
    const inp = $('#my-name'); if (inp) stt.name = inp.value;
    stt.msg = '';
    if (a === 'ck') stt.cooker = v;
    if (a === 'ing') { const i = stt.ing.indexOf(v); if (i >= 0) stt.ing.splice(i, 1); else if (stt.ing.length < 3) stt.ing.push(v); }
    if (a === 'ok') {
      const ing = stt.ing.map(toIng);
      const clash = Object.values(RECIPES).find(r => r.cooker === stt.cooker && (subMulti(ing, r.ing) || subMulti(r.ing, ing)));
      if (!stt.cooker) stt.msg = '팬과 냄비 중에 골라 주세요.';
      else if (ing.length < 2) stt.msg = '재료를 두 가지 이상 골라 주세요.';
      else if (clash) stt.msg = `${Object.keys(RECIPES).some(k => RECIPES[k] === clash && G.recipes.includes(k)) ? `「${clash.name}」` : '아직 돌려받지 못한 할머니의 레시피'}와 재료가 겹쳐서 구분이 안 돼요. 재료를 바꿔 보세요.`;
      else {
        const c = { id: 'my' + Date.now().toString(36), name: (stt.name.trim() || autoName()).slice(0, 12), cooker: stt.cooker, ing, price: price() };
        G.custom.push(c); registerCustom(c); G.recipes.push(c.id);
        Au.sfx('page'); toast(`나만의 요리 「${c.name}」 — 수첩에 적었다. 이제 손님이 주문할 수 있어요.`, c.id, 4800);
        save(); return p.close();
      }
    }
    p.set(html());
  });
}
/* ── 마을금고 ── */
function openBank() {
  const B = G.bank;
  const html = () => `<p>"돈 얘기는 깔끔해야지." — 가진 돈 <b>${G.coins}</b>닢</p>
    <div class="sec">예금 — 하룻밤 이자 1% (하루 최대 20닢)</div>
    <div class="row"><span class="grow">맡긴 돈 <b>${B.dep}</b>닢</span><button class="btn" data-a="dep" data-v="50">50 맡기기</button><button class="btn" data-a="wd" data-v="all">모두 찾기</button></div>
    <div class="sec">대출 — 하룻밤 이자 3% · 한도 ${loanLimit()}닢</div>
    <div class="row"><span class="grow">빚 <b>${B.loan}</b>닢</span><button class="btn" data-a="loan" data-v="50">50 빌리기</button><button class="btn" data-a="pay" data-v="50">50 갚기</button><button class="btn" data-a="pay" data-v="all">모두 갚기</button></div>
    <p><small>한도는 식당 별이 오를수록 늘어요. 이자가 쌓여 빚이 한도를 넘으면, 영업 수익의 30%가 자동으로 빚을 갚는 데 들어가요. 가게를 빼앗기는 일은 없어요.</small></p>`;
  return openPanel('솥골 마을금고', html(), (a, v, p) => {
    if (a === 'dep') { const n = Math.min(50, G.coins); if (!n) return no('맡길 돈이 없어요.'); G.coins -= n; B.dep += n; }
    else if (a === 'wd') { G.coins += B.dep; B.dep = 0; }
    else if (a === 'loan') { if (B.loan + 50 > loanLimit()) return no('한도를 넘어요. 식당 별이 오르면 더 빌릴 수 있어요.'); B.loan += 50; G.coins += 50; G.flags.borrowed = true; }
    else if (a === 'pay') { const n = Math.min(v === 'all' ? B.loan : 50, B.loan, G.coins); if (!n) return no(B.loan ? '갚을 돈이 없어요.' : '갚을 빚이 없어요.'); G.coins -= n; B.loan -= n; }
    else return;
    Au.sfx('coin'); p.set(html()); refreshHUD(); checkChallenges();
  });
}
/* ── 건조대·장독 (재료 가공) ── */
function openCraft() {
  const slots = () => owns('rack') ? 4 : 2;
  const html = () => `<p>재료를 널어 두면 <b>하룻밤 뒤</b>에 완성돼요. (자리 ${G.craft.length}/${slots()})</p>
    <div class="sec">널어 둔 것</div>` + (G.craft.length ? G.craft.map((c, i) =>
    `<div class="row"><img class="ic" src="${iconURL(c.id)}"><span class="grow">${itemName(c.id)}</span>${c.ready ? `<button class="btn main" data-a="get" data-v="${i}">거두기</button>` : '<span><small>내일 아침에 완성</small></span>'}</div>`).join('') : '<p><small>비어 있어요.</small></p>') +
    `<div class="sec">새로 널기</div>` + CRAFTS.map(c => {
      const need = Object.entries(c.from), ok = need.every(([k, n]) => inv(k) >= n) && G.craft.length < slots();
      return `<div class="row"><img class="ic" src="${iconURL(c.id)}"><span class="grow">${itemName(c.id)} <small>(팔면 ${sellPrice(c.id)}닢)</small><br><small>${need.map(([k, n]) => `${itemName(k)} ${n}개 (가진 것 ${inv(k)})`).join(', ')} — ${c.how}</small></span>
        <button class="btn" data-a="make" data-v="${c.id}" ${ok ? '' : 'disabled'}>널기</button></div>`;
    }).join('') + `<p><small>가공한 재료는 「나만의 요리」에 넣으면 값이 크게 오르고, 만물상에 팔아도 좋아요.</small></p>`;
  return openPanel('건조대와 장독', html(), (a, v, p) => {
    if (a === 'get') { const c = G.craft[+v]; if (!c || !c.ready) return; G.craft.splice(+v, 1); addItem(c.id); Au.sfx('pick'); }
    else if (a === 'make') {
      const c = CRAFTS.find(x => x.id === v); if (!c || G.craft.length >= slots() || !Object.entries(c.from).every(([k, n]) => inv(k) >= n)) return;
      for (const [k, n] of Object.entries(c.from)) addItem(k, -n);
      G.craft.push({ id: c.id, ready: false }); Au.sfx('put');
    } else return;
    p.set(html());
  });
}
/* ── 의뢰 게시판 ── */
function openBoard() {
  const html = () => `<p>마을 사람들이 붙여 둔 쪽지. 매일 아침 새로 붙어요.</p>` + (G.reqs.length ? G.reqs.map((r, i) =>
    `<div class="row"><img class="ic" src="${iconURL(r.item)}"><span class="grow ${r.done ? 'done' : ''}">${r.done ? '✔ ' : ''}${r.who}<br><small>"${esc(itemName(r.item))} ${r.n}${RECIPES[r.item] ? '그릇' : '개'}만 부탁해요." (가진 것 ${inv(r.item)})</small></span>
     <span><small>${r.coins}닢 · 평판 +${r.rep}</small></span>${r.done ? '' : `<button class="btn" data-a="give" data-v="${i}" ${inv(r.item) >= r.n ? '' : 'disabled'}>건네기</button>`}</div>`).join('') : '<p><small>오늘은 붙은 쪽지가 없어요.</small></p>');
  return openPanel('마을 게시판', html(), (a, v, p) => {
    const r = G.reqs[+v]; if (a !== 'give' || !r || r.done || inv(r.item) < r.n) return;
    addItem(r.item, -r.n); r.done = true; G.coins += r.coins; G.stats.req = (G.stats.req || 0) + 1; Au.sfx('coin');
    toast(`${r.who}: "고마워요, 덕분에 살았어요!"  +${r.coins}닢`, 'heart', 3600);
    gainRep(r.rep); checkChallenges(); p.set(html()); refreshHUD();
  });
}
/* ── 옷장 ── */
function openWardrobe() {
  const L = G.look, has = w => w.free || G.wear.includes(w.id);
  const sw = (col, on, a, v, label) => `<button class="cell ${on ? 'on' : ''}" data-a="${a}" data-v="${v}"><span style="display:inline-block;width:1.6rem;height:1.6rem;background:${col};border:2px solid var(--ink);border-radius:4px"></span>${label ? '<br>' + label : ''}</button>`;
  const html = () => `<p class="center"><img src="${CHARS.player.down[0].toDataURL()}" style="image-rendering:pixelated;width:6rem;background:var(--paper2);border:3px solid var(--ink);border-radius:6px"></p>
    <div class="sec">머리 모양</div><div class="grid">${HAIR_STYLES.map(([k, n]) => `<button class="cell ${L.style === k ? 'on' : ''}" data-a="style" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="sec">머리 색</div><div class="grid">${HAIR_COLORS.map(c => sw(c, L.hair === c, 'hair', c)).join('')}</div>
    <div class="sec">옷</div><div class="grid">${WEAR.filter(w => w.kind === 'shirt' && has(w)).map(w => sw(w.col, L.shirt === w.id, 'shirt', w.id, w.name + (w.fx ? `<br><small>${w.fx}</small>` : ''))).join('')}</div>
    <div class="sec">모자</div><div class="grid">${WEAR.filter(w => w.kind === 'hat' && has(w)).map(w => sw(w.col, L.hat === w.id, 'hat', w.id, w.name + (w.fx ? `<br><small>${w.fx}</small>` : ''))).join('')}</div>
    <div class="sec">앞치마</div><div class="grid"><button class="cell ${L.apron ? 'on' : ''}" data-a="apron" data-v="1">두른다</button><button class="cell ${L.apron ? '' : 'on'}" data-a="apron" data-v="">벗는다</button></div>
    <p><small>옷과 모자는 버스를 타고 간 고장마다 다른 것을 팔아요. (지금 ${WEAR.filter(has).length}/${WEAR.length}벌)</small></p>`;
  return openPanel('옷장', html(), (a, v, p) => {
    if (a === 'apron') L.apron = !!v; else if (['style', 'hair', 'shirt', 'hat'].includes(a)) L[a] = v; else return;
    applyLook(); Au.sfx('blip'); p.set(html());
  });
}
/* ── 버스: 다른 고장 다녀오기 ── */
function openPlace(pid) {
  const pl = PLACES[pid], wear = () => WEAR.filter(w => w.at === pid);
  const html = () => `<p>가진 돈 <b>${G.coins}</b>닢</p><div class="sec">이 고장 재료</div>` + pl.goods.map(([id, pr]) =>
    `<div class="row"><img class="ic" src="${iconURL(id)}"><span class="grow">${ITEMS[id].name} <small>(가진 것 ${inv(id)})</small></span><span>${buyPrice(id, pr)}닢</span><button class="btn" data-a="buy" data-v="${id}" ${G.coins < buyPrice(id, pr) ? 'disabled' : ''}>사기</button></div>`).join('') +
    `<div class="sec">이 고장 레시피</div>` + (G.recipes.includes(pl.recipe[0]) ? `<p class="done">✔ 「${RECIPES[pl.recipe[0]].name}」 — 이미 배웠어요</p>` :
    `<div class="row"><img class="ic" src="${iconURL(pl.recipe[0])}"><span class="grow">「${RECIPES[pl.recipe[0]].name}」 적어 주는 값</span><span>${pl.recipe[1]}닢</span><button class="btn" data-a="rcp" ${G.coins < pl.recipe[1] ? 'disabled' : ''}>배우기</button></div>`) +
    `<div class="sec">옷과 모자</div>` + wear().map(w => G.wear.includes(w.id) ? `<p class="done">✔ ${w.name}</p>` :
    `<div class="row"><span style="display:inline-block;width:1.6rem;height:1.6rem;background:${w.col};border:2px solid var(--ink);border-radius:4px"></span><span class="grow">${w.name}${w.fx ? `<br><small>${w.fx}</small>` : ''}</span><span>${w.cost}닢</span><button class="btn" data-a="wear" data-v="${w.id}" ${G.coins < w.cost ? 'disabled' : ''}>사기</button></div>`).join('') +
    (pid === 'farm' ? `<div class="sec">납품 계약</div>` + (G.flags.contract ? '<p class="done">✔ 매일 아침 배추 2 · 고추 1 · 달걀 2가 문 앞에 와요</p>' :
    `<div class="row"><span class="grow">농장과 손잡기<br><small>매일 아침 배추 2 · 고추 1 · 달걀 2 배달</small></span><span>120닢</span><button class="btn" data-a="contract" ${G.coins < 120 ? 'disabled' : ''}>계약</button></div>`) : '') +
    `<p class="center"><button class="btn main" data-a="back">솥골로 돌아간다</button></p>`;
  return openPanel(pl.name, html(), (a, v, p) => {
    if (a === 'back') return p.close();
    if (a === 'buy') { const g = pl.goods.find(x => x[0] === v), pr = buyPrice(v, g[1]); if (G.coins < pr) return; G.coins -= pr; addItem(v); }
    else if (a === 'rcp') { if (G.coins < pl.recipe[1]) return; G.coins -= pl.recipe[1]; G.recipes.push(pl.recipe[0]); toast(`레시피 「${RECIPES[pl.recipe[0]].name}」 — 수첩에 끼워 넣었다`, 'page', 4200); }
    else if (a === 'wear') { const w = WEAR.find(x => x.id === v); if (!w || G.coins < w.cost) return; G.coins -= w.cost; G.wear.push(w.id); toast(`${w.name} — 가방의 옷장에서 입을 수 있어요`, null, 4000); }
    else if (a === 'contract') { if (G.coins < 120) return; G.coins -= 120; G.flags.contract = true; toast('농장과 손을 잡았다! 내일 아침부터 배달이 와요.', 'cabbage', 4200); }
    else return;
    Au.sfx('coin'); p.set(html()); refreshHUD();
  });
}
async function travel() {
  if (!opened()) return story.look.busstop();
  if (G.servedToday || G.time >= 17 * 60) return UI.narr('막차가 끊겼다.\n내일 낮에 다시 오자.');
  if (G.traveled) return UI.narr('오늘은 이미 다녀왔다.\n버스는 하루 한 번이면 족하다.');
  const ids = Object.keys(PLACES);
  const c = await UI.choose([...ids.map(id => `${PLACES[id].name} — 차비 ${PLACES[id].fare}닢${rank() < PLACES[id].rank ? ` (${PLACES[id].rank}성부터)` : ''}`), '그만둔다']);
  if (c >= ids.length) return;
  const pid = ids[c], pl = PLACES[pid];
  if (rank() < pl.rank) return UI.narr('아직은 낯선 곳이다.\n식당 이름이 조금 더 알려지면 가 보자.');
  if (G.coins < pl.fare) return UI.narr('차비가 모자라다.');
  G.coins -= pl.fare; G.traveled = true; Au.sfx('door'); tire(10);
  await UI.black(true);
  await UI.narr(pl.arrive);
  await openPlace(pid);
  if (Math.random() < 0.4) { addItem(pl.find); await UI.narr(`돌아오는 길에 ${ITEMS[pl.find].name} 하나를 덤으로 얻었다.\n"순례 형님 생각나서 그래. 가져가."`); }
  G.time = Math.max(G.time, 15 * 60);
  await UI.narr('해가 기울 무렵, 솥골로 돌아왔다.');
  await UI.black(false);
}
/* ── 마을을 오가는 사람들 ── */
const walkers = [];
const WAYPOINTS = [[2, 17], [43, 18], [22, 4], [23, 25], [28, 17], [15, 17], [22, 28], [6, 17], [30, 8], [36, 18], [12, 27], [26, 18]];
function updateWalkers(dt) {
  const want = G.time >= 19 * 60 ? 0 : Math.min(7, 3 + rank()) + (G.event === 'market' || G.event === 'tour' ? 3 : 0) - (G.event === 'rain' ? 2 : 0);
  while (walkers.length < want) { const [x, y] = pickOne(WAYPOINTS); walkers.push({ spr: CHARS['guest' + Math.floor(Math.random() * GUEST_LOOKS.length)], x, y, px: x * T, py: y * T, dir: 'down', path: [], wait: Math.random() * 3, walkT: 0, sp: 22 + Math.random() * 12, idle: true }); }
  if (walkers.length > want) walkers.length = Math.max(0, want);
  for (const w of walkers) {
    if (w.wait > 0) { w.wait -= dt; w.idle = true; continue; }
    w.idle = false;
    if (moveGuest(w, dt)) {
      if (Math.random() < 0.3 && Math.abs(w.x - P.x) + Math.abs(w.y - P.y) < 9) floater(w.px + 8, w.py - 12, pickOne(WALKER_LINES), 'bubble', 2.4);
      w.wait = 1 + Math.random() * 4; w.dir = 'down';
      const [tx, ty] = pickOne(WAYPOINTS);
      w.path = bfs(w.x, w.y, (x, y) => x === tx && y === ty, (x, y) => passable(x, y, true)) || [];
    }
  }
}
/* ── 장부: 평판·손맛·확장·도전 ── */
async function pickTrait() {
  if (!G.trait) G.trait = pickOne(Object.keys(TRAITS));
  Au.sfx('heart');
  await UI.narr(`내 손이 가장 잘하는 건…\n「${TRAITS[G.trait].name}」\n${TRAITS[G.trait].desc}`);
  toast(`나의 손맛 — ${TRAITS[G.trait].name}\n장부에서 100닢으로 다시 뽑을 수 있어요.`, 'heart', 5000);
}
function openLedger() {
  const html = () => {
    const r = rank(), next = RANKS[r];
    return `<div class="sec">모락식당 ${'★'.repeat(r)}${'☆'.repeat(5 - r)}</div>
      <p>평판 <b>${G.rep}</b>${next !== undefined ? ` · 다음 별까지 ${next - G.rep}` : ' · 최고 등급'}<br>
      <small>한 그릇 대접할 때마다 평판 +1, 빨리 내면 +1 더.<br>지금은 한 번 영업에 손님 최대 ${4 + r * 2}명 · 빠른 대접 팁 ${(2 + r) * (G.trait === 'warm' ? 2 : 1)}닢 · 나만의 요리 ${Math.min(3, r)}칸</small></p>
      <div class="sec">나의 손맛</div>
      ${G.trait ? `<div class="row"><span class="grow">${TRAITS[G.trait].name}<br><small>${TRAITS[G.trait].desc}</small></span><button class="btn" data-a="trait" ${G.coins < 100 ? 'disabled' : ''}>다시 뽑기 100닢</button></div>` : '<p>아직 정하지 않았어요. 첫 요리를 만들면 알게 돼요.</p>'}
      <div class="sec">몸 상태</div>
      <p>기운 <b>${G.body.en}</b>/100 · 밥맛 <b>${G.body.taste}</b>/100 — ${tasteWord()}<br>
      <small>· 기운: 채집·낚시·대접·먼 길에 빠지고, 내가 만든 요리를 먹거나 자면 차요. 25 아래면 걸음이 느려지고, 0이면 채집을 못 해요.<br>
      · 밥맛: 끼니를 챙기면 오르고(안 먹던 음식일수록, 누군가와 같이 먹으면 더), 거르면 떨어져요. 70 이상이면 요리 값 +10%, 30 아래면 -10%.<br>
      · 오늘 ${G.body.meals}/3끼${G.body.shared ? ' · 오늘은 같이 먹었다' : ''}<br>
      · 같이 먹은 밥: ${Object.keys(NPC_DONE).map(k => `${NPC_NAME[k]} ${(G.bond || {})[k] || 0}번`).join(' · ')} — 자주 마주 앉을수록 속 얘기를 들려줘요.</small></p>
      <div class="sec">가게 살림 (도윤의 목공소에서 늘려요)</div>
      <p>식탁 ${tables().length}개 · 팬 ${owns('pan2') ? 2 : 1}개 · 냄비 ${owns('pot2') ? 2 : 1}개${UPGRADES.filter(u => owns(u.id) && !/table|pan2|pot2/.test(u.id)).map(u => ' · ' + u.name).join('')}</p>
      <div class="sec">도전 과제 (${CHALLENGES.filter(c => G.done[c.id]).length}/${CHALLENGES.length})</div>
      ${CHALLENGES.map(c => `<div class="row"><span class="grow ${G.done[c.id] ? 'done' : ''}">${G.done[c.id] ? '✔ ' : ''}${c.name}<br><small>${c.desc}</small></span><span>${c.reward}닢</span></div>`).join('')}
      <div class="sec">함께한 시간</div><p>문 연 날 <b>${G.realDays || 1}</b>일 · 함께한 시간 <b>${fmtDur((G.stats.playSec || 0) * 1000)}</b><br><small>자리를 비운 사이에도 장독은 익고 텃밭은 자라요. 8시간까지 세어 줘요.</small></p>
      <div class="sec">지금까지</div><p>대접한 그릇 ${G.stats.served} · 맡겨 두고 판 그릇 ${G.stats.auto || 0} · 번 돈 ${G.stats.earned}닢 · 하루 최고 ${G.stats.best || 0}그릇</p>`;
  };
  return openPanel('장부', html(), (a, v, p) => {
    if (a === 'trait' && G.coins >= 100) {
      p.close();
      runScene(async () => {
        if (await UI.choose(['100닢 내고 다시 뽑기', '그만두기']) !== 0) return;
        const old = G.trait; G.coins -= 100;
        do { G.trait = pickOne(Object.keys(TRAITS)); } while (G.trait === old);
        await pickTrait();
      });
    }
  });
}
function openWorkshop() {
  const locked = u => rank() < u.rank || (u.need && !owns(u.need));
  const html = () => `<p>"재료값만 받을게요." — 가진 돈 <b>${G.coins}</b>닢 · 식당 ${rank()}성</p>` + UPGRADES.map(u =>
    `<div class="row"><span class="grow ${owns(u.id) ? 'done' : ''}">${owns(u.id) ? '✔ ' : ''}${u.name}<br><small>${u.desc}</small></span>
     ${owns(u.id) ? '<span>완료</span>' : locked(u) ? `<span><small>${rank() < u.rank ? u.rank + '성부터' : '앞 단계 먼저'}</small></span>` : `<button class="btn" data-a="up" data-v="${u.id}" ${G.coins < u.cost ? 'disabled' : ''}>${u.cost}닢</button>`}</div>`).join('');
  return openPanel('도윤의 목공소', html(), (a, id, p) => {
    const u = UPGRADES.find(x => x.id === id);
    if (a !== 'up' || !u || owns(u.id) || locked(u) || G.coins < u.cost) return;
    G.coins -= u.cost; G.up[u.id] = 1; Au.sfx('done');
    toast(`${u.name} — 다 됐어요. 식당에 가 보세요.`, null, 4000); p.set(html()); refreshHUD();
  });
}
function openSettings() {
  const html = () => `
    <div class="row"><span class="grow">효과음</span><button class="btn" data-a="sfx">${Au.opt.sfx ? '켜짐' : '꺼짐'}</button></div>
    <div class="row"><span class="grow">배경 음악</span><button class="btn" data-a="music">${Au.opt.music ? '켜짐' : '꺼짐'}</button></div>
    <div class="row"><span class="grow">지금 저장</span><button class="btn" data-a="save">저장</button></div>
    <div class="row"><span class="grow">어제 아침으로 되돌리기<br><small>하루가 바뀔 때마다 자동으로 남겨 둬요</small></span><button class="btn" data-a="restore">되돌리기</button></div>
    <div class="row"><span class="grow">백업 코드<br><small>다른 기기로 옮기거나 지워질 때를 대비해요</small></span><button class="btn" data-a="backup">열기</button></div>
    <div class="row"><span class="grow">처음부터 다시</span><button class="btn" data-a="reset">지우기</button></div>
    ${window.__TOSS__ ? '' : `<div class="row"><span class="grow">예전 여행 수첩 앱</span><a class="btn" href="heuksim/" style="text-decoration:none">열기</a></div>`}
    <div class="sec">조작</div>
    <p>· 화면을 누르면 그곳으로 걸어가요.<br>· 사람·물건·조리대를 누르면 다가가서 말을 걸거나 써요.<br>· 키보드: 방향키/WASD 이동, 스페이스 살펴보기, Esc 닫기.<br>· 게임 패드: 십자 버튼·스틱 이동, A 살펴보기, B 닫기, X 가방, Y 수첩, START 장부, SELECT 설정. 메뉴 안에서는 십자 버튼으로 고르고 A로 눌러요.</p>
    <div class="sec">요리 순서</div>
    <p>선반에서 재료 꺼내기 → (채소·두부·버섯은) 도마에서 손질 → 레시피에 맞는 팬/냄비에 넣기 → 다 되면 꺼내서 손님 식탁으로.<br>한 번에 하나만 들 수 있고, 빈 조리대에 잠깐 올려 둘 수 있어요.</p>`;
  return openPanel('설정', html(), (a, v, p) => {
    if (a === 'sfx') Au.setSfx(!Au.opt.sfx);
    if (a === 'music') Au.setMusic(!Au.opt.music);
    if (a === 'save') { save(); toast('저장했어요.'); }
    if (a === 'reset') {
      p.close();
      return runScene(async () => {
        if (await UI.choose(['모두 지우고 처음으로', '그만두기']) !== 0) return;
        try { localStorage.removeItem(SAVE); localStorage.removeItem(BACKUP); } catch (e) { /* 무시 */ }
        mode = 'title'; location.reload();
      });
    }
    if (a === 'restore') {
      p.close();
      return runScene(async () => {
        let b = null; try { b = parseSave(localStorage.getItem(BACKUP)); } catch (e) { b = null; }
        if (!b) return UI.narr('아직 남겨 둔 백업이 없어요.\n하루를 마치면 생겨요.');
        if (await UI.choose([`${b.day}일째 아침으로 되돌리기`, '그만두기']) !== 0) return;
        localStorage.setItem(SAVE, JSON.stringify(b)); mode = 'title'; location.reload();
      });
    }
    if (a === 'backup') { p.close(); return openBackup(); }
    p.set(html());
  });
}
function openBackup() {
  save();
  let code = '';
  try { code = encodeSave(localStorage.getItem(SAVE) || ''); } catch (e) { code = ''; }
  const html = () => `<div class="sec">내 백업 코드</div>
    <p><small>이 코드를 메모장이나 메신저 '나에게 보내기'에 붙여 두면, 언제든 이 진행으로 돌아올 수 있어요.</small></p>
    <textarea id="bk-out" readonly rows="4" style="width:100%;font:inherit;font-size:.7rem;word-break:break-all">${code}</textarea>
    <p class="center"><button class="btn main" data-a="copy">코드 복사</button></p>
    <div class="sec">백업 코드로 불러오기</div>
    <textarea id="bk-in" rows="4" placeholder="여기에 백업 코드를 붙여 넣어요" style="width:100%;font:inherit;font-size:.7rem;user-select:text;-webkit-user-select:text"></textarea>
    <p class="center"><button class="btn" data-a="load">불러오기</button></p>`;
  return openPanel('백업 코드', html(), (a, v, p) => {
    if (a === 'copy') {
      const t = $('#bk-out');
      (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('복사했어요.')).catch(() => { t.select(); toast('코드를 길게 눌러 복사해 주세요.'); });
    }
    if (a === 'load') {
      const d = parseSave(decodeSave($('#bk-in').value));
      if (!d) return no('올바른 백업 코드가 아니에요. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인해 주세요.');
      p.close();
      runScene(async () => {
        if (await UI.choose([`${d.name}의 ${d.day}일째로 불러오기 (지금 진행은 사라져요)`, '그만두기']) !== 0) return;
        localStorage.setItem(SAVE, JSON.stringify(d)); mode = 'title'; location.reload();
      });
    }
  });
}
function shopList() {
  const extra = Object.keys(G.world || {}).filter(w => G.world[w]).flatMap(w => WORLD[w].items);
  return [...new Set([...SHOP_LIST, ...extra])];
}
function openShop() {
  if (G.coins < 4 && stock('rice') === 0 && !G.flags.credit) {
    G.flags.credit = true; addItem('rice', 3); addItem('egg', 3);
    toast('이장님이 쌀과 달걀을 외상으로 쥐여 줬다. "나중에 밥으로 갚아라!"', 'rice', 4500);
  }
  const sellable = () => Object.keys(G.inv).filter(i => G.inv[i] > 0);
  const html = () => `<p>"필요한 거 골라 봐라. 싸게 주마!" — 가진 돈 <b>${G.coins}</b>닢</p><div class="sec">사기</div>` + shopList().map(id =>
    `<div class="row"><img class="ic" src="${iconURL(id)}"><span class="grow">${ITEMS[id].name} <small>(가진 것 ${inv(id)})</small></span><span>${buyPrice(id)}닢</span>
     <button class="btn" data-a="buy" data-v="${id}" ${G.coins < buyPrice(id) ? 'disabled' : ''}>사기</button></div>`).join('') +
    `<div class="sec">팔기 — 남는 재료나 요리</div>` + (sellable().length ? sellable().map(id =>
    `<div class="row"><img class="ic" src="${iconURL(id)}"><span class="grow">${esc(itemName(id))} <small>(${inv(id)})</small></span><span>${sellPrice(id)}닢</span>
     <button class="btn" data-a="sell" data-v="${id}">팔기</button></div>`).join('') : '<p><small>팔 것이 없어요.</small></p>');
  return openPanel('봉 이장네 만물상', html(), (a, id, p) => {
    if (a === 'buy' && G.coins >= buyPrice(id)) { G.coins -= buyPrice(id); addItem(id); Au.sfx('coin'); }
    else if (a === 'sell' && inv(id) > 0) { G.coins += sellPrice(id); addItem(id, -1); Au.sfx('coin'); }
    else return;
    p.set(html()); refreshHUD(); checkProgress();
  });
}
document.querySelector('#hud-btns').addEventListener('click', e => {
  const b = e.target.closest('[data-open]'); if (!b || busy || mode !== 'play') return;
  Au.sfx('blip');
  ({ bag: openBag, book: openBook, set: openSettings, ledger: openLedger, dex: openDex })[b.dataset.open]();
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
  workshop: () => openWorkshop(),
  bank: () => openBank(),
  taste(n) { G.body.taste = clampB(G.body.taste + n); toast(`밥맛이 조금 돌아왔다 (+${n})`, 'heart', 4000); },
  pickTrait: () => pickTrait(),
});
function checkProgress() {
  if (!G) return;
  if (G.step === 'gather' && stock('pa') >= 1 && stock('rice') >= 1 && stock('egg') >= 1) { G.step = 'first_cook'; toast('재료가 다 모였다! 식당 주방으로 가자.', 'egg_rice', 4200); }
  checkChallenges();
  refreshHUD();
}
const QUEST_NPC = { gather: 'ijang', q_geumja: 'geumja', q_sori: 'sori', q_doyun: 'doyun', q_captain: 'captain', q_ijang2: 'ijang' };

/* ═════════ 상호작용 ═════════ */
function interact(th) {
  if (busy || !th) return;
  const vc = villageClue(th); if (vc) return runScene(vc);
  switch (th.type) {
    case 'npc': if (th.id === 'visitor') return runScene(talkVisitor);
      return runScene(async () => {
      const dishes = Object.keys(G.inv).filter(i => RECIPES[i] && G.inv[i] > 0);
      if (opened() && !G.body.shared && dishes.length && QUEST_NPC[G.step] !== th.id && STEPS.indexOf(G.step) > STEPS.indexOf(NPC_DONE[th.id])) {
        if (await UI.choose(['같이 밥을 먹는다', '이야기한다']) === 0) return shareMeal(th.id, dishes);
      }
      return story.talk[th.id]();
    });
    case 'look': if (th.id === 'cat') Au.sfx('pick'); return runScene(() => story.look[th.id]());
    case 'node': return harvest(th);
    case 'fish': return startFishing();
    case 'bus': return runScene(travel);
    case 'craft': return opened() ? openCraft() : runScene(() => UI.narr('빈 장독과 건조대.\n할머니가 쓰던 것이다.'));
    case 'reqboard': return opened() ? openBoard() : runScene(() => UI.narr('마을 게시판.\n지금은 붙은 쪽지가 없다.'));
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
  if (G.body.en <= 0) return no('너무 지쳤어요. 뭐라도 먹거나 푹 자요.');
  const crop = th.id.startsWith('crop');
  tire(3, true);
  const n = th.n + (G.trait === 'thrift' ? 1 : 0) + (owns(th.id.startsWith('crop') ? 'garden' : 'basket') ? 1 : 0) + (G.event === 'harvest' && crop ? 1 : 0)
    + (crop && wearing('hat_straw') ? 1 : 0) + ((th.item === 'clam' || th.item === 'miyeok') && wearing('hat_towel') ? 1 : 0) + (hearts() >= 3 ? 1 : 0);
  G.taken[th.id] = 1; addItem(th.item, n); Au.sfx('pick');
  floater(th.x * T + 8, th.y * T, `+${n} ${itemName(th.item)}`);
  checkProgress();
}
function startFishing() {
  if (!G.flags.rod) return runScene(() => UI.narr('물결이 인다. 물고기가 있는 것 같다.\n낚싯대가 있으면 좋을 텐데.'));
  if (G.fishLeft <= (wearing('shirt_navy') ? -2 : 0)) return toast('오늘은 물고기가 더 안 보여요. 바다도 쉬어야죠.');
  if (G.body.en <= 0) return no('너무 지쳤어요. 뭐라도 먹거나 푹 자요.');
  P.fish = { t: 0, bite: 1.6 + Math.random() * 2.6, state: 'wait' };
  P.dir = 'left'; Au.sfx('splash');
  toast('찌를 던졌다… 「!」가 뜨면 화면을 눌러요.');
}
function reel() {
  const f = P.fish; if (!f) return;
  if (f.state === 'bite') {
    addItem('fish'); G.fishLeft--; tire(3, true); Au.sfx('pick'); Au.sfx('splash');
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
  snapCam(); placeBuddy();
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
  P.act = { t: 0, dur: 0.9 / TEST_SPEED * (owns('knife') ? 0.5 : 1) * (G.trait === 'quick' ? 0.4 : 1) * (hearts() >= 2 ? 0.4 : 1), tick: 0, done() { P.hands += '_c'; Au.sfx('put'); } };
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
  const mine = [...G.recipes, ...discoverable()].filter(r => RECIPES[r].cooker === c.kind);
  if (!mine.some(r => subMulti(next, RECIPES[r].ing))) return no(`이 조합으로는 ${cname}에서 아무것도 안 될 것 같아요. (수첩·도감의 단서를 봐요)`);
  c.contents = next; P.hands = null; Au.sfx('put');
  const full = mine.find(r => RECIPES[r].ing.length === next.length && subMulti(next, RECIPES[r].ing));
  if (full) {
    c.cook = 0; c.making = full; Au.sfx('sizzle');
    if (!G.recipes.includes(full)) { // 새 요리 발견!
      G.recipes.push(full); Au.sfx('page');
      const w = RECIPES[full].world;
      toast(`새 요리 발견! 「${RECIPES[full].name}」\n${w ? WORLD[w].name + ' 요리 — ' : ''}도감에 올랐고, 이제 손님도 주문해요.`, full, 6000);
      checkChallenges();
    }
  }
}
function updateCookers(dt) {
  for (const c of MAPS.shop.things) {
    if (c.type !== 'cooker' || c.cook === null) continue;
    const fast = (G.trait === 'fire' && c.kind === 'pan') || (G.trait === 'soup' && c.kind !== 'pan') ? 0.75 : 1;
    c.cook += dt * TEST_SPEED / ((c.kind === 'cauldron' ? 7 : 5) * (owns('stove') ? 0.7 : 1) * fast);
    if (Math.random() < dt * 9) particles.push({ x: c.x * T + c.w * 8 - 4 + Math.random() * 8, y: T + 4, vx: (Math.random() - 0.5) * 4, vy: -9 - Math.random() * 6, life: 1.3, max: 1.3 });
    if (c.cook >= 1) { c.cook = null; c.result = c.making; c.contents = []; Au.sfx('done'); floater(c.x * T + c.w * 8, T - 4, `${RECIPES[c.result].name} 완성!`); }
  }
}

/* ── 영업 ── */
function menuNow(reserved) { return G.recipes.filter(r => servings(r, reserved) > 0 || dishStock(r) > 0); }
const helperId = () => STEPS.indexOf(G.step) > STEPS.indexOf('q_sori') ? 'sori' : 'ijang';
const readyDishes = () => Object.keys(G.inv).filter(i => RECIPES[i] && G.inv[i] > 0);
function useSign() {
  if (svc) {
    if (svc.auto) return runScene(async () => { if (await UI.choose(['이제 그만 맡기기', '계속 지켜보기']) === 0) { svc.left = 0; toast('남은 손님까지만 받고 닫을게요.'); } });
    return toast('영업 중이에요. 손님이 모두 돌아가면 끝나요.');
  }
  if (G.step === 'enter_shop' || G.step === 'gather' || G.step === 'first_cook') return toast('아직은 일러요. 먼저 음식을 하나 만들어 봐요.');
  const canAuto = opened() && readyDishes().length > 0;
  const menu = menuNow({}), canOpen = !G.servedToday && menu.length > 0;
  if (!canOpen && !canAuto) {
    if (G.servedToday) return toast('오늘 영업은 끝났어요. 2층에서 푹 쉬어요.\n만들어 둔 요리가 있으면 가게를 맡겨 둘 수도 있어요.');
    return no('지금 만들 수 있는 요리가 없어요. 재료를 구해 와요.');
  }
  runScene(async () => {
    const opts = [];
    if (canOpen) { await UI.narr(`오늘의 메뉴: ${menu.map(r => RECIPES[r].name).join(', ')}`); opts.push('영업을 시작한다'); }
    if (canAuto) opts.push(`${NPC_NAME[helperId()]}에게 맡기고 지켜본다`);
    opts.push('아직 준비 중');
    const pick = opts[await UI.choose(opts)];
    if (pick === '영업을 시작한다') {
      svc = { left: Math.max(2, Math.min(G.recipes.length + tables().length, 4 + rank() * 2) + ({ rain: -2, market: 3, tour: 4 }[G.event] || 0)), spawnT: 1.2, cust: [], served: 0, earned: 0, missed: 0, reserved: {}, usedNpc: {}, stuck: 0 };
      G.time = Math.max(G.time, 17 * 60);
      Au.setMood('service'); Au.sfx('door'); toast('모락식당, 문 열었습니다!');
    } else if (pick.includes('맡기고')) await startAuto();
  });
}
// 미리 만들어 둔 요리를 돕는 사람이 대신 내 줘요. 화면을 켜 둔 동안 손님이 오고, 나는 구경만 해도 돼요.
async function startAuto() {
  const id = helperId(), n = readyDishes().reduce((t, d) => t + G.inv[d], 0);
  await UI.say(id, id === 'sori'
    ? `맡겨 줘요! 만들어 둔 요리 ${n}그릇, 제가 손님상에 내갈게요. 편히 구경해요.`
    : `허허, 가게는 내가 보마. 만들어 둔 ${n}그릇 다 팔 때까지 좀 앉아 쉬어라.`);
  svc = { auto: true, helper: id, left: Infinity, spawnT: 2, cust: [], served: 0, earned: 0, missed: 0, reserved: {}, dishRes: {}, usedNpc: {}, stuck: 0,
    helperG: { spr: CHARS[id], dir: 'down', x: 13, y: 3, px: 13 * T, py: 3 * T, idle: true, walkT: 0 } };
  Au.setMood('day'); Au.sfx('door');
  toast('가게를 맡겼어요. 손님이 오면 알아서 내 줘요.\n그만하려면 문 옆 팻말을 눌러요. 그 사이에 요리를 더 만들어 선반에 넣어도 돼요.', null, 6500);
}
function endAuto() {
  const s = svc; svc = null; Au.sfx('done');
  const line = s.helper === 'sori'
    ? (s.served ? `${s.served}그릇 나갔어요! ${s.earned}닢이에요. 잘했죠?` : '오늘은 조용했어요.')
    : (s.served ? `허허, ${s.served}그릇 다 나갔다! ${s.earned}닢이다.` : '오늘은 손님이 뜸하구먼.');
  toast(`${NPC_NAME[s.helper]}: "${line}"`, 'coin', 5200);
  refreshHUD(); save();
}
function pickOrder() {
  const c = svc.auto ? readyDishes().filter(r => G.inv[r] - (svc.dishRes[r] || 0) > 0) : G.recipes.filter(r => servings(r, svc.reserved) > 0);
  if (!c.length) return null;
  return c[Math.floor(Math.random() * c.length)];
}
function reserve(rid, sign) { const need = needOf(rid); for (const b in need) svc.reserved[b] = (svc.reserved[b] || 0) + sign * need[b]; }
function spawnGuest(rid, table) {
  let npc = null;
  const pool = Object.keys(NPC_GUEST_LINES).filter(n => !svc.usedNpc[n] && G.step !== 'first_open');
  if (pool.length && Math.random() < 0.3) { npc = pool[Math.floor(Math.random() * pool.length)]; svc.usedNpc[npc] = 1; }
  const spr = npc ? CHARS[npc] : CHARS['guest' + Math.floor(Math.random() * GUEST_LOOKS.length)];
  const g = { spr, npc, x: 8, y: 9, px: 8 * T, py: 10 * T, dir: 'up', state: 'in', table, order: rid, patience: (G.trait === 'warm' ? 130 : 90) + (wearing('shirt_plum') ? 15 : 0), t: 0, walkT: 0 };
  g.maxP = g.patience;
  if (svc.auto) { /* 맡겨 둔 가게는 이름 그대로 주문해요 */ }
  else if (G.event === 'gourmet' && !svc.gourmet) { svc.gourmet = true; g.gourmet = true; }
  else if (opened() && Math.random() < 0.35) { // 요리 이름 대신 사정을 말하는 손님 (예약해 둔 요리로 풀 수 있는 사정만)
    const ms = MOODS.filter(m => dishTags(rid).includes(m.tag)); if (ms.length) g.mood = pickOne(ms);
  }
  g.path = bfs(8, 9, (x, y) => x === table.x && y === table.y - 1, (x, y) => passable(x, y, true)) || [];
  table.cust = g; if (svc.auto) svc.dishRes[rid] = (svc.dishRes[rid] || 0) + 1; else reserve(rid, 1);
  svc.cust.push(g); Au.sfx('door');
}
function moveGuest(g, dt) {
  const tx = g.x * T, ty = g.y * T, sp = (g.sp || 52) * dt;
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
  const free = tables().filter(t => !t.cust);
  if (svc.left > 0 && svc.spawnT <= 0 && free.length) {
    const rid = pickOrder();
    if (svc.auto && !rid) { if (svc.cust.length) svc.spawnT = 2; else svc.left = 0; }
    else if (rid && svc.auto) { spawnGuest(rid, pickOne(free)); svc.spawnT = 7 + Math.random() * 6; }
    else if (rid) { spawnGuest(rid, free[Math.floor(Math.random() * free.length)]); svc.left--; svc.spawnT = (6 + Math.random() * 5) * 3 / tables().length; svc.stuck = 0; }
    else { svc.spawnT = 2; if (!svc.cust.length && ++svc.stuck >= 2) { svc.left = 0; toast('재료가 다 떨어졌어요. 오늘은 여기까지!'); } }
  }
  for (let i = svc.cust.length - 1; i >= 0; i--) {
    const g = svc.cust[i];
    if (g.state === 'in') { if (moveGuest(g, dt)) { g.state = 'wait'; g.dir = 'down'; Au.sfx('blip'); if (g.mood) floater(g.px + 8, g.py - 30, g.mood.line, 'bubble', 4.5); } }
    else if (g.state === 'wait' && svc.auto) {
      g.t += dt;
      if (g.t >= 2.5) { // 돕는 사람이 내 줘요
        addItem(g.order, -1); svc.dishRes[g.order]--;
        g.state = 'eat'; g.t = 4.5; g.served = g.order; g.table.dish = g.order;
        svc.served++; G.stats.auto = (G.stats.auto || 0) + 1; Au.sfx('heart');
        floater(svc.helperG.px + 8, svc.helperG.py - 12, pickOne(['나갑니다!', '맛있게 드세요!', '여기요!']), 'bubble', 1.6);
        floater(g.px + 8, g.py - 12, pickOne(GUEST_LINES), 'bubble', 2.4);
      }
    }
    else if (g.state === 'wait') {
      g.patience -= dt;
      if (g.patience <= 0) { reserve(g.order, -1); svc.missed++; floater(g.px + 8, g.py - 12, '다음에 올게요…', 'bubble', 2); leave(g); }
    } else if (g.state === 'eat') {
      g.t -= dt;
      if (g.t <= 0) {
        const pay = svc.auto ? Math.round(priceOf(g.order) * 0.8) : Math.round(priceOf(g.served || g.order) * (g.gourmet ? 3 : 1) * (g.mood ? (g.fit ? 1.5 : 0.8) : 1)) + (g.tip ? (2 + rank() + (wearing('shirt_red') ? 1 : 0)) * (G.trait === 'warm' ? 2 : 1) : 0);
        G.coins += pay; svc.earned += pay; G.stats.earned += pay; Au.sfx('coin');
        floater(g.px + 8, g.py - 10, `+${pay}닢`);
        leave(g);
      }
    } else if (g.state === 'out') { if (moveGuest(g, dt)) svc.cust.splice(i, 1); }
  }
  if (svc.left <= 0 && !svc.cust.length) (svc.auto ? endAuto() : endService());
}
function useTable(t) {
  const g = t.cust;
  if (svc && svc.auto && g) return toast(`${NPC_NAME[svc.helper]}가 내갈 거예요. 편히 구경해요.`);
  if (!g || g.state !== 'wait') { if (g && g.state === 'eat') return toast('맛있게 드시는 중이에요.'); return toast(svc ? '빈 자리예요.' : '손님 식탁. 영업을 시작하면 손님이 앉아요.'); }
  if (!P.hands) return g.mood ? toast(`"${g.mood.line}"\n어울리는 요리를 골라 내어 보세요. (수첩에 요리마다 성격이 적혀 있어요)`, 'q', 5200) : toast(`「${RECIPES[g.order].name}」를 기다리고 있어요.`, g.order);
  if (g.mood) { if (!RECIPES[P.hands]) return no('완성한 요리를 내어 주세요.'); g.fit = dishTags(P.hands).includes(g.mood.tag); }
  else if (P.hands !== g.order) return no(`주문은 「${RECIPES[g.order].name}」예요.`);
  const served = P.hands;
  P.hands = null; reserve(g.order, -1);
  g.state = 'eat'; g.t = 4.5; g.tip = g.patience > g.maxP / 2; t.dish = served; g.served = served;
  svc.served++; G.stats.served++; Au.sfx('heart'); tire(2);
  if (RECIPES[served].custom) G.stats.custom = (G.stats.custom || 0) + 1;
  if (g.fit) { G.stats.fit = (G.stats.fit || 0) + 1; toast(`딱 맞는 한 그릇! (${TAG_NAME[g.mood.tag]}) — 값 1.5배 · 평판 +2`, 'heart', 3600); }
  gainRep((g.tip ? 2 : 1) + (g.gourmet && g.tip ? 5 : 0) + (g.fit ? 2 : 0)); checkChallenges();
  const lines = g.gourmet ? ['…훌륭하군요. 글로 남기겠습니다.'] : g.mood ? (g.fit ? [g.mood.ok] : MOOD_MISS) : g.npc ? NPC_GUEST_LINES[g.npc] : GUEST_LINES;
  floater(g.px + 8, g.py - 12, lines[Math.floor(Math.random() * lines.length)], 'bubble', g.fit ? 3.6 : 2.6);
  refreshHUD();
}
function endService() {
  const s = svc; svc = null; G.servedToday = true; G.time = 20 * 60;
  G.stats.best = Math.max(G.stats.best || 0, s.served);
  if (!s.missed && s.served >= 5) G.stats.perfect = (G.stats.perfect || 0) + 1;
  let garn = 0; // 빚이 한도를 넘으면 수익의 30%가 자동 상환
  if (G.bank.loan > loanLimit()) { garn = Math.min(G.bank.loan, Math.floor(s.earned * 0.3), G.coins); G.coins -= garn; G.bank.loan -= garn; }
  Au.setMood('night'); Au.sfx('done');
  runScene(async () => {
    await openPanel('오늘의 영업 끝', `<p class="center">돌아온 빈 그릇 <b>${s.served}</b>개<br>번 돈 <b>${s.earned}</b>닢<br>식당 ${'★'.repeat(rank())} · 평판 ${G.rep}${garn ? `<br><small>빚이 한도를 넘어 ${garn}닢이 마을금고로 들어갔어요.</small>` : ''}${s.missed ? `<br><small>기다리다 돌아간 손님 ${s.missed}명 — 괜찮아요, 내일 또 와요.</small>` : ''}</p>
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
  try { const cur = localStorage.getItem(SAVE); if (cur) localStorage.setItem(BACKUP, cur); } catch (e) { /* 백업 실패는 넘어가요 */ }
  G.day++; G.time = 8 * 60; G.taken = {}; G.servedToday = false; G.flags.credit = false; G.traveled = false; sunsetTold = false;
  // 밤사이 일어나는 일: 이자, 가공 완성, 농장 배달, 새 의뢰, 오늘의 일
  const B = G.bank, int = B.loan ? Math.ceil(B.loan * 0.03) : 0, gain = Math.min(20, Math.floor(B.dep * 0.01));
  B.loan += int; B.dep += gain;
  const cured = G.craft.filter(c => !c.ready).length; G.craft.forEach(c => { c.ready = true; });
  if (G.flags.contract) { addItem('cabbage', 2); addItem('chili', 1); addItem('egg', 2); }
  G.event = opened() && G.day >= 3 && Math.random() < 0.6 ? pickOne(Object.keys(EVENTS)) : null;
  G.fishLeft = G.event === 'catch' ? 10 : 5;
  const b = G.body, skipped = b.meals === 0;
  b.en = skipped ? 70 : 100; b.taste = clampB(b.taste + (skipped ? -8 : b.meals >= 2 ? 2 : 0)); b.meals = 0; b.shared = false; b.warned = false;
  ensureReqs();
  const news = [int ? `빚 이자 +${int}닢` : '', gain ? `예금 이자 +${gain}닢` : '', cured ? `건조대에 ${cured}가지가 다 말랐다` : '', G.flags.contract ? '농장 배달이 문 앞에 와 있다' : '', skipped ? '어제 끼니를 걸러 몸이 무겁다 (밥맛 -8)' : ''].filter(Boolean).join(' · ');
  P.x = 13; P.y = 2; P.px = P.x * T; P.py = P.y * T; P.dir = 'down';
  Au.setMood('day');
  await UI.narr(`${G.day}일째 아침.\n${G.event ? EVENTS[G.event].text : '텃밭과 숲, 바다가 밤사이 다시 차올랐다.'}`);
  if (news) toast(news, null, 6000);
  if (G.step === 'sleep1') { await UI.black(false); await story.scenes.morning2(); }
  else await UI.black(false);
  await homestayMorning();
}

/* ═════════ 2부: 별손님 홈스테이와 레시피 도감 ═════════ */
// 주인공은 식당과 마을을 꾸리는 나. 계절마다 다른 별에서 손님이 와서 머물고,
// 그 손님들이 맛볼수록 레시피 도감의 별이 올라요 (★ 실제 레시피 · ★★ 요령 · ★★★ 변주).
const LEGACY = 'morak-legacy';
function loadLegacy() {
  try {
    const l = JSON.parse(localStorage.getItem(LEGACY)) || {};
    const dex = l.dex || Object.fromEntries((l.book || []).map(id => [id, ['eunha']]));
    return { dex, runs: l.runs || 0, clues: l.clues || [] };
  } catch (e) { return { dex: {}, runs: 0, clues: [] }; }
}
function saveLegacy(l) { try { localStorage.setItem(LEGACY, JSON.stringify(l)); } catch (e) { /* 저장 공간이 없으면 건너뜀 */ } }
function dexLv(id) { return Math.min(3, ((G && G.dex && G.dex[id]) || []).length); }
const dexStars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function showVisitor(v) { CHARS.visitor = CHARS[v.id]; NPC_NAME.visitor = v.name; delete faceCache.visitor; }
const pp = (w, pair) => josa(w, pair).slice(w.length); // 조사만
const waitLine = name => `오늘은 「${name}」${pp(name, '이/가')} 궁금해요. 만들어서 가져와 줄래요? 같이 먹으면서 배우고 싶어요.`;
function pickLesson() {
  const v = visitorOf(G.stay.day, G.stay.year);
  const known = G.recipes.filter(r => REAL[r]);
  const fresh = known.filter(r => !(G.dex[r] || []).includes(v.id)); // 이 손님이 아직 맛보지 않은 것
  const pool = fresh.length ? fresh : known;
  const season = SEASON_DISHES[seasonOf(G.stay.day)];
  const inSeason = pool.filter(r => season.includes(r));
  G.stay.today = pickOne(inSeason.length ? inSeason : pool);
  G.stay.taught = false;
}
async function arrive(v) {
  showVisitor(v);
  G.met = G.met || [];
  if (G.met.includes(v.id)) { await UI.narr(`저녁 막차에서 낯익은 더듬이가 보였다.`); await UI.say('visitor', `또 왔어요! ${v.name}예요. 이번에도 가르쳐 줄 거죠?`); }
  else {
    G.met.push(v.id);
    await Cine.play(Cine.SCENES.arrive(v), ['저녁 별 막차가 들어왔다.', `${v.from}에서 온 손님이 내렸다.`]);
    for (const line of v.hello) await UI.say('visitor', line);
    if (v.clues && v.clues.arrive) { await UI.say('visitor', v.clues.arrive); await addClue(v.id + '_arrive'); }
  }
  G.world = G.world || {};
  const w = WORLD[v.world];
  if (w && !G.world[v.world]) {
    G.world[v.world] = true;
    await UI.say('visitor', w.tell);
    for (const d of w.dishes) await UI.say('visitor', `"${HINTS[d]}"`);
    await UI.narr(`이장님이 ${w.name}에서 온 재료를 만물상에 들여놓았다.\n${w.items.map(i => ITEMS[i].name).join(' · ')}`);
    toast(`${w.name} 요리의 단서를 얻었어요\n도감의 「?」에서 단서를 다시 볼 수 있어요. 재료는 이장님 만물상에서.`, 'page', 7000);
  }
}
async function startHomestay() {
  G.dex = G.dex || {};
  G.stay = { day: 1, len: YEAR_DAYS, year: 1, today: null, taught: false, bond: 0, walk: 0 };
  G.up.stay = 1;
  await UI.narr('그날 저녁, 막차에서 낯선 손님이 내렸다.');
  await arrive(visitorOf(1));
  await UI.say('ijang', `허허, 별에서 손님이 왔구나! …사람은 아니구먼. 그래도 배고픈 건 똑같겠지. ${G.name}, 식당 2층 빈방 내주거라. 누님도 그랬을 게다.`);
  await UI.say('ijang', '이 마을의 한 해는 마흔 날이야. 계절마다 다른 별에서 손님이 온단다. 열흘씩 데리고 살면서 밥 짓는 걸 가르쳐 줘라.');
  await UI.say('me', '좋아요. 매일 하나씩, 제대로 가르쳐 줄게요.');
  pickLesson();
  await UI.say('visitor', waitLine(RECIPES[G.stay.today].name));
  placeBuddy();
  toast('별손님이 이제 나를 따라다녀요.\n궁금해하는 요리를 만들어 주고, 같이 먹고, 같이 걸으면 정(♥)이 쌓여요. 손님을 누르면 말을 걸어요.', 'heart', 8000);
}
async function homestayMorning() {
  if (!G.stay && !G.flags.stayDone && opened()) return startHomestay();
  if (!G.stay) return;
  G.stay.day++; G.stay.walk = 0; G.stay.walkBond = 0; G.stay.ate = false; G.stay.talked = false;
  if (G.stay.day > G.stay.len) return yearEnd();
  const prev = visitorOf(G.stay.day - 1, G.stay.year), v = visitorOf(G.stay.day, G.stay.year);
  if (prev.id !== v.id) {
    await seeOff(prev);
    await UI.narr(`솥골에 ${seasonOf(G.stay.day)}이 왔다.`);
    G.stay.bond = 0;
    await arrive(v);
  } else showVisitor(v);
  pickLesson();
  await UI.say('visitor', waitLine(RECIPES[G.stay.today].name));
  placeBuddy();
}
/* ── 정(♥): 수업·같이 먹기·같이 걷기·매일 인사로 쌓이고, 한 칸마다 속 이야기가 열려요 ── */
const hearts = () => (G && G.stay ? Math.min(4, Math.floor((G.stay.bond || 0) / 25)) : 0);
async function addBond(n) {
  const st = G.stay; if (!st) return;
  const h0 = hearts(); st.bond = Math.min(100, (st.bond || 0) + n);
  const h1 = hearts();
  for (let h = h0 + 1; h <= h1; h++) await bondScene(h);
}
async function bondScene(h) {
  const v = visitorOf(G.stay.day, G.stay.year); showVisitor(v);
  Au.sfx('heart');
  await UI.narr(`${v.name}와 조금 더 가까워졌다. ${'♥'.repeat(h)}${'♡'.repeat(4 - h)}`);
  for (const line of (v.bonds || [])[h - 1] || []) {
    if (line.startsWith('나:')) await UI.say('me', line.slice(2)); else await UI.say('visitor', line);
  }
  if ((h === 2 || h === 4) && v.clues && v.clues['h' + h]) { await UI.say('visitor', v.clues['h' + h]); await addClue(v.id + '_h' + h); }
  const perk = ['', '', '이제 도마 앞에 서면 손질을 도와줘요.', '이제 채집할 때 하나씩 더 거들어 줘요.', '떠나는 날, 선물을 남기고 싶어 해요.'][h];
  if (perk) toast(`${v.name} ${'♥'.repeat(h)} — ${perk}`, 'heart', 5000);
  G.album[v.id] = Math.max(G.album[v.id] || 0, h);
}
async function seeOff(v) { // 손님을 배웅해요. 정이 가득하면 선물
  showVisitor(v);
  await UI.say('visitor', v.bye);
  if (hearts() >= 4 && v.gift) { await UI.narr(v.gift); toast(`앨범에 ${v.name}와의 열흘이 남았어요`, 'heart', 4000); }
  G.album[v.id] = Math.max(G.album[v.id] || 0, hearts());
}
async function talkVisitor() {
  const st = G.stay;
  if (!st) return;
  const v = visitorOf(st.day, st.year); showVisitor(v);
  if (!st.talked) { st.talked = true; await addBond(5); }
  const id = st.today, name = RECIPES[id].name;
  const dishes = Object.keys(G.inv).filter(i => RECIPES[i] && G.inv[i] > 0);
  const opts = [];
  if (!st.taught && inv(id) > 0) opts.push(['lesson', `「${name}」로 같이 먹으며 가르쳐 준다`]);
  if (!st.ate && dishes.some(d => d !== id || st.taught)) opts.push(['eat', '같이 밥 먹기']);
  opts.push(['talk', '이야기하기']);
  const pick = opts.length > 1 ? opts[await UI.choose(opts.map(o => o[1]))][0] : 'talk';
  if (pick === 'eat') return eatWithGuest(v, dishes.filter(d => d !== id || st.taught));
  if (pick === 'talk') {
    if (st.taught) return UI.say('visitor', pickOne(['오늘 배운 건 도감에 적어 뒀어요. 내일도 알려 줄 거죠?', ...v.idle]));
    if (Math.random() < 0.5) await UI.say('visitor', pickOne(v.idle));
    return UI.say('visitor', waitLine(name));
  }
  addItem(id, -1);
  const r = REAL[id], lv0 = dexLv(id);
  await UI.narr(`${v.name}와 마주 앉아 ${josa(name, '을/를')} 나눠 먹었다.`);
  await UI.say('visitor', v.ask(name, r));
  const list = G.dex[id] || (G.dex[id] = []);
  const fresh = !list.includes(v.id);
  if (fresh) list.push(v.id);
  const lv = dexLv(id);
  if (lv0 === 0) {
    await UI.narr(`재료(2인분)\n${r.ing.join(' · ')}`);
    for (let i = 0; i < r.steps.length; i++) await UI.narr(`${i + 1}. ${r.steps[i]}`);
  } else await UI.narr('지난번에 적어 둔 순서대로 만들어 보였다.');
  if (lv > lv0 && lv === 2) await UI.narr(`요령 하나 더.\n${DEX_MORE[id].tip}`);
  if (lv > lv0 && lv === 3) await UI.narr(`이렇게도 만들 수 있어.\n${DEX_MORE[id].vary}`);
  st.taught = true; st.ate = true;
  feed(id, true); gainRep(2);
  await UI.say('visitor', pickOne(v.react));
  Au.sfx('page');
  if (lv > lv0) toast(`레시피 도감 「${name}」 ${dexStars(lv)}\n${['', '실제 레시피가 열렸어요', '요령이 열렸어요 · 값 +10%', '변주가 열렸어요 · 값 +20%'][lv]}`, 'page', 5000);
  else toast(`「${name}」${pp(name, '은/는')} 이미 ${v.name}도 맛본 요리예요. 다른 손님에게 가르치면 별이 올라요.`, null, 4500);
  await addBond(fresh ? 15 : 8);
  checkChallenges();
}
async function eatWithGuest(v, dishes) {
  let id = dishes[0];
  if (dishes.length > 1) {
    id = await openPanel(`${v.name}와 무엇을 먹을까?`, `<div class="grid">${dishes.map(d => cell(d, G.inv[d], 'pick')).join('')}</div>`, (a, val, p) => { if (a === 'pick') p.close(val); });
    if (!id) return;
  }
  addItem(id, -1); G.stay.ate = true;
  feed(id, true);
  await UI.narr(`${v.name}와 마주 앉아 ${josa(RECIPES[id].name, '을/를')} 먹었다.`);
  await UI.say('visitor', pickOne(v.react));
  await addBond(10);
}
/* ── 별의 소문: 단서를 모아 미스터리를 풀어요 (이야기는 js/mystery.js · 각 화 파일) ── */
function allClues() { // [{id, text, where}] 손님 단서(화 순서대로) + 마을 단서
  const out = [];
  for (const v of VISITORS) {
    const c = v.clues || {};
    if (c.arrive) out.push({ id: v.id + '_arrive', text: `${v.name}가 들은 소문: ${c.arrive}`, where: `${v.name}를 맞이하기` });
    if (c.h2) out.push({ id: v.id + '_h2', text: `${v.name}의 이야기: ${c.h2}`, where: `${v.name}와 ♥2` });
    if (c.h4) out.push({ id: v.id + '_h4', text: `${v.name}의 이야기: ${c.h4}`, where: `${v.name}와 ♥4` });
  }
  for (const c of VILLAGE_CLUES) out.push({ id: c.id, text: c.text, where: `${c.where} (단서 ${c.need}개 이후)` });
  return out;
}
async function addClue(id) {
  G.clues = G.clues || [];
  if (G.clues.includes(id)) return;
  const c = allClues().find(x => x.id === id); if (!c) return;
  G.clues.push(id); Au.sfx('page');
  toast(`새 단서 (${G.clues.length}/${allClues().length})\n${c.text}`, 'q', 6000);
  const ch = CHAPTERS.find(x => x.at === G.clues.length);
  if (ch) await playChapter(ch);
}
const castLine = l => typeof l === 'string' && l.startsWith('나:') ? { who: G.name, text: l.slice(2) } : l && l.who === '나' ? { ...l, who: G.name } : l;
function playChapter(ch) { // 별의 소문 한 장을 모션그래픽으로
  return Cine.play(Cine.SCENES[ch.scene](), [{ title: `별의 소문 — ${ch.title}` }, ...ch.lines.map(castLine)]);
}
async function playFinale() { // 시즌 1 마지막 화
  for (const s of FINALE.shots) await Cine.play(Cine.SCENES[s.scene](), s.lines.map(castLine));
  G.flags.finale1 = true;
}
function villageClue(th) { // 마을 단서: 조건이 되면 살펴보는 장면을 돌려줘요
  if (!G || !G.stay && !(G.clues || []).length) return null;
  const on = th.type === 'bus' ? 'bus' : th.type === 'look' && th.id === 'photo' ? 'photo' : th.type === 'book' ? 'book' : null;
  const c = on && VILLAGE_CLUES.find(x => x.on === on && (G.clues || []).length >= x.need && !G.clues.includes(x.id));
  return c ? async () => { await Cine.play(Cine.SCENES.clue(c), c.scene.split('\n')); await addClue(c.id); } : null;
}
function openClues() {
  const list = allClues(), got = G.clues || [];
  const nextCh = CHAPTERS.find(c => c.at > got.length);
  const html = `<p>우주에 떠도는 소문 <b>「지구의 솥골, 김이 오르는 집」</b><br>모은 단서 <b>${got.length}</b>/${list.length}${nextCh ? ` · ${nextCh.at}개를 모으면 「${nextCh.title}」` : ' · 지금까지의 이야기를 모두 풀었어요'}</p>` +
    `<div class="sec">풀어 낸 이야기</div>` + (CHAPTERS.filter(c => got.length >= c.at).map((c, i) => `<div class="rcp"><h4>${c.title} <button class="btn" data-a="ch" data-v="${i}">▶ 다시 보기</button></h4><div class="memo">${c.lines.map(l => l.replace(/^나:/, `${esc(G.name)}: `)).join('<br>')}</div></div>`).join('') || '<div class="rcp torn">단서 5개를 모으면 첫 이야기가 풀려요</div>') +
    `<div class="sec">단서</div>` + list.map(c => got.includes(c.id) ? `<div class="rcp"><div class="how">${esc(c.text)}</div></div>` : `<div class="rcp torn">? — ${esc(c.where)}</div>`).join('');
  const fin = G.flags.finale1 ? `<div class="rcp"><h4>${FINALE.title} <button class="btn" data-a="fin">▶ 다시 보기</button></h4><div class="memo">첫 손님의 이름이 명부에 적혔어요. 시즌 2를 기다려 주세요.</div></div>` : '';
  return openPanel('별의 소문', html.replace('<div class="sec">단서</div>', fin + '<div class="sec">단서</div>'), (a, v, p) => {
    if (a === 'ch') { p.close(); runScene(() => playChapter(CHAPTERS[+v])); }
    if (a === 'fin') { p.close(); runScene(playFinale); }
  });
}

/* ── 따라다니는 별손님 ── */
const bud = { x: 0, y: 0, px: 0, py: 0, dir: 'down', walkT: 0, idle: true, trail: [] };
function placeBuddy() {
  if (!G || !G.stay) return;
  const [dx, dy] = DIRS[P.dir];
  const cand = [[P.x - dx, P.y - dy], [P.x + 1, P.y], [P.x - 1, P.y], [P.x, P.y + 1], [P.x, P.y - 1]].find(([x, y]) => passable(x, y)) || [P.x, P.y];
  bud.x = cand[0]; bud.y = cand[1]; bud.px = bud.x * T; bud.py = bud.y * T; bud.trail = []; bud.dir = P.dir;
}
function noteStep(fx, fy) { // 주인공이 지나간 칸을 기억해, 손님이 두 칸 뒤를 따라와요
  if (!G || !G.stay) return;
  bud.trail.push([fx, fy]); if (bud.trail.length > 6) bud.trail.shift();
  const st = G.stay; st.walk = (st.walk || 0) + 1;
  if (st.walk % 25 === 0 && (st.walkBond || 0) < 8) {
    st.walkBond = (st.walkBond || 0) + 2;
    const up = Math.floor(Math.min(100, st.bond + 2) / 25) > hearts(); // 하트가 오를 때만 장면을 띄우고, 아니면 조용히 쌓여요
    if (up && !busy) { P.path = null; runScene(() => addBond(2)); } else if (!up) st.bond = Math.min(100, st.bond + 2);
  }
}
function updateBuddy(dt) {
  if (!G.stay) return;
  if (Math.abs(bud.x - P.x) + Math.abs(bud.y - P.y) > 8) placeBuddy();
  const near = Math.abs(bud.x - P.x) + Math.abs(bud.y - P.y) <= 1;
  if (!near && bud.trail.length) {
    const tx = bud.trail[0][0] * T, ty = bud.trail[0][1] * T, dx = tx - bud.px, dy = ty - bud.py, d = Math.hypot(dx, dy), sp = 80 * dt;
    if (d > sp) { bud.px += dx / d * sp; bud.py += dy / d * sp; bud.walkT += dt; bud.idle = false; bud.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
    else { bud.px = tx; bud.py = ty; [bud.x, bud.y] = bud.trail.shift(); }
  } else {
    bud.idle = true;
    if (near) { if (bud.trail.length && Math.abs(bud.trail[0][0] - P.x) + Math.abs(bud.trail[0][1] - P.y) <= 1) bud.trail = []; bud.dir = P.x > bud.x ? 'right' : P.x < bud.x ? 'left' : P.y > bud.y ? 'down' : 'up'; }
  }
}
const atBuddy = (x, y) => G && G.stay && ((bud.x === x && (bud.y === y || bud.y === y + 1)));
async function yearEnd() {
  const st = G.stay, last = visitorOf(st.len, st.year);
  await UI.narr('이 마을의 한 해가 다 갔다.');
  await seeOff(last);
  if (!G.flags.finale1 && (G.clues || []).length >= CHAPTERS[CHAPTERS.length - 1].at) await playFinale();
  const found = DEX_ORDER.filter(id => dexLv(id)).length, stars = DEX_ORDER.reduce((t, id) => t + dexLv(id), 0);
  await UI.narr(`${st.year > 1 ? `${st.year}번째 ` : ''}한 해 동안 네 별손님이 다녀갔다.\n레시피 도감 ${found}/${DEX_ORDER.length} · 별 ${stars}/${DEX_ORDER.length * 3}`);
  const c = await UI.choose(['한 해 더 (별손님들이 다시 와요)', '여기서 계속 지낸다 (손님맞이는 쉬어요)', '새로 시작한다 (도감은 이어져요)']);
  if (c === 0) {
    st.year++; st.day = 1; st.bond = 0;
    await UI.narr('다시 봄이 왔다.');
    await arrive(visitorOf(1, st.year));
    pickLesson(); placeBuddy();
    await UI.say('visitor', waitLine(RECIPES[st.today].name));
    return;
  }
  const l = loadLegacy();
  for (const id in G.dex) l.dex[id] = [...new Set([...(l.dex[id] || []), ...G.dex[id]])];
  l.clues = [...new Set([...(l.clues || []), ...(G.clues || [])])];
  l.runs = (l.runs || 0) + 1; saveLegacy(l);
  G.stay = null; G.up.stay = 0; G.flags.stayDone = true;
  if (c === 2) {
    await UI.narr(`레시피 도감을 챙겼다.\n새로운 이야기가 시작된다.`);
    try { localStorage.removeItem(SAVE); localStorage.removeItem(BACKUP); } catch (e) { /* 무시 */ }
    mode = 'title'; location.reload();
  }
}
function discoverable() { // 별손님이 알려 준 나라의 요리 중 아직 못 찾은 것
  return Object.keys(G.world || {}).filter(w => G.world[w]).flatMap(w => WORLD[w].dishes).filter(r => !G.recipes.includes(r));
}
function albumHTML() {
  const met = VISITORS.filter(v => (G.met || []).includes(v.id));
  if (!met.length) return '';
  return `<div class="sec">별손님 앨범</div><div class="grid">${met.map(v => { const h = G.album[v.id] || 0, here = G.stay && visitorOf(G.stay.day, G.stay.year).id === v.id;
    return `<div class="cell"><img src="${CHARS[v.id].down[0].toDataURL()}" style="image-rendering:pixelated;width:2.4rem"><br>${v.name}${here ? ' (지금 함께)' : ''}<br><span style="color:var(--accent)">${'♥'.repeat(here ? hearts() : h)}${'♡'.repeat(4 - (here ? hearts() : h))}</span></div>`; }).join('')}</div>`;
}
const dexFound = id => G.recipes.includes(id) || dexLv(id) > 0;
function openDex() {
  const found = () => DEX_ORDER.filter(dexFound).length, stars = () => DEX_ORDER.reduce((t, id) => t + dexLv(id), 0);
  const cellOf = (id, open) => {
    const lv = dexLv(id);
    if (dexFound(id)) return `<button class="cell" data-a="see" data-v="${id}"><img class="ic" src="${iconURL(id)}"><br>${RECIPES[id].name}<br><span style="color:var(--accent)">${dexStars(lv)}</span></button>`;
    if (open && HINTS[id]) return `<button class="cell" data-a="hint" data-v="${id}" style="opacity:.8"><span style="font-size:1.7rem;line-height:2.2rem">?</span><br>단서 보기<br>☆☆☆</button>`;
    return `<div class="cell" style="opacity:.45"><span style="font-size:1.7rem;line-height:2.2rem">?</span><br>???<br>☆☆☆</div>`;
  };
  const grid = () => `<p>찾은 요리 <b>${found()}</b>/${DEX_ORDER.length} · 별 <b>${stars()}</b>/${DEX_ORDER.length * 3}<br>
    <small>요리는 직접 찾아내요. 별손님이 들려준 단서대로 부엌에서 재료를 조합하면 「새 요리 발견!」. 찾은 요리를 서로 다른 별손님에게 가르칠수록 별이 올라요 (★ 실제 레시피 · ★★ 요령 · ★★★ 변주, 별마다 값 +10%).</small></p>` +
    (G.stay || (G.clues || []).length ? `<p class="center"><button class="btn main" data-a="clues">별의 소문 — 단서 ${(G.clues || []).length}/${allClues().length}</button></p>` : '') + albumHTML() + DEX_GROUPS.map(([title, ids, w]) => {
      const open = !w || (G.world && G.world[w]);
      if (w && !open && !ids.some(dexFound)) return `<div class="sec">${title} — 아직 이 나라를 들른 별손님이 없어요</div>`;
      return `<div class="sec">${title}${w ? ` · ${VISITORS.find(v => v.id === WORLD[w].visitor).name}가 들려준 나라` : ''}</div><div class="grid">${ids.map(id => cellOf(id, open)).join('')}</div>`;
    }).join('');
  const hint = id => `<p><button class="btn" data-a="back">◀ 도감으로</button></p>
    <div class="rcp"><h4><span style="font-size:1.4rem">?</span> 아직 찾지 못한 ${WORLD[RECIPES[id].world].name} 요리</h4>
    <div class="how">${VISITORS.find(v => v.id === WORLD[RECIPES[id].world].visitor).name}의 단서: "${HINTS[id]}"</div>
    <div class="memo">재료는 만물상에서 살 수 있어요. 맞는 조합을 조리 도구에 넣으면 찾아내요.</div></div>`;
  const detail = id => {
    const r = REAL[id], lv = dexLv(id), who = ((G.dex || {})[id] || []).map(vid => (VISITORS.find(v => v.id === vid) || {}).name).filter(Boolean), gr = RECIPES[id];
    return `<p><button class="btn" data-a="back">◀ 도감으로</button></p>
      <div class="rcp"><h4><img class="ic" src="${iconURL(id)}">${gr.name}<span class="can" style="color:var(--accent)">${dexStars(lv)}</span></h4>
      <div class="how">${COOKER_NAME[gr.cooker]}에 ▸ ${gr.ing.map(i => itemName(i)).join(' + ')}</div>
      <div class="memo">${who.length ? `맛본 별손님: ${who.join(', ')}` : '아직 맛본 별손님이 없어요'} · 지금 값 ${priceOf(id)}닢</div></div>
      <div class="sec">★ 실제 레시피 (2인분)</div>${lv >= 1 ? `<div class="rcp"><div class="how">재료: ${r.ing.join(', ')}</div><div class="memo">${r.steps.map((t, i) => `${i + 1}. ${t}`).join('<br>')}</div></div>` : `<div class="rcp torn">별손님 한 명에게 가르쳐 주면 열려요</div>`}
      <div class="sec">★★ 요령</div>${lv >= 2 ? `<div class="rcp"><div class="how">${DEX_MORE[id].tip}</div></div>` : `<div class="rcp torn">다른 별손님 한 명이 더 맛보면 열려요</div>`}
      <div class="sec">★★★ 변주</div>${lv >= 3 ? `<div class="rcp"><div class="how">${DEX_MORE[id].vary}</div></div>` : `<div class="rcp torn">세 번째 별손님이 맛보면 열려요</div>`}
      <p><small>일반적인 가정식 기준이에요. 집집마다 간과 순서는 조금씩 달라요.</small></p>`;
  };
  return openPanel('레시피 도감', grid(), (a, v, p) => {
    if (a === 'see') p.set(detail(v));
    if (a === 'hint') p.set(hint(v));
    if (a === 'clues') { p.close(); openClues(); }
    if (a === 'back') p.set(grid());
  });
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
  if (!th && !svc && atBuddy(tx, ty)) { tapMark = { x: bud.x * T + 8, y: bud.y * T + 8, t: 0.4 }; return runScene(talkVisitor); }
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
/* ── 버튼 하나하나가 하는 일 (키보드와 게임 패드가 같이 써요) ── */
function moveChoice(d) {
  if (!dlg || !dlg.choice) return false;
  const n = dlg.options.length; dlg.sel = (dlg.sel + d + n) % n;
  [...$('#choices').children].forEach((b, i) => b.classList.toggle('sel', i === dlg.sel));
  Au.sfx('blip'); return true;
}
function movePanelFocus(d) {
  if (!panelClose) return false;
  const els = [...document.querySelectorAll('#panel-body button:not([disabled]), #panel-body a, #panel-body input, #panel-x')].filter(el => el.offsetParent);
  if (!els.length) return true;
  let i = els.indexOf(document.activeElement);
  i = i < 0 ? (d > 0 ? 0 : els.length - 1) : (i + d + els.length) % els.length;
  els[i].focus(); els[i].scrollIntoView({ block: 'nearest' }); Au.sfx('blip'); return true;
}
function navDir(dir) { // 방향 버튼을 '누른 순간' (걷기는 keyDir가 따로 봐요)
  const d = dir === 'up' || dir === 'left' ? -1 : 1;
  if (moveChoice(d)) return true;
  if (movePanelFocus(d)) return true;
  return false;
}
function actionA() {
  if (Cine.isOpen()) return Cine.tap();
  Au.unlock();
  if (mode === 'title') { const c = $('#btn-continue'); (c.classList.contains('hide') ? $('#btn-new') : c).click(); return; }
  if (panelClose) { const el = document.activeElement; if (el && $('#panel').contains(el) && el.tagName !== 'INPUT') el.click(); else movePanelFocus(1); return; }
  if (letterClose) return letterClose();
  if (dlg && dlg.choice) return dlg.pick(dlg.sel);
  if (dlg) return advanceDialog();
  if (mode !== 'play' || busy) return;
  if (P.fish) return reel();
  if (P.moving || P.act) return;
  const [dx, dy] = DIRS[P.dir];
  let th = actAt(P.x + dx, P.y + dy);
  if (!th && svc) { const g = svc.cust.find(c => c.x === P.x + dx && c.y === P.y + dy); if (g) th = g.table; }
  if (th) return interact(th);
  if (G.stay && !svc && Math.abs(bud.x - P.x) + Math.abs(bud.y - P.y) <= 1) runScene(talkVisitor);
}
function actionB() { // 닫기·물러나기
  if (panelClose) return panelClose();
  if (letterClose) return letterClose();
  if (dlg && dlg.choice) return dlg.pick(dlg.options.length - 1);
  if (dlg) return advanceDialog();
}
function menuKey(name) {
  if (mode !== 'play' || busy || dlg) return;
  Au.sfx('blip');
  ({ bag: openBag, book: openBook, ledger: openLedger, set: openSettings, dex: openDex })[name]();
}
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (e.target.tagName === 'INPUT') { if (k === 'enter' && mode === 'title') actionA(); return; }
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (e.repeat) return;
  keys[k] = true; Au.unlock();
  const arrows = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };
  if (arrows[k] && navDir(arrows[k])) return;
  if (k === ' ' || k === 'enter' || k === 'e') return actionA();
  if (k === 'escape' || k === 'backspace') return actionB();
  if (dlg && dlg.choice && /^[1-9]$/.test(k) && +k <= dlg.options.length) return dlg.pick(+k - 1);
  if (k === 'i') menuKey('bag'); if (k === 'r') menuKey('book'); if (k === 'g' && Object.keys(G ? G.dex || {} : {}).length) menuKey('dex');
});

/* ── 게임 패드 (블루투스·USB 조이스틱, 휴대 게임기 버튼) ── */
// 표준 배치: 0 A(아래) 1 B(오른쪽) 2 X(왼쪽) 3 Y(위) 8 SELECT 9 START 12~15 십자 버튼, 왼쪽 스틱
const pad = { dir: null, prev: [], prevDir: null, seen: false };
function pollPad() {
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(g => g && g.connected);
  if (!gp) { pad.dir = null; return; }
  if (!pad.seen) { pad.seen = true; toast('게임 패드 연결됨\nA 살펴보기 · B 닫기 · X 가방 · Y 수첩 · START 장부 · SELECT 설정', null, 6000); }
  const on = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  pad.dir = on(12) || ay < -0.5 ? 'up' : on(13) || ay > 0.5 ? 'down' : on(14) || ax < -0.5 ? 'left' : on(15) || ax > 0.5 ? 'right' : null;
  if (pad.dir && pad.dir !== pad.prevDir) navDir(pad.dir);
  pad.prevDir = pad.dir;
  const edge = i => on(i) && !pad.prev[i];
  if (edge(0)) actionA();
  if (edge(1)) actionB();
  if (edge(2)) menuKey('bag');
  if (edge(3)) menuKey('book');
  if (edge(9)) menuKey('ledger');
  if (edge(8)) menuKey('set');
  pad.prev = gp.buttons.map(b => b.pressed);
}
addEventListener('gamepadconnected', () => { pad.seen = false; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function keyDir() {
  if (pad.dir && !panelClose && !(dlg && dlg.choice)) return pad.dir;
  if (keys.arrowup || keys.w) return 'up'; if (keys.arrowdown || keys.s) return 'down';
  if (keys.arrowleft || keys.a) return 'left'; if (keys.arrowright || keys.d) return 'right';
  return null;
}

/* ═════════ 갱신 ═════════ */
function stepTo(nx, ny) {
  if (!passable(nx, ny)) return false;
  if (svc && svc.cust.some(c => (c.state === 'wait' || c.state === 'eat') && c.x === nx && c.y === ny)) return false;
  P.fx = P.x; P.fy = P.y; noteStep(P.x, P.y); P.x = nx; P.y = ny; P.moving = true; P.mt = 0;
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
    else if (f.state === 'bite' && f.t > (wearing('hat_cap') ? 2.2 : 1.2)) { P.fish = null; toast('놓쳤다… 다시 던져 봐요.'); }
    return;
  }
  let budget = dt * (map.name === 'shop' ? 6.2 : 5.6) * (G.trait === 'quick' ? 1.18 : 1) * (G.body.en < 25 ? 0.8 : 1);
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
  pollPad();
  updateDialog(dt); updateParticles(dt);
  if (tapMark) { tapMark.t -= dt; if (tapMark.t <= 0) tapMark = null; }
  if (mode === 'title') { const m = MAPS.village; camX = clamp(28 * T - VW / 2 + Math.sin(tAnim * 0.15) * 60, 0, m.w * T - VW); camY = clamp(15 * T - VH / 2 + Math.cos(tAnim * 0.11) * 30, 0, m.h * T - VH); }
  if (mode !== 'play') return;
  G.stats.playSec = (G.stats.playSec || 0) + dt;
  // 모락모락: 식당 굴뚝 연기
  if (map.name === 'village' && Math.random() < dt * (G.recipes.length ? 5 : 0)) particles.push({ x: 31 * T + 2 + Math.random() * 4, y: 10 * T + 4, vx: 3, vy: -7 - Math.random() * 4, life: 2.2, max: 2.2 });
  if (!busy) {
    if (map.name === 'village' && G.time < 17.5 * 60) {
      G.time += dt * 1.6;
      if (G.time >= 17 * 60 && !sunsetTold && !G.servedToday && G.recipes.length) { sunsetTold = true; toast('해가 기울어요. 슬슬 저녁 장사를 준비해 볼까요?'); }
    }
    updatePlayer(dt);
    if (map.name === 'village') updateWalkers(dt);
    if (map.name === 'shop') updateCookers(dt);
    updateBuddy(dt);
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
  const pad = map.name === 'shop' ? 46 : 0; // 가게 안에서는 위쪽 조리대가 HUD에 가리지 않게
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
    if (svc && svc.auto && map.name === 'shop') list.push({ k: svc.helperG.py + T + 0.3, g: svc.helperG });
    if (map.name === 'village') for (const w of walkers) list.push({ k: w.py + T + 0.3, g: w });
    if (G.stay) list.push({ k: bud.py + T + 0.35, g: { ...bud, spr: CHARS.visitor } });
  }
  list.sort((a, b) => a.k - b.k);

  for (const d of list) {
    if (d.pl) { drawChar(CHARS.player, P.dir, P.moving, P.walkT, Math.round(P.px), Math.round(P.py)); continue; }
    if (d.g) { const g = d.g, sit = g.state === 'wait' || g.state === 'eat'; drawChar(g.spr, g.dir, !sit && !g.idle, g.walkT, Math.round(g.px), Math.round(g.py), sit); continue; }
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
        if (!visible(th)) continue;
        const mx = th.x * T + th.w * 8;
        if (th.type === 'counter' && th.item) drawIcon(th.item, mx - 6, T - 4);
        if (th.type === 'cooker') {
          if (th.result) { const b = Math.round(Math.sin(tAnim * 5) * 1.5); bubbleBox(mx - 9, -6 + b, 18, 17); drawIcon(th.result, mx - 6, -4 + b); }
          else if (th.cook !== null) bar(mx - 6, T - 2, 12, th.cook, '#e8884a');
          else th.contents.forEach((it, i) => drawIcon(it, mx - th.contents.length * 5 + i * 10 - 1, 2));
          if (th.result === null && th.cook !== null) drawIcon(th.making, mx - 6, -6);
        }
      }
      if (svc) for (const g of svc.cust) if (g.state === 'wait') {
        const bx = Math.round(g.px) - 1, by = Math.round(g.py) - 30;
        bubbleBox(bx, by, 18, 17); drawIcon(g.mood ? 'q' : g.order, bx + 3, by + 2);
        if (g.gourmet) drawIcon('coin', bx + 12, by - 7);
        const pr = g.patience / g.maxP;
        bar(bx + 3, by + 14, 12, pr, pr > 0.5 ? '#5fa644' : pr > 0.22 ? '#f2a03c' : '#c4553f');
      } else if (g.state === 'eat') drawIcon('heart', g.px + 2, g.py - 22 + Math.sin(tAnim * 6));
    }
    if (G.stay && !G.stay.taught) drawIcon(inv(G.stay.today) > 0 ? 'bang' : 'q', Math.round(bud.px) + 2, Math.round(bud.py) - 22 + Math.round(Math.sin(tAnim * 5) * 2));
    const q = QUEST_NPC[G.step];
    if (q && map.name === 'village' && !(G.step === 'gather' && G.flags.gift)) {
      const n = map.things.find(t => t.type === 'npc' && t.id === q);
      if (n) drawIcon('bang', n.x * T + 2, n.y * T - 22 + Math.round(Math.sin(tAnim * 5) * 2));
    }
    if (map.name === 'village' && opened()) {
      if (G.reqs.some(r => !r.done && inv(r.item) >= r.n)) drawIcon('bang', 26 * T + 2, 19 * T - 26 + Math.round(Math.sin(tAnim * 5) * 2));
      if (G.craft.some(c => c.ready)) drawIcon('bang', 32 * T + 2, 15 * T - 24 + Math.round(Math.sin(tAnim * 5) * 2));
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

  // 시간에 따른 빛 (타이틀은 현실 시각을 따라요)
  if (mode === 'title') {
    const h = new Date().getHours();
    const tint = h >= 20 || h < 5 ? 'rgba(28,36,92,.42)' : h >= 17 ? 'rgba(255,130,60,.18)' : h < 7 ? 'rgba(150,140,220,.18)' : null;
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, VW, VH); }
  }
  if (G && mode === 'play' && map.name === 'village') {
    const t = G.time / 60;
    if (G.event === 'rain') {
      ctx.fillStyle = 'rgba(70,90,120,.2)'; ctx.fillRect(0, 0, VW, VH); ctx.fillStyle = 'rgba(220,235,255,.55)';
      for (let i = 0; i < 70; i++) { const x = (i * 53 + tAnim * 60) % (VW + 20) - 10, y = (i * 97 + tAnim * 260) % (VH + 10) - 5; ctx.fillRect(Math.round(x), Math.round(y), 1, 4); }
    }
    if (t >= 19) { ctx.fillStyle = 'rgba(28,36,92,.38)'; ctx.fillRect(0, 0, VW, VH); }
    else if (t > 15.5) { ctx.fillStyle = `rgba(255,140,60,${Math.min(0.2, (t - 15.5) * 0.1)})`; ctx.fillRect(0, 0, VW, VH); }
  }
}

/* ═════════ 시작 ═════════ */
function startGame(state, isNew) {
  G = fillDefaults(state);
  for (const k of Object.keys(RECIPES)) if (RECIPES[k].custom) delete RECIPES[k];
  G.custom.forEach(registerCustom);
  ensureReqs();
  applyLook(); walkers.length = 0;
  if (G.stay) showVisitor(visitorOf(G.stay.day, G.stay.year));
  mode = 'play'; svc = null;
  map = MAPS[G.map] || MAPS.village;
  P.x = G.x; P.y = G.y; P.px = P.x * T; P.py = P.y * T; P.dir = 'down'; P.hands = null; P.moving = false; P.path = null;
  if (!passable(P.x, P.y)) { if (map.name === 'shop') { P.x = 7; P.y = 9; } else { P.x = 28; P.y = 16; } P.px = P.x * T; P.py = P.y * T; }
  snapCam(); placeBuddy();
  $('#title').classList.add('hide'); $('#hud').classList.remove('hide');
  Au.unlock(); Au.setMood(G.time >= 19 * 60 ? 'night' : 'day');
  refreshHUD();
  if (isNew) { try { localStorage.removeItem(BACKUP); } catch (e) { /* 무시 */ } G.seenAt = Date.now(); G.lastDate = todayKey(); G.realDays = 1; }
  if (isNew || G.step === 'intro') runScene(story.scenes.intro);
  else if (!G.trait && G.recipes.length && G.step !== 'first_cook' && G.step !== 'gather') runScene(pickTrait);
  else { welcomeBack(); if (!busy) toast(greeting(), 'heart', 4200); }
}
function boot() {
  resize();
  SPR = buildSprites();
  for (const k in LOOKS) CHARS[k] = makeChar(LOOKS[k]);
  for (const v of VISITORS) { CHARS[v.id] = makeAlien(v.alien); NPC_NAME[v.id] = v.name; }
  CHARS.visitor = CHARS.eunha; NPC_NAME.visitor = '은하';
  GUEST_LOOKS.forEach((l, i) => { CHARS['guest' + i] = makeChar(l); });
  MAPS.village = buildVillage(); MAPS.shop = buildShop();
  map = MAPS.village;
  $('#name').value = randomName();
  $('#btn-reroll').addEventListener('click', e => { e.preventDefault(); let n; do { n = randomName(); } while (n === $('#name').value); $('#name').value = n; Au.sfx('blip'); });
  const legacy = loadLegacy();
  const sv = load();
  if (sv) $('#btn-continue').classList.remove('hide');
  $('#btn-continue').addEventListener('click', () => startGame(load(), false));
  $('#btn-new').addEventListener('click', () => {
    const b = $('#btn-new');
    if (load() && !b.dataset.armed) {
      b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 저장을 지우고 새로 시작';
      setTimeout(() => { delete b.dataset.armed; b.textContent = '새로 시작'; }, 4000);
      return;
    }
    const name = ($('#name').value || '').trim().slice(0, 6) || '하루';
    const st = newState(name); st.dex = JSON.parse(JSON.stringify(loadLegacy().dex)); st.clues = loadLegacy().clues.slice(); startGame(st, true);
  });
  if ('serviceWorker' in navigator && !window.__TOSS__) navigator.serviceWorker.register('sw.js').catch(() => {});
  addEventListener('visibilitychange', () => { if (document.hidden) save(); else welcomeBack(); });
  $('#greet').textContent = greeting() + (Object.keys(legacy.dex).length ? `\n레시피 도감 ${Object.keys(legacy.dex).length}가지를 이어 받아요 · 별손님들과 ${legacy.runs}번의 한 해를 보냈어요` : '');
  addEventListener('pagehide', save);
  let last = 0;
  const loop = ts => { const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; update(dt); render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__morak = { get G() { return G; }, P, MAPS, get map() { return map; }, get svc() { return svc; }, get busy() { return busy; }, tapWorld, bfs, passable, addItem, story, save, interact, walkers, welcomeBack, bud, openClues, allClues: () => allClues(), playFinale: () => runScene(playFinale), talkBuddy: () => runScene(talkVisitor), get hearts() { return hearts(); }, toScreen: (tx, ty) => [(tx * T + 8 - camX) * SCALE, (ty * T + 8 - camY) * SCALE] };
}
boot();
