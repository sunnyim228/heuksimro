// 모락모락 — 소리 (전부 WebAudio로 합성. 음원 파일 없음)
let ac = null, sfxGain, musGain, noiseBuf;
export const opt = { sfx: true, music: true };
try { Object.assign(opt, JSON.parse(localStorage.getItem('morak-audio') || '{}')); } catch (e) { /* 저장소를 못 쓰면 기본값 */ }
function saveOpt() { try { localStorage.setItem('morak-audio', JSON.stringify(opt)); } catch (e) { /* 무시 */ } }

export function unlock() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  sfxGain = ac.createGain(); sfxGain.gain.value = opt.sfx ? 0.5 : 0; sfxGain.connect(ac.destination);
  musGain = ac.createGain(); musGain.gain.value = opt.music ? 0.16 : 0; musGain.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  setInterval(schedule, 120);
}
export function setSfx(on) { opt.sfx = on; saveOpt(); if (sfxGain) sfxGain.gain.value = on ? 0.5 : 0; }
export function setMusic(on) { opt.music = on; saveOpt(); if (musGain) musGain.gain.value = on ? 0.16 : 0; }

function tone(out, f, t, dur, type = 'triangle', vol = 0.3, slide = 0) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.03);
}
function noise(out, t, dur, vol = 0.2, freq = 3000) {
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02);
}

export function sfx(name) {
  if (!ac || !opt.sfx) return;
  const t = ac.currentTime;
  switch (name) {
    case 'blip': tone(sfxGain, 660, t, 0.05, 'square', 0.08); break;
    case 'pick': tone(sfxGain, 520, t, 0.08, 'triangle', 0.3); tone(sfxGain, 780, t + 0.07, 0.12, 'triangle', 0.3); break;
    case 'put': tone(sfxGain, 300, t, 0.08, 'triangle', 0.3, 0.7); break;
    case 'chop': noise(sfxGain, t, 0.05, 0.35, 1800); tone(sfxGain, 180, t, 0.05, 'square', 0.12); break;
    case 'sizzle': noise(sfxGain, t, 0.5, 0.12, 5200); break;
    case 'done': [784, 988, 1175].forEach((f, i) => tone(sfxGain, f, t + i * 0.09, 0.2, 'triangle', 0.3)); break;
    case 'coin': tone(sfxGain, 1319, t, 0.07, 'square', 0.12); tone(sfxGain, 1760, t + 0.07, 0.18, 'square', 0.12); break;
    case 'no': tone(sfxGain, 220, t, 0.12, 'square', 0.1, 0.8); break;
    case 'door': tone(sfxGain, 392, t, 0.1, 'triangle', 0.25); tone(sfxGain, 523, t + 0.1, 0.16, 'triangle', 0.25); break;
    case 'page': noise(sfxGain, t, 0.12, 0.2, 2400); [659, 784, 988, 1319].forEach((f, i) => tone(sfxGain, f, t + 0.1 + i * 0.1, 0.3, 'triangle', 0.28)); break;
    case 'splash': noise(sfxGain, t, 0.25, 0.25, 900); break;
    case 'bite': tone(sfxGain, 880, t, 0.06, 'square', 0.15); tone(sfxGain, 880, t + 0.1, 0.06, 'square', 0.15); break;
    case 'heart': tone(sfxGain, 880, t, 0.1, 'sine', 0.3); tone(sfxGain, 1109, t + 0.1, 0.2, 'sine', 0.3); break;
    case 'sleep': [523, 440, 392, 330].forEach((f, i) => tone(sfxGain, f, t + i * 0.22, 0.4, 'sine', 0.25)); break;
  }
}

/* ── 배경 음악: 솔 장조의 느린 돌림 ── */
const N = n => 440 * Math.pow(2, (n - 69) / 12);
const CH = [[43, 59, 62, 67], [40, 59, 64, 67], [36, 60, 64, 67], [38, 57, 62, 66]]; // G Em C D (첫 음은 베이스)
const MEL = [
  [71, 0, 74, 0, 71, 69, 67, 0], [64, 0, 67, 0, 71, 0, 69, 0], [72, 0, 76, 0, 74, 72, 71, 0], [69, 0, 0, 0, 74, 0, 0, 0],
  [74, 0, 71, 0, 67, 0, 71, 0], [76, 0, 74, 0, 71, 0, 67, 0], [64, 0, 67, 0, 72, 0, 76, 0], [74, 0, 0, 72, 69, 0, 67, 0],
];
let mood = 'day', step = 0, nextT = 0;
export function setMood(m) { mood = m; }
function schedule() {
  if (!ac || !opt.music || ac.state !== 'running') { nextT = 0; return; }
  const spb = mood === 'service' ? 0.21 : mood === 'night' ? 0.34 : 0.27; // 8분음표 길이
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.3) {
    const bar = Math.floor(step / 8) % 8, i = step % 8, ch = CH[bar % 4];
    if (i === 0 || i === 4) tone(musGain, N(ch[0]), nextT, spb * 3.6, 'triangle', 0.5);
    if (mood !== 'night' || i % 2 === 0) tone(musGain, N(ch[1 + (i % 3)]), nextT, spb * 1.6, 'sine', 0.22);
    const m = MEL[bar][i];
    if (m && mood !== 'night') tone(musGain, N(m), nextT, spb * 2.4, 'triangle', 0.42);
    if (m && mood === 'night' && bar % 2 === 0) tone(musGain, N(m - 12), nextT, spb * 3, 'sine', 0.4);
    if (mood === 'service' && i % 2 === 1) noise(musGain, nextT, 0.03, 0.25, 7000);
    nextT += spb; step++;
  }
}
