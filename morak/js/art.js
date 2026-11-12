// 모락모락 — 모든 그림은 코드로 찍어 내는 픽셀 아트예요. (이미지 파일 없음)
export const T = 16;

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const G = c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; };
const R = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function ell(g, c, cx, cy, rx, ry) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.5) * (ry + 0.5)))));
    g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

const INK = '#4a3328';
function outline(c, col = INK) {
  const g = G(c), w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h), a = d.data;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
  const pts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) pts.push(x, y);
  }
  g.fillStyle = col;
  for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i], pts[i + 1], 1, 1);
  return c;
}

export function flip(c) {
  const o = mk(c.width, c.height), g = G(o);
  g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return o;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
}

/* ───────────── 땅 타일 ───────────── */
const PAL = {
  grass: '#9bd070', grassD: '#7fba5a', grassL: '#b6e388',
  path: '#e6cd9c', pathD: '#d3b683',
  sand: '#f4e6b6', sandD: '#e4d096', sandW: '#d9c48c',
  water: '#62bcd8', waterD: '#4fa9c9', waterL: '#a6e1ee',
  soil: '#a06f4b', soilD: '#86583a',
  plank: '#c99562', plankD: '#a5754a',
  floor: '#dcab72', floorD: '#c6945c',
  wall: '#f6e8c9', wallD: '#e6d3ab', trim: '#a8794f',
  dark: '#3b2a25',
};

const tileCache = {};
export function groundTile(kind, v = 0, frame = 0) {
  const key = kind + v + '_' + frame;
  if (tileCache[key]) return tileCache[key];
  const c = mk(T, T), g = G(c), r = rng(kind.charCodeAt(0) * 97 + v * 31 + 7);
  const ri = n => Math.floor(r() * n);
  if (kind === 'g') {
    R(g, PAL.grass, 0, 0, T, T);
    for (let i = 0; i < 4; i++) { const x = ri(14), y = 1 + ri(13); R(g, PAL.grassD, x, y); R(g, PAL.grassD, x + 1, y - 1); R(g, PAL.grassD, x + 2, y); }
    for (let i = 0; i < 2; i++) R(g, PAL.grassL, ri(15), ri(15), 2, 1);
  } else if (kind === 'p') {
    R(g, PAL.path, 0, 0, T, T);
    for (let i = 0; i < 5; i++) R(g, PAL.pathD, ri(15), ri(16), 1 + ri(2), 1);
    R(g, '#f2dfb6', ri(14), ri(15), 2, 1);
  } else if (kind === 's') {
    R(g, PAL.sand, 0, 0, T, T);
    for (let i = 0; i < 6; i++) R(g, PAL.sandD, ri(16), ri(16));
    R(g, '#fff6d6', ri(14), ri(15), 2, 1);
  } else if (kind === 'w') {
    R(g, PAL.water, 0, 0, T, T);
    for (let i = 0; i < 2; i++) { const x = ri(10), y = 2 + ri(12); R(g, PAL.waterD, x, y, 5, 1); }
    const sx = (ri(9) + frame * 3) % 11, sy = 2 + ri(12);
    R(g, PAL.waterL, sx, sy, 4, 1); R(g, PAL.waterL, sx + 1, sy + 1, 2, 1);
  } else if (kind === 'd') {
    R(g, PAL.soil, 0, 0, T, T);
    for (let y = 3; y < T; y += 5) R(g, PAL.soilD, 0, y, T, 2);
    for (let i = 0; i < 3; i++) R(g, '#b88660', ri(15), ri(16));
  } else if (kind === 'k') {
    R(g, PAL.plank, 0, 0, T, T);
    for (let y = 3; y < T; y += 4) R(g, PAL.plankD, 0, y, T, 1);
    R(g, PAL.plankD, 5 + v * 3, 0, 1, 3); R(g, PAL.plankD, 11 - v * 2, 8, 1, 3);
  } else if (kind === 'f') {
    R(g, PAL.floor, 0, 0, T, T);
    R(g, PAL.floorD, 0, 7, T, 1); R(g, PAL.floorD, 0, 15, T, 1);
    R(g, PAL.floorD, (v * 5 + 3) % 16, 0, 1, 7); R(g, PAL.floorD, (v * 7 + 10) % 16, 8, 1, 7);
  } else if (kind === 'W') {
    R(g, PAL.wall, 0, 0, T, T);
    R(g, PAL.wallD, 0, 0, T, 2);
    R(g, PAL.trim, 0, 12, T, 4); R(g, shade(PAL.trim, 0.8), 0, 15, T, 1); R(g, shade(PAL.trim, 1.15), 0, 12, T, 1);
  } else {
    R(g, PAL.dark, 0, 0, T, T);
  }
  return (tileCache[key] = c);
}

// 지도 전체 바닥을 한 장으로 미리 그려 둬요 (물결 2프레임)
export function renderGround(map, frame) {
  const c = mk(map.w * T, map.h * T), g = G(c);
  const K = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? map.edge : map.kind[y * map.w + x];
  const base = { g: PAL.grass, p: PAL.path, s: PAL.sand, w: PAL.water, d: PAL.soil };
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const k = K(x, y), X = x * T, Y = y * T;
    g.drawImage(groundTile(k, (x * 7 + y * 13 + (x * y) % 3) % 4, frame), X, Y);
    // 모서리 둥글리기
    if (k === 'p' || k === 's' || k === 'd' || k === 'w') {
      const cs = [[-1, -1, 0, 0], [1, -1, 13, 0], [-1, 1, 0, 13], [1, 1, 13, 13]];
      for (const [dx, dy, ox, oy] of cs) {
        const a = K(x + dx, y), b = K(x, y + dy);
        if (a === b && a !== k && base[a] && !(k === 'w' && a !== 's' && a !== 'g')) {
          g.fillStyle = base[a];
          const fx = dx < 0 ? X : X + 13, fy = dy < 0 ? Y : Y + 13;
          g.fillRect(fx, dy < 0 ? fy : fy + 2, 3, 1);
          g.fillRect(dx < 0 ? fx : fx + 1, dy < 0 ? fy + 1 : fy + 1, 2, 1);
          g.fillRect(dx < 0 ? fx : fx + 2, dy < 0 ? fy + 2 : fy, 1, 1);
        }
      }
    }
    if (k === 'p') {
      if (K(x, y - 1) === 'g') R(g, PAL.pathD, X, Y, T, 1);
      if (K(x, y + 1) === 'g') R(g, PAL.pathD, X, Y + 15, T, 1);
    }
    if (k === 's' && K(x, y + 1) === 'w') { R(g, PAL.sandW, X, Y + 11, T, 5); R(g, '#cbb47c', X, Y + 15, T, 1); }
    if (k === 's' && K(x, y - 1) === 'g') { for (let i = 0; i < T; i += 3) R(g, PAL.grass, X + i, Y, 2, 1 + ((x + i) % 2)); }
    if (k === 'w' && K(x, y - 1) !== 'w' && K(x, y - 1) !== 'k') {
      R(g, '#eefbff', X, Y + frame, T, 1); R(g, PAL.waterL, X, Y + 1 + frame, T, 1);
      R(g, '#eefbff', X + 3 + frame * 5, Y + 3, 5, 1);
    }
    if (k === 'k') {
      if (K(x - 1, y) === 'w') { R(g, '#7a5334', X, Y, 2, T); }
      if (K(x + 1, y) === 'w') { R(g, '#7a5334', X + 14, Y, 2, T); }
      if (K(x, y + 1) === 'w') { R(g, '#7a5334', X, Y + 13, T, 3); }
    }
    if (k === 'w' && K(x, y - 1) === 'k') { R(g, PAL.waterD, X, Y, T, 4); R(g, '#6b4a30', X + 1, Y, 3, 5); R(g, '#6b4a30', X + 12, Y, 3, 5); }
    if (k === 'd' && K(x, y - 1) !== 'd') R(g, PAL.soilD, X, Y, T, 1);
  }
  for (const d of (map.decor || [])) g.drawImage(d.spr, d.px, d.py);
  return c;
}

