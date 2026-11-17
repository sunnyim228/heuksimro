// 앱인토스에 올릴 파일만 dist/ 에 모아요: index.html, js/, fonts/
// (README용 그림, 예전 수첩 앱, 서비스워커는 넣지 않아요)
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = 'dist';
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
cpSync('js', `${out}/js`, { recursive: true });
cpSync('fonts', `${out}/fonts`, { recursive: true });

// 토스 안에서 도는 판이라는 표시. 게임은 이 표시가 있으면 바깥으로 나가는 링크를 숨겨요.
let html = readFileSync('index.html', 'utf8');
const mark = '<script type="module" src="js/game.js"></script>';
if (!html.includes(mark)) throw new Error('index.html에서 게임 스크립트 태그를 찾지 못했어요.');
html = html.replace(mark, `<script>window.__TOSS__ = true;</script>\n${mark}`);
writeFileSync(`${out}/index.html`, html);
console.log('dist/ 준비 완료');