/* ───────────── 사람 ───────────── */
// o: {skin, hair, shirt, pants, style, hat, hatCol, apron, beard, kid, scarf}
export function makeChar(o) {
  const W = 16, H = 22, skin = o.skin || '#f6cfa8', hair = o.hair, shirt = o.shirt, pants = o.pants || '#5b6a8a';
  const shoe = '#5a4035', eye = '#3b2a25', sd = shade(shirt, 0.82);
  function draw(dir, f) {
    const c = mk(W, H), g = G(c);
    // 다리
    if (dir === 'side') {
      if (f === 1) { R(g, pants, 4, 17, 3, 2); R(g, shoe, 3, 19, 3, 1); R(g, pants, 8, 17, 3, 1); R(g, shoe, 9, 18, 3, 1); }
      else if (f === 2) { R(g, pants, 6, 17, 3, 2); R(g, shoe, 6, 19, 4, 1); }
      else { R(g, pants, 6, 17, 3, 2); R(g, shoe, 6, 19, 4, 1); }
    } else {
      const a = f === 1 ? 1 : 2, b = f === 2 ? 1 : 2;
      R(g, pants, 5, 17, 2, a); R(g, shoe, 5, 17 + a, 2, 1);
      R(g, pants, 9, 17, 2, b); R(g, shoe, 9, 17 + b, 2, 1);
    }
    // 몸
    if (dir === 'side') {
      R(g, shirt, 5, 11, 6, 6);
      const ax = f === 1 ? 8 : f === 2 ? 6 : 7;
      R(g, sd, ax, 12, 2, 3); R(g, skin, ax, 15, 2, 1);
      if (o.apron) R(g, '#fff8ea', 9, 13, 2, 4);
    } else {
      R(g, shirt, 4, 11, 8, 6);
      const la = f === 1 ? 1 : 0, ra = f === 2 ? 1 : 0;
      R(g, sd, 3, 12 - la, 1, 3); R(g, sd, 12, 12 - ra, 1, 3);
      R(g, skin, 3, 15 - la, 1, 1); R(g, skin, 12, 15 - ra, 1, 1);
      if (o.apron && dir === 'down') { R(g, '#fff8ea', 5, 13, 6, 4); R(g, '#e8dcc6', 5, 16, 6, 1); }
      if (o.apron && dir === 'up') { R(g, '#fff8ea', 4, 14, 8, 1); }
      if (o.scarf && dir === 'down') { R(g, o.scarf, 5, 11, 6, 1); R(g, o.scarf, 7, 12, 2, 1); }
      if (o.overall && dir === 'down') { R(g, o.overall, 5, 13, 6, 4); R(g, o.overall, 5, 11, 1, 2); R(g, o.overall, 10, 11, 1, 2); }
    }
    // 머리
    R(g, skin, 3, 3, 10, 8);
    g.clearRect(3, 3, 1, 1); g.clearRect(12, 3, 1, 1); g.clearRect(3, 10, 1, 1); g.clearRect(12, 10, 1, 1);
    const st = o.style || 'short';
    if (dir === 'down') {
      R(g, eye, 5, 7, 1, 2); R(g, eye, 10, 7, 1, 2);
      R(g, '#f3a79a', 4, 9, 1, 1); R(g, '#f3a79a', 11, 9, 1, 1);
      if (o.old) { R(g, shade(skin, 0.86), 6, 9, 4, 1); }
      if (o.beard) { R(g, o.beard, 4, 9, 8, 2); R(g, o.beard, 5, 11, 6, 1); R(g, skin, 7, 9, 2, 1); }
      if (st !== 'bald') {
        R(g, hair, 4, 2, 8, 1); R(g, hair, 3, 3, 10, 2); R(g, hair, 3, 5, 1, 2); R(g, hair, 12, 5, 1, 2);
        R(g, hair, 4, 5, 3, 1); R(g, hair, 10, 5, 2, 1);
      } else { R(g, hair, 3, 4, 1, 4); R(g, hair, 12, 4, 1, 4); }
      if (st === 'long') { R(g, hair, 3, 5, 1, 7); R(g, hair, 12, 5, 1, 7); R(g, hair, 4, 5, 2, 1); }
      if (st === 'bun') { R(g, hair, 6, 0, 4, 2); }
      if (st === 'pig') { R(g, hair, 1, 5, 2, 4); R(g, hair, 13, 5, 2, 4); R(g, '#f27c7c', 2, 5, 1, 1); R(g, '#f27c7c', 13, 5, 1, 1); }
    } else if (dir === 'up') {
      R(g, hair, 4, 2, 8, 1); R(g, hair, 3, 3, 10, 7); R(g, skin, 5, 10, 6, 1);
      if (st === 'bald') { R(g, skin, 4, 2, 8, 1); R(g, skin, 4, 3, 8, 3); }
      if (st === 'long') { R(g, hair, 3, 10, 10, 2); }
      if (st === 'bun') { R(g, hair, 6, 0, 4, 2); }
      if (st === 'pig') { R(g, hair, 1, 5, 2, 4); R(g, hair, 13, 5, 2, 4); }
    } else {
      R(g, eye, 10, 7, 1, 2); R(g, '#f3a79a', 11, 9, 1, 1);
      if (o.beard) { R(g, o.beard, 8, 9, 5, 2); }
      if (st !== 'bald') { R(g, hair, 4, 2, 8, 1); R(g, hair, 3, 3, 10, 2); R(g, hair, 3, 5, 4, 3); R(g, hair, 3, 8, 2, 2); R(g, hair, 10, 5, 2, 1); }
      else { R(g, hair, 4, 5, 3, 3); }
      if (st === 'long') { R(g, hair, 3, 8, 3, 4); }
      if (st === 'bun') { R(g, hair, 3, 1, 3, 2); }
      if (st === 'pig') { R(g, hair, 1, 6, 3, 4); R(g, '#f27c7c', 3, 6, 1, 1); }
    }
    // 모자
    const hc = o.hatCol || '#e8c66a';
    if (o.hat === 'straw') {
      R(g, hc, 4, 0, 8, 3); R(g, shade(hc, 0.8), 4, 2, 8, 1); R(g, hc, 1, 3, 14, 1);
      if (dir !== 'up') R(g, shade(hc, 0.85), 2, 4, 12, 1);
    } else if (o.hat === 'cap') {
      R(g, hc, 3, 1, 10, 3); R(g, '#f4f1e6', 3, 3, 10, 1);
      if (dir === 'down') R(g, shade(hc, 0.6), 3, 4, 10, 1);
      if (dir === 'side') R(g, shade(hc, 0.6), 9, 4, 5, 1);
    } else if (o.hat === 'towel') {
      R(g, hc, 3, 1, 10, 4); R(g, shade(hc, 0.88), 3, 4, 10, 1);
      if (dir === 'up') R(g, hc, 7, 5, 2, 3);
      if (dir === 'side') R(g, hc, 2, 4, 2, 3);
    } else if (o.hat === 'beanie') {
      R(g, hc, 4, 1, 8, 1); R(g, hc, 3, 2, 10, 2); R(g, shade(hc, 0.8), 3, 4, 10, 1);
    } else if (o.hat === 'band') {
      R(g, hc, 3, 4, 10, 1);
      if (dir === 'up') R(g, hc, 7, 5, 2, 2);
    }
    if (o.kid) { // 아이는 몸통을 2px 줄여요
      const top = g.getImageData(0, 0, W, 13);
      g.clearRect(0, 0, W, 15); g.putImageData(top, 0, 2);
    }
    return outline(c);
  }
  const s = { down: [0, 1, 2].map(f => draw('down', f)), up: [0, 1, 2].map(f => draw('up', f)), right: [0, 1, 2].map(f => draw('side', f)) };
  s.left = s.right.map(flip);
  return s;
}

export function portrait(sprites, size = 4) {
  const c = mk(14 * size, 13 * size), g = G(c);
  g.drawImage(sprites.down[0], 1, 0, 14, 13, 0, 0, 14 * size, 13 * size);
  return c;
}

/* ───────────── 아이콘 (12×12) ───────────── */
const icon = fn => { const c = mk(12, 12); fn(G(c)); return outline(c); };
function bowl(g, body, soup, tops = []) {
  R(g, body, 2, 7, 9, 1); R(g, body, 3, 8, 7, 1); R(g, shade(body, 0.85), 4, 9, 5, 1); R(g, shade(body, 0.7), 5, 10, 3, 1);
  ell(g, shade(body, 1.08), 6, 5, 5, 1); ell(g, soup, 6, 5, 4, 1); R(g, soup, 3, 6, 7, 1); R(g, body, 1, 6, 2, 1); R(g, body, 10, 6, 2, 1);
  for (const [x, y, c, w = 1] of tops) R(g, c, x, y, w, 1);
}
function plate(g) { ell(g, '#fbf6ea', 6, 7, 5, 3); ell(g, '#e7dfcc', 6, 8, 4, 2); ell(g, '#fbf6ea', 6, 7, 4, 2); }

const ICON_DRAW = {
  rice: g => { R(g, '#eadfc3', 3, 3, 6, 7); R(g, '#d5c5a1', 3, 9, 6, 1); R(g, '#d5c5a1', 8, 4, 1, 5); R(g, '#eadfc3', 4, 1, 4, 2); R(g, '#b0895a', 4, 2, 4, 1); R(g, '#c4553f', 5, 5, 2, 2); },
  pa: g => { for (let i = 0; i < 8; i++) R(g, i < 3 ? '#f6f4e4' : (i < 5 ? '#9fd27a' : '#5fa644'), 2 + i, 9 - i, 2, 1); R(g, '#5fa644', 9, 1, 1, 2); R(g, '#5fa644', 7, 1, 1, 2); R(g, '#d8c9a8', 1, 10, 2, 1); },
  mu: g => { ell(g, '#f8f5ec', 5, 7, 3, 3); R(g, '#dfd9c8', 7, 7, 1, 3); R(g, '#c9e3a6', 3, 4, 5, 1); R(g, '#5fa644', 4, 1, 1, 3); R(g, '#5fa644', 6, 1, 1, 3); R(g, '#7cc05a', 5, 2, 1, 2); R(g, '#7cc05a', 8, 2, 1, 2); R(g, '#7cc05a', 2, 2, 1, 2); },
  gamja: g => { ell(g, '#cfa56c', 6, 6, 4, 3); R(g, '#a57f4c', 4, 5); R(g, '#a57f4c', 7, 7); R(g, '#a57f4c', 8, 5); R(g, '#e0bb85', 4, 4, 3, 1); },
  egg: g => { ell(g, '#fdf5e4', 6, 6, 3, 4); R(g, '#e9dcc0', 8, 6, 1, 3); R(g, '#e9dcc0', 6, 9, 2, 1); R(g, '#ffffff', 4, 4, 1, 2); },
  tofu: g => { R(g, '#fdfaf0', 2, 4, 8, 6); R(g, '#e4dccb', 2, 9, 8, 1); R(g, '#e4dccb', 9, 4, 1, 6); R(g, '#ffffff', 3, 5, 3, 1); },
  doenjang: g => { R(g, '#8c5b3a', 3, 4, 6, 6); R(g, '#744a2e', 8, 4, 1, 6); R(g, '#6b4129', 2, 3, 8, 1); R(g, '#6b4129', 5, 2, 2, 1); R(g, '#ead9b4', 4, 6, 3, 2); },
  mushroom: g => { ell(g, '#a9683f', 6, 4, 4, 2); R(g, '#c98a5c', 4, 3, 2, 1); R(g, '#f1e5cd', 5, 7, 3, 3); R(g, '#d8caa9', 7, 7, 1, 3); R(g, '#7f4b2b', 2, 6, 9, 1); },
  namul: g => { R(g, '#4f9a3a', 6, 3, 1, 7); R(g, '#7cc05a', 3, 4, 3, 1); R(g, '#7cc05a', 7, 5, 3, 1); R(g, '#7cc05a', 3, 6, 3, 1); R(g, '#7cc05a', 7, 7, 3, 1); R(g, '#4f9a3a', 6, 2, 3, 1); R(g, '#4f9a3a', 8, 3, 1, 1); R(g, '#7cc05a', 4, 8, 2, 1); },
  clam: g => { ell(g, '#ead4b2', 6, 6, 4, 3); R(g, '#c8aa82', 3, 5, 1, 3); R(g, '#c8aa82', 6, 4, 1, 4); R(g, '#c8aa82', 9, 5, 1, 3); R(g, '#b5946a', 5, 10, 3, 1); R(g, '#fff4dd', 4, 4, 2, 1); },
  miyeok: g => { R(g, '#2f6b4f', 3, 1, 2, 3); R(g, '#2f6b4f', 4, 4, 2, 3); R(g, '#2f6b4f', 3, 7, 2, 3); R(g, '#479472', 7, 2, 2, 2); R(g, '#479472', 8, 4, 2, 3); R(g, '#479472', 7, 7, 2, 3); R(g, '#5fb08a', 4, 2, 1, 1); },
  fish: g => { ell(g, '#84adcc', 5, 6, 4, 2); R(g, '#d3e3ee', 2, 7, 6, 1); R(g, '#5f89aa', 9, 5, 1, 3); R(g, '#5f89aa', 10, 4, 1, 5); R(g, '#2b2b2b', 3, 5); R(g, '#5f89aa', 5, 3, 3, 1); },
  // 요리
  egg_rice: g => { plate(g); ell(g, '#f4dc86', 6, 6, 3, 2); R(g, '#fff3c2', 5, 5, 2, 1); R(g, '#5fa644', 4, 6); R(g, '#5fa644', 7, 5); R(g, '#5fa644', 8, 7); R(g, '#f0a13c', 6, 7); },
  doenjang_jjigae: g => bowl(g, '#5a4a44', '#b9793f', [[4, 5, '#fdfaf0', 2], [7, 5, '#5fa644'], [8, 6, '#fdfaf0'], [5, 6, '#5fa644']]),
  radish_soup: g => bowl(g, '#f1e9d6', '#eee6c8', [[4, 5, '#ffffff', 2], [7, 5, '#5fa644'], [8, 6, '#ffffff'], [5, 6, '#5fa644']]),
  miyeok_guk: g => bowl(g, '#f1e9d6', '#5d8f77', [[4, 5, '#2f6b4f', 2], [7, 5, '#ead4b2', 2], [5, 6, '#2f6b4f', 2]]),
  gamjajeon: g => { plate(g); ell(g, '#ecc56c', 6, 7, 3, 2); R(g, '#c78f3c', 3, 7); R(g, '#c78f3c', 9, 7); R(g, '#c78f3c', 5, 5, 3, 1); R(g, '#f7dc94', 5, 7, 2, 1); },
  mushroom_rice: g => bowl(g, '#4d4038', '#fbf6e8', [[4, 5, '#a9683f', 2], [7, 5, '#a9683f'], [6, 6, '#7f4b2b', 2], [8, 6, '#fbf6e8']]),
  namul_rice: g => bowl(g, '#4d4038', '#fbf6e8', [[4, 5, '#5fa644', 2], [7, 5, '#7cc05a'], [6, 6, '#4f9a3a', 2]]),
  grilled_fish: g => { plate(g); ell(g, '#c08a52', 5, 7, 3, 1); R(g, '#8f5f33', 9, 6, 1, 3); R(g, '#8f5f33', 4, 6, 1, 3); R(g, '#8f5f33', 6, 6, 1, 3); R(g, '#f8f5ec', 8, 9, 2, 1); R(g, '#2b2b2b', 3, 7); },
  gukbap: g => bowl(g, '#4a3d38', '#d9b27a', [[4, 5, '#fbf6e8', 2], [7, 5, '#a9683f'], [8, 6, '#f8f5ec'], [5, 6, '#f8f5ec', 2]]),
  // 기타
  coin: g => { ell(g, '#f2c94c', 6, 6, 4, 4); ell(g, '#f7dd7e', 5, 5, 2, 2); R(g, '#c99a2e', 6, 4, 1, 5); },
  heart: g => { R(g, '#ef6f6f', 2, 3, 3, 2); R(g, '#ef6f6f', 7, 3, 3, 2); R(g, '#ef6f6f', 2, 5, 8, 2); R(g, '#ef6f6f', 3, 7, 6, 1); R(g, '#ef6f6f', 4, 8, 4, 1); R(g, '#ef6f6f', 5, 9, 2, 1); R(g, '#ffb3b3', 3, 4, 1, 1); },
  bang: g => { R(g, '#f2a03c', 5, 1, 2, 6); R(g, '#f2a03c', 5, 8, 2, 2); },
  dots: g => { R(g, '#8a7a6a', 2, 6, 2, 2); R(g, '#8a7a6a', 5, 6, 2, 2); R(g, '#8a7a6a', 8, 6, 2, 2); },
  page: g => { R(g, '#fbf3dc', 3, 1, 7, 10); R(g, '#e3d6b4', 9, 1, 1, 10); R(g, '#a8794f', 4, 3, 4, 1); R(g, '#a8794f', 4, 5, 4, 1); R(g, '#a8794f', 4, 7, 3, 1); },
  rod: g => { for (let i = 0; i < 9; i++) R(g, '#a5754a', 2 + i, 10 - i, 1, 1); R(g, '#ddd', 10, 2, 1, 5); R(g, '#e25c5c', 9, 7, 2, 2); },
};
const MAINCOL = { rice: '#fbf6e8', egg: '#f4dc86', tofu: '#fdfaf0', doenjang: '#b9793f', pa: '#5fa644', mu: '#f8f5ec', gamja: '#ecc56c', mushroom: '#a9683f', namul: '#7cc05a', clam: '#ead4b2', miyeok: '#2f6b4f', fish: '#84adcc' };
// 나만의 요리: 재료 색으로 그릇을 그려요 (남색 그릇/남색 테두리가 '내 요리' 표시)
export function registerDish(id, cooker, ings) {
  const c = ings.map(i => MAINCOL[i.replace(/_c$/, '')] || '#cccccc'), c1 = c[1] || c[0], c2 = c[2] || c1;
  ICON_DRAW[id] = cooker === 'pan'
    ? g => { plate(g); R(g, '#3d5a8c', 2, 10, 9, 1); ell(g, c[0], 6, 6, 3, 2); R(g, c1, 4, 6, 2, 1); R(g, c2, 7, 5, 2, 1); R(g, c1, 7, 7, 1, 1); }
    : g => bowl(g, '#3d5a8c', c[0], [[4, 5, c1, 2], [7, 5, c2], [6, 6, c1], [8, 6, c2]]);
  delete iconCache[id]; delete urlCache[id];
}
const iconCache = {};
export function itemIcon(id) {
  if (iconCache[id]) return iconCache[id];
  let c;
  if (id.endsWith('_c')) {
    const baseId = id.slice(0, -2), cols = CHOP_COL[baseId] || ['#ccc', '#aaa'];
    c = icon(g => {
      R(g, '#d9b98a', 1, 9, 10, 2);
      [[2, 6], [5, 4], [7, 7], [4, 7], [8, 4], [3, 3]].forEach(([x, y], i) => R(g, cols[i % 2], x, y, 2, 2));
    });
  } else c = icon(ICON_DRAW[id] || ICON_DRAW.dots);
  return (iconCache[id] = c);
}
const CHOP_COL = { pa: ['#5fa644', '#f6f4e4'], mu: ['#f8f5ec', '#dfd9c8'], gamja: ['#f2dea0', '#cfa56c'], tofu: ['#fdfaf0', '#e4dccb'], mushroom: ['#a9683f', '#f1e5cd'], namul: ['#7cc05a', '#4f9a3a'] };
const urlCache = {};
export function iconURL(id) {
  if (!urlCache[id]) urlCache[id] = itemIcon(id).toDataURL();
  return urlCache[id];
}

/* ───────────── 마을 사물 ───────────── */
const S = {};
const sprite = (name, w, h, fn) => { const c = mk(w, h); fn(G(c)); return (S[name] = outline(c)); };
const raw = (name, w, h, fn) => { const c = mk(w, h); fn(G(c)); return (S[name] = c); };

export function buildSprites() {
  sprite('tree', 26, 36, g => {
    R(g, '#8c5d3c', 11, 26, 4, 9); R(g, '#744a2e', 14, 26, 1, 9);
    ell(g, '#4d9a4c', 13, 20, 10, 6); ell(g, '#5fae56', 13, 14, 9, 6); ell(g, '#74c267', 13, 8, 7, 5);
    [[8, 6], [15, 4], [6, 13], [17, 12], [9, 19], [18, 20]].forEach(([x, y]) => R(g, '#92d880', x, y, 2, 1));
    [[11, 10], [16, 16], [7, 22], [13, 23]].forEach(([x, y]) => R(g, '#3f8843', x, y, 2, 1));
  });
  sprite('tree2', 26, 36, g => {
    R(g, '#8c5d3c', 11, 26, 4, 9); R(g, '#744a2e', 14, 26, 1, 9);
    ell(g, '#3f8f5d', 13, 21, 9, 5); ell(g, '#4fa56c', 13, 15, 10, 6); ell(g, '#66ba7e', 13, 8, 7, 6);
    [[9, 5], [16, 8], [6, 14], [18, 15], [10, 20]].forEach(([x, y]) => R(g, '#88d49b', x, y, 2, 1));
    [[12, 12], [7, 18], [15, 22]].forEach(([x, y]) => R(g, '#347a4e', x, y, 2, 1));
    [[8, 10], [17, 19]].forEach(([x, y]) => R(g, '#f08a6a', x, y, 2, 2));
  });
  sprite('pine', 22, 38, g => {
    R(g, '#7a5334', 9, 30, 4, 7);
    for (let L = 0; L < 4; L++) { const top = 1 + L * 7, hw = 4 + L * 2; for (let i = 0; i < 9; i++) { const w = Math.round(1 + (hw - 1) * i / 8); R(g, i > 6 ? '#2f7a55' : '#3b8f63', 11 - w, top + i, w * 2, 1); } R(g, '#58aa7c', 9, top + 2, 2, 1); }
  });
  sprite('bush', 16, 13, g => { ell(g, '#5fae56', 8, 7, 6, 4); ell(g, '#74c267', 6, 5, 3, 2); R(g, '#f08a6a', 10, 6, 2, 2); R(g, '#f08a6a', 4, 8, 2, 2); });
  sprite('rock', 16, 12, g => { ell(g, '#a9a69c', 8, 7, 6, 3); ell(g, '#c4c1b6', 7, 5, 3, 1); R(g, '#8b887f', 9, 9, 4, 1); });
  sprite('fenceH', 16, 12, g => { R(g, '#d9b98a', 0, 4, 16, 2); R(g, '#d9b98a', 0, 8, 16, 2); R(g, '#c29a68', 2, 1, 3, 10); R(g, '#c29a68', 11, 1, 3, 10); });
  sprite('fenceV', 6, 18, g => { R(g, '#c29a68', 1, 1, 3, 16); R(g, '#d9b98a', 1, 1, 1, 16); });
  sprite('sign', 16, 18, g => { R(g, '#8c5d3c', 7, 9, 2, 8); R(g, '#e3c08d', 2, 2, 12, 8); R(g, '#c29a68', 2, 9, 12, 1); R(g, '#8c5d3c', 4, 4, 8, 1); R(g, '#8c5d3c', 4, 6, 6, 1); });
  sprite('busstop', 16, 30, g => { R(g, '#7d8a94', 7, 10, 2, 19); ell(g, '#4f8fd0', 8, 6, 5, 5); ell(g, '#f4f7fa', 8, 6, 3, 3); R(g, '#4f8fd0', 6, 5, 5, 2); R(g, '#f4f7fa', 7, 5, 1, 1); R(g, '#f4f7fa', 9, 5, 1, 1); R(g, '#5d6a74', 5, 28, 6, 1); });
  sprite('well', 20, 24, g => { R(g, '#8c5d3c', 2, 4, 2, 12); R(g, '#8c5d3c', 16, 4, 2, 12); R(g, '#b9553f', 1, 1, 18, 3); R(g, '#d06a52', 2, 1, 16, 1); ell(g, '#a9a69c', 10, 17, 8, 4); ell(g, '#3d6c86', 10, 15, 6, 2); R(g, '#c4c1b6', 3, 18, 14, 1); R(g, '#8b887f', 4, 21, 12, 1); R(g, '#c9b28a', 10, 4, 1, 8); });
  sprite('bench', 30, 16, g => { R(g, '#c99562', 1, 3, 28, 3); R(g, '#b07e4d', 1, 6, 28, 1); R(g, '#c99562', 1, 8, 28, 4); R(g, '#a5754a', 1, 11, 28, 1); R(g, '#7a5334', 3, 12, 2, 3); R(g, '#7a5334', 25, 12, 2, 3); R(g, '#7a5334', 2, 1, 2, 3); R(g, '#7a5334', 26, 1, 2, 3); });
  sprite('lamp', 10, 30, g => { R(g, '#5d5550', 4, 8, 2, 21); R(g, '#5d5550', 2, 28, 6, 1); R(g, '#5d5550', 2, 1, 6, 1); R(g, '#ffe9a6', 2, 2, 6, 5); R(g, '#fff6d3', 3, 3, 2, 2); R(g, '#5d5550', 2, 7, 6, 1); });
  sprite('crates', 18, 20, g => { R(g, '#c99562', 1, 9, 16, 10); R(g, '#a5754a', 1, 13, 16, 1); R(g, '#a5754a', 8, 9, 1, 10); R(g, '#d9ab78', 3, 1, 11, 8); R(g, '#a5754a', 3, 4, 11, 1); R(g, '#e25c5c', 4, 0, 3, 2); R(g, '#f2a03c', 8, 0, 3, 2); R(g, '#7cc05a', 11, 0, 2, 2); });
  sprite('logs', 20, 14, g => { for (const [x, y] of [[1, 8], [7, 8], [13, 8], [4, 3], [10, 3]]) { R(g, '#a5754a', x, y, 6, 5); ell(g, '#e3c08d', x + 2, y + 2, 2, 2); R(g, '#c29a68', x + 2, y + 2, 1, 1); } });
  sprite('boat', 34, 16, g => { R(g, '#e9e2d0', 2, 3, 30, 4); R(g, '#c9553f', 3, 7, 28, 3); R(g, '#a8402e', 5, 10, 24, 2); R(g, '#8c5d3c', 6, 2, 22, 1); R(g, '#f7f3e6', 3, 3, 28, 1); R(g, '#8c5d3c', 12, 4, 2, 3); R(g, '#8c5d3c', 20, 4, 2, 3); });
  sprite('stump', 14, 12, g => { R(g, '#a5754a', 2, 4, 10, 7); ell(g, '#e3c08d', 7, 4, 5, 2); R(g, '#c29a68', 6, 4, 3, 1); R(g, '#7a5334', 2, 10, 10, 1); });
  sprite('swing', 22, 28, g => { R(g, '#8c5d3c', 2, 1, 2, 26); R(g, '#8c5d3c', 18, 1, 2, 26); R(g, '#8c5d3c', 1, 1, 20, 2); R(g, '#d8caa9', 7, 3, 1, 14); R(g, '#d8caa9', 14, 3, 1, 14); R(g, '#e25c5c', 6, 17, 10, 2); });
  // 작물·채집물
  sprite('crop_pa', 14, 14, g => { for (const x of [3, 6, 9]) { R(g, '#5fa644', x, 2, 2, 9); R(g, '#7cc05a', x, 2, 1, 6); R(g, '#f6f4e4', x, 10, 2, 2); } R(g, '#5fa644', 2, 1, 1, 2); R(g, '#5fa644', 11, 1, 1, 3); });
  sprite('crop_mu', 14, 14, g => { ell(g, '#f8f5ec', 7, 10, 3, 2); R(g, '#c9e3a6', 5, 8, 5, 1); for (const [x, y, h] of [[3, 2, 6], [6, 1, 7], [9, 2, 6], [11, 4, 4], [1, 4, 4]]) R(g, x % 2 ? '#5fa644' : '#7cc05a', x, y, 2, h); });
  sprite('crop_gamja', 14, 14, g => { ell(g, '#5fa644', 7, 6, 5, 4); ell(g, '#7cc05a', 5, 5, 2, 2); R(g, '#7cc05a', 9, 4, 2, 2); R(g, '#f4f1e6', 7, 2, 2, 2); R(g, '#cfa56c', 3, 11, 3, 2); R(g, '#cfa56c', 9, 11, 3, 2); });
  sprite('node_mushroom', 14, 12, g => { ell(g, '#a9683f', 5, 4, 3, 2); R(g, '#f1e5cd', 4, 7, 3, 4); ell(g, '#c98a5c', 10, 6, 2, 1); R(g, '#f1e5cd', 9, 8, 2, 3); R(g, '#e9c9a3', 4, 3, 1, 1); });
  sprite('node_namul', 14, 13, g => { for (const [x, h] of [[3, 7], [6, 10], [9, 8], [11, 5]]) { R(g, '#4f9a3a', x, 12 - h, 1, h); R(g, '#7cc05a', x - 1, 12 - h, 3, 1); R(g, '#7cc05a', x - 1, 14 - h, 1, 1); R(g, '#7cc05a', x + 1, 15 - h, 1, 1); } });
  sprite('node_clam', 14, 10, g => { ell(g, '#ead4b2', 5, 5, 3, 2); R(g, '#c8aa82', 5, 3, 1, 4); R(g, '#c8aa82', 3, 4, 1, 3); ell(g, '#f3c9c0', 10, 6, 2, 1); R(g, '#d9a79c', 10, 5, 1, 3); });
  sprite('node_miyeok', 14, 11, g => { R(g, '#2f6b4f', 2, 3, 3, 2); R(g, '#2f6b4f', 4, 5, 3, 2); R(g, '#2f6b4f', 3, 7, 3, 2); R(g, '#479472', 8, 2, 3, 2); R(g, '#479472', 9, 4, 3, 3); R(g, '#479472', 7, 7, 4, 2); });
  raw('ripple0', 16, 16, g => { g.strokeStyle = '#eefbff'; R(g, '#eefbff', 5, 6, 6, 1); R(g, '#eefbff', 5, 10, 6, 1); R(g, '#eefbff', 3, 7, 2, 3); R(g, '#eefbff', 11, 7, 2, 3); });
  raw('ripple1', 16, 16, g => { R(g, '#eefbff', 3, 4, 10, 1); R(g, '#eefbff', 3, 12, 10, 1); R(g, '#eefbff', 1, 5, 2, 7); R(g, '#eefbff', 13, 5, 2, 7); R(g, '#e25c5c', 7, 7, 2, 2); });
  sprite('bobber', 6, 8, g => { R(g, '#f4f1e6', 1, 1, 3, 3); R(g, '#e25c5c', 1, 4, 3, 2); });
  sprite('cat0', 16, 13, g => { ell(g, '#f1b866', 8, 8, 5, 3); ell(g, '#f1b866', 4, 5, 3, 2); R(g, '#f1b866', 1, 1, 2, 3); R(g, '#f1b866', 5, 1, 2, 3); R(g, '#3b2a25', 3, 5); R(g, '#3b2a25', 5, 5); R(g, '#fff4dd', 3, 7, 3, 1); R(g, '#d99745', 9, 6, 2, 1); R(g, '#d99745', 12, 7, 1, 2); R(g, '#f1b866', 13, 4, 1, 5); });
  sprite('cat1', 16, 13, g => { ell(g, '#f1b866', 8, 8, 5, 3); ell(g, '#f1b866', 4, 5, 3, 2); R(g, '#f1b866', 1, 1, 2, 3); R(g, '#f1b866', 5, 1, 2, 3); R(g, '#3b2a25', 2, 5, 2, 1); R(g, '#3b2a25', 5, 5, 2, 1); R(g, '#fff4dd', 3, 7, 3, 1); R(g, '#d99745', 9, 6, 2, 1); R(g, '#d99745', 12, 7, 1, 2); R(g, '#f1b866', 13, 6, 2, 1); R(g, '#f1b866', 14, 5, 1, 2); });
  for (const [n, a, b] of [['flowerA', '#fff4dd', '#f2c94c'], ['flowerB', '#f7a8b8', '#fff4dd'], ['flowerC', '#b9a3ee', '#f2c94c']]) {
    raw(n, 7, 7, g => { R(g, '#5fa644', 3, 4, 1, 3); R(g, a, 2, 1, 3, 3); R(g, a, 3, 0, 1, 5); R(g, a, 1, 2, 5, 1); R(g, b, 3, 2, 1, 1); });
  }
  raw('shell', 6, 5, g => { R(g, '#f3c9c0', 1, 1, 4, 3); R(g, '#d9a79c', 2, 1, 1, 3); R(g, '#d9a79c', 4, 2, 1, 2); });
  raw('starfish', 7, 7, g => { R(g, '#f2a03c', 3, 0, 1, 7); R(g, '#f2a03c', 0, 3, 7, 1); R(g, '#f2a03c', 2, 2, 3, 3); R(g, '#f7c57c', 3, 3, 1, 1); });

  // 건물
  S.houseShop = makeHouse(7, 5, { roof: '#e8884a', roof2: '#d3713a', wall: '#f7ead0', door: '#8c5d3c', noren: true, chimney: true });
  S.houseStall = makeHouse(6, 4, { roof: '#5b9fc7', roof2: '#4a88ae', wall: '#f3e2c2', door: '#7a5334', awning: true });
  S.houseSori = makeHouse(5, 4, { roof: '#e58d9c', roof2: '#cf7686', wall: '#fbf1dc', door: '#8c5d3c' });
  S.houseCabin = makeHouse(5, 4, { roof: '#6f9f5c', roof2: '#5a8a4b', wall: '#c99562', door: '#6b4129', logs: true, chimney: true });
  S.houseHut = makeHouse(4, 3, { roof: '#8d8f96', roof2: '#74767e', wall: '#e9e2d0', door: '#5f89aa' });

  // 가게 안
  sprite('counter', 16, 22, g => { R(g, '#e9d3a7', 0, 1, 16, 9); R(g, '#f6e6c4', 0, 1, 16, 2); R(g, '#b98a5c', 0, 10, 16, 11); R(g, '#a5754a', 0, 10, 16, 1); R(g, '#a5754a', 7, 12, 1, 8); R(g, '#d9ab78', 3, 14, 2, 1); R(g, '#d9ab78', 10, 14, 2, 1); });
  sprite('pantry', 32, 34, g => {
    R(g, '#a5754a', 0, 1, 32, 32); R(g, '#c99562', 2, 3, 28, 8); R(g, '#c99562', 2, 13, 28, 8); R(g, '#c99562', 2, 23, 28, 8);
    const jar = (x, y, c) => { R(g, c, x, y + 2, 5, 5); R(g, shade(c, 0.8), x + 4, y + 2, 1, 5); R(g, '#6b4129', x, y + 1, 5, 1); };
    jar(4, 3, '#eadfc3'); jar(11, 3, '#c4553f'); jar(18, 3, '#8c5b3a'); jar(25, 3, '#f2c94c');
    R(g, '#7cc05a', 4, 15, 6, 6); R(g, '#f8f5ec', 12, 16, 5, 5); R(g, '#cfa56c', 19, 17, 4, 4); R(g, '#cfa56c', 24, 16, 4, 5);
    R(g, '#eadfc3', 4, 24, 9, 7); R(g, '#c4553f', 7, 26, 3, 3); R(g, '#fdf5e4', 16, 27, 3, 4); R(g, '#fdf5e4', 20, 27, 3, 4); R(g, '#fdf5e4', 24, 27, 3, 4);
  });
  sprite('board', 16, 22, g => { g.drawImage(S.counter, 0, 0); R(g, '#f1d9a8', 2, 3, 10, 6); R(g, '#d9b98a', 2, 8, 10, 1); R(g, '#d5dbe0', 12, 2, 2, 6); R(g, '#6b4129', 12, 7, 2, 3); });
  const stove = (g) => { g.drawImage(S.counter, 0, 0); R(g, '#4a4a52', 1, 2, 14, 8); R(g, '#33333a', 1, 9, 14, 1); };
  sprite('stove_pot', 16, 26, g => { g.translate(0, 4); stove(g); R(g, '#7d8794', 3, -2, 10, 9); R(g, '#9aa5b3', 3, -2, 10, 2); R(g, '#5d6672', 12, 0, 1, 7); R(g, '#5d6672', 1, 0, 2, 2); R(g, '#5d6672', 13, 0, 2, 2); });
  sprite('stove_pan', 16, 26, g => { g.translate(0, 4); stove(g); ell(g, '#3c3c44', 7, 5, 5, 3); ell(g, '#55555f', 7, 4, 4, 2); R(g, '#6b4129', 12, 6, 4, 2); });
  sprite('sink', 16, 22, g => { g.drawImage(S.counter, 0, 0); R(g, '#c7d3dc', 2, 3, 12, 6); R(g, '#8fb9cf', 3, 4, 10, 4); R(g, '#9aa5b3', 7, 0, 2, 4); R(g, '#9aa5b3', 7, 0, 4, 1); });
  sprite('bookstand', 16, 22, g => { g.drawImage(S.counter, 0, 0); R(g, '#8c5d3c', 2, 3, 12, 6); R(g, '#fbf3dc', 3, 3, 5, 5); R(g, '#fbf3dc', 9, 3, 4, 5); R(g, '#a8794f', 4, 4, 3, 1); R(g, '#a8794f', 4, 6, 3, 1); R(g, '#a8794f', 10, 4, 2, 1); R(g, '#c4553f', 8, 3, 1, 6); });
  const cauldron = (g, open) => {
    R(g, '#cfc4ae', 0, 12, 32, 16); R(g, '#e3d9c4', 0, 12, 32, 2); R(g, '#b5a98f', 0, 27, 32, 1);
    R(g, '#3b2a25', 12, 19, 8, 8); R(g, open ? '#f2a03c' : '#5a463c', 13, 21, 6, 6); if (open) R(g, '#f7dd7e', 15, 23, 2, 4);
    ell(g, '#3a3a40', 16, 9, 12, 4); R(g, '#3a3a40', 5, 9, 23, 4);
    if (open) { ell(g, '#d9b27a', 16, 8, 9, 2); }
    else { ell(g, '#55555f', 16, 7, 10, 3); R(g, '#3a3a40', 14, 2, 5, 3); R(g, '#6c6c78', 10, 6, 6, 1); }
  };
  sprite('cauldron0', 32, 30, g => cauldron(g, false));
  sprite('cauldron1', 32, 30, g => cauldron(g, true));
  sprite('stairs', 16, 30, g => { R(g, '#6b4129', 0, 0, 16, 30); for (let i = 0; i < 6; i++) { R(g, '#c99562', 1 + i, 24 - i * 4.6 | 0, 14 - i, 4); R(g, '#a5754a', 1 + i, (24 - i * 4.6 | 0) + 3, 14 - i, 1); } R(g, '#2b1d18', 6, 0, 9, 3); });
  sprite('table', 18, 18, g => { ell(g, '#f7efe0', 9, 6, 8, 5); ell(g, '#fdf8ee', 9, 5, 7, 3); R(g, '#e25c5c', 2, 9, 2, 1); R(g, '#e25c5c', 6, 10, 2, 1); R(g, '#e25c5c', 10, 10, 2, 1); R(g, '#e25c5c', 14, 9, 2, 1); R(g, '#8c5d3c', 7, 12, 4, 5); R(g, '#744a2e', 5, 16, 8, 1); });
  sprite('stool', 12, 10, g => { ell(g, '#c99562', 6, 3, 4, 2); R(g, '#8c5d3c', 3, 5, 2, 4); R(g, '#8c5d3c', 7, 5, 2, 4); });
  sprite('signOpen', 16, 22, g => { R(g, '#8c5d3c', 3, 14, 2, 7); R(g, '#8c5d3c', 11, 14, 2, 7); R(g, '#f7ead0', 1, 2, 14, 12); R(g, '#e8884a', 1, 2, 14, 2); R(g, '#e8884a', 4, 6, 8, 2); R(g, '#e8884a', 4, 10, 8, 1); });
  sprite('signClosed', 16, 22, g => { R(g, '#8c5d3c', 3, 14, 2, 7); R(g, '#8c5d3c', 11, 14, 2, 7); R(g, '#d8caa9', 1, 2, 14, 12); R(g, '#8a7a6a', 1, 2, 14, 2); R(g, '#8a7a6a', 4, 7, 8, 1); R(g, '#8a7a6a', 4, 10, 8, 1); });
  sprite('plant', 14, 22, g => { R(g, '#c4553f', 3, 14, 8, 7); R(g, '#a8402e', 3, 14, 8, 2); ell(g, '#5fae56', 7, 8, 5, 5); ell(g, '#74c267', 5, 6, 2, 2); R(g, '#3f8843', 9, 10, 2, 2); });
  sprite('photo', 12, 12, g => { R(g, '#8c5d3c', 1, 1, 10, 10); R(g, '#f6e8c9', 2, 2, 8, 8); R(g, '#f6cfa8', 4, 4, 4, 4); R(g, '#cfcfd6', 4, 3, 4, 2); R(g, '#b06a8a', 3, 8, 6, 2); });
  raw('window', 30, 12, g => { R(g, '#8c5d3c', 0, 0, 30, 12); R(g, '#bfe6f2', 2, 2, 12, 8); R(g, '#bfe6f2', 16, 2, 12, 8); R(g, '#e3f5fa', 3, 3, 4, 2); R(g, '#e3f5fa', 17, 3, 4, 2); });
  raw('shelf', 26, 10, g => { R(g, '#8c5d3c', 0, 8, 26, 2); R(g, '#c4553f', 2, 3, 4, 5); R(g, '#f2c94c', 8, 4, 4, 4); R(g, '#7cc05a', 14, 2, 3, 6); R(g, '#eadfc3', 19, 3, 5, 5); });
  raw('mat', 32, 10, g => { R(g, '#c4553f', 0, 0, 32, 10); R(g, '#e8884a', 2, 2, 28, 6); R(g, '#f7ead0', 5, 4, 22, 2); });
  raw('rug', 48, 28, g => { R(g, '#d98a6a', 0, 0, 48, 28); R(g, '#f1c9a0', 2, 2, 44, 24); R(g, '#d98a6a', 5, 5, 38, 18); R(g, '#f1c9a0', 8, 8, 32, 12); });
  return S;
}

function makeHouse(wt, ht, o) {
  const W = wt * T, H = ht * T + 10, c = mk(W, H), g = G(c);
  const roofH = Math.floor(H * 0.52), wallTop = roofH - 3;
  // 벽
  R(g, o.wall, 3, wallTop, W - 6, H - wallTop - 1);
  for (let y = wallTop + 4; y < H - 5; y += o.logs ? 4 : 6) R(g, shade(o.wall, 0.9), 3, y, W - 6, 1);
  R(g, '#a9a69c', 3, H - 5, W - 6, 4); R(g, '#8b887f', 3, H - 2, W - 6, 1);
  // 굴뚝
  if (o.chimney) { R(g, '#b5a08c', W - 20, 2, 7, 12); R(g, '#8e7b69', W - 21, 1, 9, 3); }
  // 지붕
  for (let y = 0; y < roofH; y++) {
    const inset = Math.max(0, Math.round((roofH - y) * 0.42) - 3);
    const band = Math.floor(y / 4) % 2;
    R(g, y >= roofH - 3 ? shade(o.roof2, 0.85) : (band ? o.roof : o.roof2), inset, y + 6, W - inset * 2, 1);
    if (y % 4 === 0 && y < roofH - 3) for (let x = inset + ((y / 4) % 2) * 4; x < W - inset; x += 8) R(g, shade(o.roof2, 0.88), x, y + 6, 1, 4);
  }
  R(g, shade(o.roof, 1.15), Math.round(roofH * 0.42) - 3, 6, W - (Math.round(roofH * 0.42) - 3) * 2, 2);
  // 문
  const cx = Math.floor(W / 2), dh = 19, dy = H - 1 - dh;
  R(g, shade(o.door, 0.7), cx - 7, dy - 1, 14, dh + 1); R(g, o.door, cx - 6, dy, 12, dh); R(g, shade(o.door, 1.2), cx - 5, dy + 1, 4, dh - 3); R(g, shade(o.door, 1.2), cx + 1, dy + 1, 4, dh - 3);
  R(g, '#f2c94c', cx + 3, dy + 10, 2, 2);
  // 창문
  const win = x => { R(g, '#7a5334', x, dy + 1, 12, 11); R(g, '#bfe6f2', x + 1, dy + 2, 10, 9); R(g, '#7a5334', x + 5, dy + 2, 1, 9); R(g, '#7a5334', x + 1, dy + 6, 10, 1); R(g, '#e3f5fa', x + 2, dy + 3, 2, 2); R(g, '#c99562', x - 1, dy + 12, 14, 2); };
  if (W >= 64) { win(8); win(W - 20); }
  if (o.noren) {
    R(g, '#3d5a8c', cx - 9, dy - 2, 18, 7); R(g, '#2f4670', cx - 9, dy + 4, 18, 1);
    R(g, shade(o.door, 1.2), cx - 3, dy + 3, 1, 2); R(g, shade(o.door, 1.2), cx + 3, dy + 3, 1, 2);
    R(g, '#f7ead0', cx - 2, dy, 4, 2); R(g, '#f7ead0', cx - 1, dy + 2, 2, 1);
    // 간판
    R(g, '#8c5d3c', cx - 13, dy - 13, 26, 9); R(g, '#f7ead0', cx - 12, dy - 12, 24, 7);
    // 간판 그림: 김이 오르는 그릇
    R(g, '#c4553f', cx - 5, dy - 8, 10, 1); R(g, '#c4553f', cx - 4, dy - 7, 8, 1); R(g, '#a8402e', cx - 2, dy - 6, 4, 1);
    R(g, '#8a7a6a', cx - 3, dy - 11, 1, 2); R(g, '#8a7a6a', cx, dy - 11, 1, 2); R(g, '#8a7a6a', cx + 3, dy - 11, 1, 2);
    // 등불
    R(g, '#e25c5c', 3, dy - 4, 5, 7); R(g, '#f7dd7e', 4, dy - 2, 3, 3); R(g, '#3b2a25', 5, dy - 6, 1, 2);
  }
  if (o.awning) {
    for (let x = 4; x < W - 4; x += 6) { R(g, '#f7ead0', x, wallTop + 6, 3, 6); R(g, '#e25c5c', x + 3, wallTop + 6, 3, 6); }
    R(g, '#b9473a', 4, wallTop + 12, W - 8, 1);
  }
  return outline(c);
}

/* 김(모락모락) 한 점 */
export function puff(g, x, y, life) {
  const s = life > 0.6 ? 1 : 2;
  g.globalAlpha = Math.max(0, Math.min(0.85, life * 1.2));
  g.fillStyle = '#ffffff';
  g.fillRect(Math.round(x), Math.round(y), s, s);
  if (s === 2) g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
  g.globalAlpha = 1;
}
export { PAL, shade, mk, S as SPR };
